import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type SolarPlant = Tables<'solar_plants'>;

export interface UseSolarPlantsOptions {
  /** Se definido, filtra por usinas ativas/inativas. */
  ativo?: boolean;
  /** Busca livre por nome ou cidade (case-insensitive). */
  search?: string;
}

/**
 * Lista de usinas solares. Trata vazio (retorna []) e erro (lança para o
 * React Query expor via `isError`/`error`). Nunca usa `.single()`.
 */
export const useSolarPlants = (options: UseSolarPlantsOptions = {}) => {
  const { ativo, search } = options;

  return useQuery({
    queryKey: ['solar_plants', { ativo: ativo ?? null, search: search ?? '' }],
    queryFn: async (): Promise<SolarPlant[]> => {
      let query = supabase.from('solar_plants').select('*').order('nome');

      if (ativo !== undefined) {
        query = query.eq('ativo', ativo);
      }

      const term = search?.trim();
      if (term) {
        // Busca por nome OU cidade.
        query = query.or(`nome.ilike.%${term}%,cidade.ilike.%${term}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
};

/**
 * Detalhe de uma usina. Usa `.maybeSingle()` para tolerar 0 linhas
 * (retorna `null` em vez de lançar).
 */
export const useSolarPlant = (id: string | undefined) => {
  return useQuery({
    queryKey: ['solar_plants', id],
    enabled: !!id,
    queryFn: async (): Promise<SolarPlant | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('solar_plants')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
};
