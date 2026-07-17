import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Sun,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSolarPlants } from '@/features/monitoring/hooks/useSolarPlants';
import { useSolarAlerts } from '@/features/monitoring/hooks/useSolarAlerts';
import { KpiCard } from '@/features/monitoring/components/KpiCard';
import { EmptyState } from '@/features/monitoring/components/EmptyState';
import { AlertsPanel } from '@/features/monitoring/components/AlertsPanel';
import { formatDateTime, formatNumber } from '@/features/monitoring/lib/format';

type AtivoFilter = 'todas' | 'ativas' | 'inativas';

const OPEN_ALERT_STATUSES = ['aberto', 'ativo', 'open'];

const PlantsList = () => {
  const [search, setSearch] = useState('');
  const [ativoFilter, setAtivoFilter] = useState<AtivoFilter>('todas');

  const plantsQuery = useSolarPlants({
    search,
    ativo: ativoFilter === 'todas' ? undefined : ativoFilter === 'ativas',
  });
  const alertsQuery = useSolarAlerts();

  const plants = plantsQuery.data ?? [];
  const alerts = alertsQuery.data?.alerts ?? [];

  const kpis = useMemo(() => {
    const ativas = plants.filter((p) => p.ativo);
    const potenciaTotal = ativas.reduce((acc, p) => acc + (p.potencia_kwp ?? 0), 0);
    const abertos = alerts.filter((a) =>
      OPEN_ALERT_STATUSES.includes(a.status.toLowerCase())
    ).length;
    const ultimaSync = plants.reduce<string | null>((acc, p) => {
      if (!p.ultima_sincronizacao) return acc;
      if (!acc || p.ultima_sincronizacao > acc) return p.ultima_sincronizacao;
      return acc;
    }, null);
    return { ativas: ativas.length, potenciaTotal, abertos, ultimaSync };
  }, [plants, alerts]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Monitoramento</h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Acompanhamento das usinas solares
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Usinas ativas"
          value={plantsQuery.isLoading ? '…' : formatNumber(kpis.ativas)}
          icon={Sun}
        />
        <KpiCard
          label="Potência instalada"
          value={plantsQuery.isLoading ? '…' : `${formatNumber(kpis.potenciaTotal, 1)} kWp`}
          hint="Somatório das usinas ativas"
          icon={Zap}
        />
        <KpiCard
          label="Alertas abertos"
          value={alertsQuery.isLoading ? '…' : formatNumber(kpis.abertos)}
          icon={AlertTriangle}
        />
        <KpiCard
          label="Última sincronização"
          value={plantsQuery.isLoading ? '…' : formatDateTime(kpis.ultimaSync)}
          hint="SolarZ"
          icon={RefreshCw}
        />
      </div>

      <Tabs defaultValue="usinas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usinas">Usinas</TabsTrigger>
          <TabsTrigger value="alertas" className="gap-2">
            Alertas
            {(alertsQuery.data?.counts.total ?? 0) > 0 && (
              <Badge variant="secondary">{alertsQuery.data?.counts.total}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usinas" className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou cidade..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={ativoFilter} onValueChange={(v: AtivoFilter) => setAtivoFilter(v)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="ativas">Ativas</SelectItem>
                <SelectItem value="inativas">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista */}
          {plantsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : plantsQuery.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Não foi possível carregar as usinas"
              description="Ocorreu um erro ao buscar as usinas. Tente novamente mais tarde."
            />
          ) : plants.length === 0 ? (
            <EmptyState
              icon={Sun}
              title={
                search || ativoFilter !== 'todas'
                  ? 'Nenhuma usina encontrada'
                  : 'Nenhuma usina cadastrada ainda'
              }
              description={
                search || ativoFilter !== 'todas'
                  ? 'Ajuste a busca ou os filtros para encontrar usinas.'
                  : 'Quando as usinas forem cadastradas e sincronizadas, elas aparecerão aqui.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {plants.map((plant) => (
                <Link
                  key={plant.id}
                  to={`/monitoring/${plant.id}`}
                  className="group rounded-md border border-border bg-card p-5 transition-colors hover:border-primary/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <Sun className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{plant.nome}</h3>
                        {(plant.cidade || plant.estado) && (
                          <p className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {[plant.cidade, plant.estado].filter(Boolean).join(' - ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge variant={plant.ativo ? 'default' : 'secondary'}>
                      {plant.ativo ? 'Ativa' : 'Inativa'}
                    </Badge>
                    {plant.solarz_status && (
                      <Badge variant="outline">SolarZ: {plant.solarz_status}</Badge>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Potência</p>
                      <p className="font-medium text-foreground">
                        {plant.potencia_kwp !== null
                          ? `${formatNumber(plant.potencia_kwp, 1)} kWp`
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Última sincronização</p>
                      <p className="font-medium text-foreground">
                        {formatDateTime(plant.ultima_sincronizacao)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alertas">
          <AlertsPanel
            alerts={alerts}
            isLoading={alertsQuery.isLoading}
            isError={alertsQuery.isError}
            emptyDescription="Nenhum alerta registrado nas usinas monitoradas."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlantsList;
