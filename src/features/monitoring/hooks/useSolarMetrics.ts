import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type SolarMetric = Tables<'solar_metrics'>;

export interface SolarMetricsAggregates {
  /** Nº de amostras no período. */
  amostras: number;
  /** Soma de geracao_kwh. */
  geracaoTotalKwh: number;
  /** Média de potencia_instantanea_kw (ignora nulos). */
  potenciaMediaKw: number | null;
  /** Média de eficiencia_percent (ignora nulos). */
  eficienciaMediaPercent: number | null;
  /** Potência instantânea da amostra mais recente. */
  potenciaAtualKw: number | null;
  /** Timestamp da amostra mais recente. */
  ultimaLeitura: string | null;
}

export interface SolarMetricsResult {
  metrics: SolarMetric[];
  aggregates: SolarMetricsAggregates;
}

const EMPTY_AGGREGATES: SolarMetricsAggregates = {
  amostras: 0,
  geracaoTotalKwh: 0,
  potenciaMediaKw: null,
  eficienciaMediaPercent: null,
  potenciaAtualKw: null,
  ultimaLeitura: null,
};

const average = (values: Array<number | null>): number | null => {
  const nums = values.filter((v): v is number => v !== null && v !== undefined && !Number.isNaN(v));
  if (nums.length === 0) return null;
  return nums.reduce((acc, v) => acc + v, 0) / nums.length;
};

/**
 * Série temporal de métricas dos últimos `rangeDays` dias para uma usina,
 * ordenada por timestamp ascendente. Deriva agregados (geração total,
 * potência média, eficiência média). Trata vazio devolvendo série [] e
 * agregados zerados/nulos — nunca quebra.
 */
export const useSolarMetrics = (plantId: string | undefined, rangeDays = 7) => {
  return useQuery({
    queryKey: ['solar_metrics', plantId, rangeDays],
    enabled: !!plantId,
    queryFn: async (): Promise<SolarMetricsResult> => {
      if (!plantId) return { metrics: [], aggregates: EMPTY_AGGREGATES };

      const since = new Date();
      since.setDate(since.getDate() - rangeDays);

      const { data, error } = await supabase
        .from('solar_metrics')
        .select('*')
        .eq('plant_id', plantId)
        .gte('timestamp', since.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      const metrics = data ?? [];
      if (metrics.length === 0) {
        return { metrics, aggregates: EMPTY_AGGREGATES };
      }

      const last = metrics[metrics.length - 1];
      const aggregates: SolarMetricsAggregates = {
        amostras: metrics.length,
        geracaoTotalKwh: metrics.reduce((acc, m) => acc + (m.geracao_kwh ?? 0), 0),
        potenciaMediaKw: average(metrics.map((m) => m.potencia_instantanea_kw)),
        eficienciaMediaPercent: average(metrics.map((m) => m.eficiencia_percent)),
        potenciaAtualKw: last.potencia_instantanea_kw,
        ultimaLeitura: last.timestamp,
      };

      return { metrics, aggregates };
    },
  });
};
