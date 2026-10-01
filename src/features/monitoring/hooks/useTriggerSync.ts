import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MonitoringProvider } from '@/features/monitoring/types-sync';

const CONNECTOR_FUNCTION: Record<MonitoringProvider, string> = {
  sungrow: 'sungrow-connector',
  solaredge: 'solaredge-connector',
};

export interface TriggerSyncResult {
  success: boolean;
  message?: string;
  error?: string;
  metricsInseridas?: number;
}

/** Dispara "Sincronizar agora" (action: sync_data) na edge function do provider. */
export const useTriggerSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { plantId: string; provider: MonitoringProvider }): Promise<TriggerSyncResult> => {
      const functionName = CONNECTOR_FUNCTION[input.provider];
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { action: 'sync_data', plantId: input.plantId },
      });
      if (error) throw error;
      return data as TriggerSyncResult;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sync_logs', variables.plantId] });
      queryClient.invalidateQueries({ queryKey: ['solar_plants', variables.plantId] });
      queryClient.invalidateQueries({ queryKey: ['solar_plants'] });
      queryClient.invalidateQueries({ queryKey: ['solar_metrics'] });
    },
  });
};

/** Dispara "Testar conexão" (action: test_connection) na edge function do provider. */
export const useTestConnection = () => {
  return useMutation({
    mutationFn: async (input: { plantId: string; provider: MonitoringProvider }): Promise<TriggerSyncResult> => {
      const functionName = CONNECTOR_FUNCTION[input.provider];
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { action: 'test_connection', plantId: input.plantId },
      });
      if (error) throw error;
      return data as TriggerSyncResult;
    },
  });
};
