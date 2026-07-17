import { Link, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Cpu,
  Gauge,
  Loader2,
  MapPin,
  Percent,
  RefreshCw,
  Sun,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { useSolarPlant } from '@/features/monitoring/hooks/useSolarPlants';
import { useSolarMetrics } from '@/features/monitoring/hooks/useSolarMetrics';
import { useSolarAlerts } from '@/features/monitoring/hooks/useSolarAlerts';
import { KpiCard } from '@/features/monitoring/components/KpiCard';
import { EmptyState } from '@/features/monitoring/components/EmptyState';
import { MetricsChart } from '@/features/monitoring/components/MetricsChart';
import { AlertsPanel } from '@/features/monitoring/components/AlertsPanel';
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
} from '@/features/monitoring/lib/format';

const RANGE_OPTIONS = [
  { value: '1', label: 'Últimas 24h' },
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
];

const PlantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [rangeDays, setRangeDays] = useState('7');

  const plantQuery = useSolarPlant(id);
  const metricsQuery = useSolarMetrics(id, Number(rangeDays));
  const alertsQuery = useSolarAlerts({ plantId: id });

  const plant = plantQuery.data;
  const metrics = metricsQuery.data?.metrics ?? [];
  const aggregates = metricsQuery.data?.aggregates;

  if (plantQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (plantQuery.isError) {
    return (
      <div className="p-6 space-y-4">
        <BackLink />
        <EmptyState
          icon={AlertTriangle}
          title="Não foi possível carregar a usina"
          description="Ocorreu um erro ao buscar os dados da usina. Tente novamente mais tarde."
        />
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="p-6 space-y-4">
        <BackLink />
        <EmptyState
          icon={Sun}
          title="Usina não encontrada"
          description="A usina solicitada não existe ou foi removida."
        />
      </div>
    );
  }

  const inversor = [plant.marca_inversor, plant.modelo_inversor].filter(Boolean).join(' ');

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <BackLink />

      {/* Cabeçalho da usina */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Sun className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{plant.nome}</h1>
                  <Badge variant={plant.ativo ? 'default' : 'secondary'}>
                    {plant.ativo ? 'Ativa' : 'Inativa'}
                  </Badge>
                  {plant.solarz_status && (
                    <Badge variant="outline">SolarZ: {plant.solarz_status}</Badge>
                  )}
                </div>
                {(plant.endereco || plant.cidade || plant.estado) && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {[plant.endereco, [plant.cidade, plant.estado].filter(Boolean).join(' - ')]
                      .filter(Boolean)
                      .join(' • ')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" />
              Última sincronização: {formatDateTime(plant.ultima_sincronizacao)}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Potência instalada</p>
              <p className="font-medium text-foreground">
                {plant.potencia_kwp !== null ? `${formatNumber(plant.potencia_kwp, 1)} kWp` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inversor</p>
              <p className="font-medium text-foreground flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                {inversor || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Serial do inversor</p>
              <p className="font-medium text-foreground">{plant.serial_inversor ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Instalação</p>
              <p className="font-medium text-foreground">{formatDate(plant.data_instalacao)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas atuais / agregados do período */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-foreground">Métricas</h2>
        <Select value={rangeDays} onValueChange={setRangeDays}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Geração no período"
          value={
            metricsQuery.isLoading
              ? '…'
              : `${formatNumber(aggregates?.geracaoTotalKwh ?? 0, 1)} kWh`
          }
          icon={BarChart3}
        />
        <KpiCard
          label="Potência média"
          value={
            metricsQuery.isLoading
              ? '…'
              : aggregates?.potenciaMediaKw !== null && aggregates !== undefined
                ? `${formatNumber(aggregates.potenciaMediaKw, 2)} kW`
                : '—'
          }
          icon={Gauge}
        />
        <KpiCard
          label="Eficiência média"
          value={
            metricsQuery.isLoading ? '…' : formatPercent(aggregates?.eficienciaMediaPercent)
          }
          icon={Percent}
        />
        <KpiCard
          label="Potência atual"
          value={
            metricsQuery.isLoading
              ? '…'
              : aggregates?.potenciaAtualKw !== null && aggregates !== undefined
                ? `${formatNumber(aggregates.potenciaAtualKw, 2)} kW`
                : '—'
          }
          hint={
            aggregates?.ultimaLeitura
              ? `Leitura de ${formatDateTime(aggregates.ultimaLeitura)}`
              : undefined
          }
          icon={Zap}
        />
      </div>

      {/* Gráfico de série temporal */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Geração e potência ao longo do tempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metricsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : metricsQuery.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Não foi possível carregar as métricas"
              description="Ocorreu um erro ao buscar a série temporal. Tente novamente mais tarde."
            />
          ) : metrics.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Sem métricas no período"
              description="Nenhuma leitura registrada para esta usina no intervalo selecionado."
            />
          ) : (
            <MetricsChart metrics={metrics} />
          )}
        </CardContent>
      </Card>

      {/* Alertas da usina */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Alertas da usina</h2>
        <AlertsPanel
          alerts={alertsQuery.data?.alerts ?? []}
          isLoading={alertsQuery.isLoading}
          isError={alertsQuery.isError}
          emptyDescription="Nenhum alerta registrado para esta usina."
        />
      </div>
    </div>
  );
};

const BackLink = () => (
  <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
    <Link to="/monitoring">
      <ArrowLeft className="h-4 w-4" />
      Voltar ao monitoramento
    </Link>
  </Button>
);

export default PlantDetail;
