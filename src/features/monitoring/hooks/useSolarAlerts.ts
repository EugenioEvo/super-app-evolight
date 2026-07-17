import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type SolarAlert = Tables<'solar_alerts'>;

export interface SolarAlertsCounts {
  total: number;
  /** Contagem por severidade (chave normalizada em minúsculas). */
  porSeveridade: Record<string, number>;
}

export interface SolarAlertsResult {
  alerts: SolarAlert[];
  counts: SolarAlertsCounts;
}

export interface UseSolarAlertsOptions {
  /** Filtra por status (ex.: 'aberto'). */
  status?: string;
  /** Restringe a uma usina específica. */
  plantId?: string;
}

/**
 * Alertas de monitoramento com contagem por severidade. Trata vazio
 * (série [] + contagens zeradas) e erro (lança para o React Query).
 */
export const useSolarAlerts = (options: UseSolarAlertsOptions = {}) => {
  const { status, plantId } = options;

  return useQuery({
    queryKey: ['solar_alerts', { status: status ?? null, plantId: plantId ?? null }],
    queryFn: async (): Promise<SolarAlertsResult> => {
      let query = supabase
        .from('solar_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);
      if (plantId) query = query.eq('plant_id', plantId);

      const { data, error } = await query;
      if (error) throw error;

      const alerts = data ?? [];
      const porSeveridade: Record<string, number> = {};
      for (const a of alerts) {
        const key = (a.severidade ?? 'desconhecida').toLowerCase();
        porSeveridade[key] = (porSeveridade[key] ?? 0) + 1;
      }

      return {
        alerts,
        counts: { total: alerts.length, porSeveridade },
      };
    },
  });
};
