import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { SolarMetric } from '@/features/monitoring/hooks/useSolarMetrics';
import { formatAxisTime, formatDateTime, formatNumber } from '@/features/monitoring/lib/format';

interface MetricsChartProps {
  metrics: SolarMetric[];
}

/**
 * Gráfico de série temporal (geração kWh e potência kW ao longo do tempo).
 * Cores derivam de tokens de tema (--primary / --muted-foreground).
 */
export function MetricsChart({ metrics }: MetricsChartProps) {
  const data = metrics.map((m) => ({
    ts: m.timestamp,
    label: formatAxisTime(m.timestamp),
    geracao: m.geracao_kwh ?? 0,
    potencia: m.potencia_instantanea_kw ?? 0,
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 4 }}>
          <defs>
            <linearGradient id="colorGeracaoMon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPotenciaMon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.25} />
              <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(v: number) => formatNumber(v, 0)}
          />
          <Tooltip
            labelFormatter={(_, payload) => {
              const ts = payload?.[0]?.payload?.ts as string | undefined;
              return formatDateTime(ts);
            }}
            formatter={(value: number, name: string) =>
              name === 'Geração (kWh)'
                ? [`${formatNumber(value, 2)} kWh`, name]
                : [`${formatNumber(value, 2)} kW`, name]
            }
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend wrapperStyle={{ paddingTop: '12px', fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="geracao"
            name="Geração (kWh)"
            stroke="hsl(var(--primary))"
            fill="url(#colorGeracaoMon)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="potencia"
            name="Potência (kW)"
            stroke="hsl(var(--muted-foreground))"
            fill="url(#colorPotenciaMon)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
