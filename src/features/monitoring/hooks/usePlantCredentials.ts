import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  MonitoringProvider,
  PlantCredential,
  ProviderCredentialsPayload,
} from '@/features/monitoring/types-sync';

// TODO: plant_credentials ainda não está em src/integrations/supabase/types.ts
// (migration 20260717100000_monitoring_sync.sql não aplicada). O cast `as any`
// fica isolado neste hook — trocar por `.from('plant_credentials')` tipado
// quando o types.ts for regenerado.
const plantCredentialsTable = () => (supabase as any).from('plant_credentials');

/** Credenciais de sincronização cadastradas para uma usina (Sungrow/SolarEdge). */
export const usePlantCredentials = (plantId: string | undefined) => {
  return useQuery({
    queryKey: ['plant_credentials', plantId],
    enabled: !!plantId,
    queryFn: async (): Promise<PlantCredential[]> => {
      if (!plantId) return [];
      const { data, error } = await plantCredentialsTable()
        .select('*')
        .eq('plant_id', plantId)
        .order('provider');
      if (error) throw error;
      return (data ?? []) as PlantCredential[];
    },
  });
};

export interface UpsertPlantCredentialInput {
  plantId: string;
  provider: MonitoringProvider;
  credentials: ProviderCredentialsPayload;
  ativo?: boolean;
}

/** Cria ou atualiza a credencial de um provider para uma usina (UNIQUE plant_id+provider). */
export const useUpsertPlantCredential = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertPlantCredentialInput) => {
      const { data, error } = await plantCredentialsTable()
        .upsert(
          {
            plant_id: input.plantId,
            provider: input.provider,
            credentials: input.credentials,
            ativo: input.ativo ?? true,
          },
          { onConflict: 'plant_id,provider' }
        )
        .select()
        .single();
      if (error) throw error;
      return data as PlantCredential;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plant_credentials', variables.plantId] });
    },
  });
};

/** Ativa/desativa sincronização automática (solar_plants.sync_enabled + monitoring_provider). */
export const useUpdatePlantSyncSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      plantId: string;
      syncEnabled: boolean;
      monitoringProvider?: MonitoringProvider | 'manual' | null;
      apiSiteId?: string | null;
    }) => {
      const update: Record<string, unknown> = { sync_enabled: input.syncEnabled };
      if (input.monitoringProvider !== undefined) update.monitoring_provider = input.monitoringProvider;
      if (input.apiSiteId !== undefined) update.api_site_id = input.apiSiteId;

      const { data, error } = await supabase
        .from('solar_plants')
        .update(update)
        .eq('id', input.plantId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['solar_plants', variables.plantId] });
      queryClient.invalidateQueries({ queryKey: ['solar_plants'] });
    },
  });
};
