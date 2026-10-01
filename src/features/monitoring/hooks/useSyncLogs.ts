import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SyncLog } from '@/features/monitoring/types-sync';

// TODO: sync_logs ainda não está em src/integrations/supabase/types.ts
// (migration 20260717100000_monitoring_sync.sql não aplicada). O cast `as any`
// fica isolado neste hook — trocar por `.from('sync_logs')` tipado quando o
// types.ts for regenerado.
const syncLogsTable = () => (supabase as any).from('sync_logs');

/** Últimas entradas de sync_logs de uma usina, mais recentes primeiro. */
export const useSyncLogs = (plantId: string | undefined, limit = 10) => {
  return useQuery({
    queryKey: ['sync_logs', plantId, limit],
    enabled: !!plantId,
    queryFn: async (): Promise<SyncLog[]> => {
      if (!plantId) return [];
      const { data, error } = await syncLogsTable()
        .select('*')
        .eq('plant_id', plantId)
        .order('started_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as SyncLog[];
    },
  });
};
