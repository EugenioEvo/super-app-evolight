import { useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Adaptador de autenticação do módulo de faturamento GD (energy-insights).
 *
 * O código transplantado do energy-insights consumia um AuthContext próprio com
 * a forma { user, isAdmin, isGerador, isLoading, clienteIds }. No Super App a
 * fonte de verdade é o useAuth do Sunflow (profile + roles). Este hook faz a
 * ponte sem criar um segundo provider de auth:
 *  - isAdmin: role 'admin' do Sunflow (staff pleno);
 *  - isGerador: role 'gerador' (se existir no banco fundido; senão false);
 *  - clienteIds: clientes cujo profile_id é o profile do usuário logado
 *    (vínculo canônico do Sunflow: clientes.profile_id -> profiles.id).
 */
interface BillingAuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isGerador: boolean;
  isLoading: boolean;
  clienteIds: string[];
}

export function useAuthContext(): BillingAuthState {
  const { user, session, profile, loading } = useAuth();

  const roles = (profile?.roles ?? []) as string[];
  // Staff do Sunflow com visão administrativa do faturamento.
  const isAdmin = roles.includes('admin');
  const isGerador = roles.includes('gerador');

  const profileId = profile?.id;
  const { data: clienteIds = [], isLoading: loadingVinculos } = useQuery({
    queryKey: ['billing', 'clientes-do-profile', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('id')
        .eq('profile_id', profileId!);
      if (error) throw error;
      return (data ?? []).map((c) => c.id);
    },
    enabled: !!profileId && !isAdmin,
  });

  return useMemo(
    () => ({
      user,
      session,
      isAdmin,
      isGerador,
      isLoading: loading || (!!user && !isAdmin && loadingVinculos),
      clienteIds,
    }),
    [user, session, isAdmin, isGerador, loading, loadingVinculos, clienteIds]
  );
}
