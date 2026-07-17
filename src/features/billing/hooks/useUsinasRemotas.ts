import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type ClassificacaoGD = 'gd1' | 'gd2';

// A usina canônica no schema unificado é a tabela `cliente_ufvs`.
// Mantemos o nome UsinaRemota para não quebrar os consumidores do módulo billing.
// Atenção: potencia_instalada_kw (schema antigo) → potencia_kwp (schema novo).
export type UsinaRemota = Tables<'cliente_ufvs'>;

// `cliente_id` e `solarz_ufv_id` são obrigatórios no banco unificado, mas não
// existiam no schema antigo do billing — tornamos opcionais na interface e
// resolvemos no hook (erro claro / fallback) para tolerar a ausência.
export type UsinaRemotaInsert = Omit<TablesInsert<'cliente_ufvs'>, 'cliente_id' | 'solarz_ufv_id'> & {
  cliente_id?: string;
  solarz_ufv_id?: string;
};
export type UsinaRemotaUpdate = TablesUpdate<'cliente_ufvs'>;

export const useUsinasRemotas = () => {
  return useQuery({
    queryKey: ['usinas_remotas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cliente_ufvs')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data as UsinaRemota[];
    },
  });
};

export const useUsinaRemota = (id: string | undefined) => {
  return useQuery({
    queryKey: ['usinas_remotas', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('cliente_ufvs')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as UsinaRemota | null;
    },
    enabled: !!id,
  });
};

export const useCreateUsinaRemota = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (usina: UsinaRemotaInsert) => {
      const { cliente_id, solarz_ufv_id, ...rest } = usina;
      if (!cliente_id) {
        throw new Error('cliente_id é obrigatório para cadastrar uma UFV no schema unificado');
      }
      const insertRow: TablesInsert<'cliente_ufvs'> = {
        ...rest,
        cliente_id,
        solarz_ufv_id: solarz_ufv_id ?? crypto.randomUUID(),
      };
      const { data, error } = await supabase
        .from('cliente_ufvs')
        .insert(insertRow)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usinas_remotas'] });
    },
  });
};

export const useUpdateUsinaRemota = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UsinaRemotaUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('cliente_ufvs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usinas_remotas'] });
    },
  });
};

export const useDeleteUsinaRemota = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cliente_ufvs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usinas_remotas'] });
    },
  });
};
