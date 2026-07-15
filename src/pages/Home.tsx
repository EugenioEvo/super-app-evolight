import DashboardStats from "@/components/DashboardStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity, LayoutGrid } from "lucide-react";
import { useGlobalRealtime } from "@/hooks/useRealtimeProvider";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { startOfMonth, endOfMonth, eachDayOfInterval, format as formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HOME_SECTIONS, hasAnyRole, type Role } from "@/lib/navigation";

const PerformanceMetrics = () => {
  const [metricsData, setMetricsData] = useState<any>({
    ticketsPorMes: [],
    slaData: [],
    tempoMedio: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);

    // Tickets resolvidos por dia no mês
    const { data: tickets } = await supabase
      .from('tickets')
      .select('created_at, data_conclusao, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const ticketsPorDia = days.map(day => {
      const dayStr = formatDate(day, 'dd/MM', { locale: ptBR });
      const count = tickets?.filter(t =>
        t.data_conclusao && new Date(t.data_conclusao).toDateString() === day.toDateString()
      ).length || 0;
      return { dia: dayStr, resolvidos: count };
    });

    // SLA (tickets concluídos vs total)
    const total = tickets?.length || 0;
    const concluidos = tickets?.filter(t => t.status === 'concluido').length || 0;
    const slaData = [
      { name: 'Concluídos', value: concluidos, color: '#10b981' },
      { name: 'Pendentes', value: total - concluidos, color: '#f59e0b' }
    ];

    // Tempo médio de resolução (simplificado)
    const temposResolucao = tickets?.filter(t => t.data_conclusao && t.created_at).map(t => {
      const criado = new Date(t.created_at);
      const concluido = new Date(t.data_conclusao);
      return (concluido.getTime() - criado.getTime()) / (1000 * 60 * 60 * 24); // dias
    }) || [];
    const tempoMedio = temposResolucao.length > 0
      ? temposResolucao.reduce((a, b) => a + b, 0) / temposResolucao.length
      : 0;

    setMetricsData({
      ticketsPorMes: ticketsPorDia.slice(-7),
      slaData,
      tempoMedio: Math.round(tempoMedio * 10) / 10
    });
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tempo Médio */}
      <div className="text-center p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground mb-1">Tempo Médio de Resolução</p>
        <p className="text-3xl font-bold text-primary">{metricsData.tempoMedio} dias</p>
      </div>

      {/* Taxa de SLA */}
      <div>
        <p className="text-sm font-medium mb-3">Taxa de Conclusão</p>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={metricsData.slaData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={5}
              dataKey="value"
            >
              {metricsData.slaData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Tickets Resolvidos */}
      <div>
        <p className="text-sm font-medium mb-3">Tickets Resolvidos (Últimos 7 dias)</p>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={metricsData.ticketsPorMes}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="resolvidos" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/**
 * Hub inicial do Super App: grade de cards por domínio (Operação, Monitoramento,
 * Faturamento GD, Administração), cada um levando direto à funcionalidade.
 * As seções/itens exibidos respeitam as mesmas roles usadas na Sidebar
 * (fonte única em `src/lib/navigation.ts`).
 */
const FeatureHub = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const userRoles = (profile?.roles ?? []) as Role[];

  const visibleSections = HOME_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasAnyRole(userRoles, item.allow)),
    }))
    .filter((section) => section.items.length > 0);

  if (visibleSections.length === 0) return null;

  return (
    <div className="space-y-8">
      {visibleSections.map((section) => (
        <div key={section.id} className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{section.label}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {section.items.map((item) => (
              <Card
                key={item.key}
                role="button"
                tabIndex={0}
                onClick={() => navigate(item.url)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') navigate(item.url);
                }}
                className="cursor-pointer shadow-sm hover:shadow-lg hover:border-primary/50 transition-all border-muted"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                {item.description && (
                  <CardContent className="pt-0">
                    <CardDescription>{item.description}</CardDescription>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const Home = () => {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const loadRecentActivity = async () => {
    const { data } = await supabase
      .from('status_historico')
      .select(`
        *,
        tickets(numero_ticket, titulo),
        profiles:alterado_por(nome)
      `)
      .order('data_alteracao', { ascending: false })
      .limit(5);

    setRecentActivity(data || []);
  };

  useEffect(() => {
    loadRecentActivity();
  }, []);

  useGlobalRealtime(loadRecentActivity);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'aberto': 'Aberto',
      'aguardando_aprovacao': 'Aguardando Aprovação',
      'aprovado': 'Aprovado',
      'rejeitado': 'Rejeitado',
      'ordem_servico_gerada': 'OS Gerada',
      'em_execucao': 'Em Execução',
      'concluido': 'Concluído',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status;
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">
          Início
        </h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          Visão geral do Super App
        </p>
      </div>

      <FeatureHub />

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow border-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Atividade Recente
            </CardTitle>
            <CardDescription>Últimas atualizações de status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {activity.tickets?.numero_ticket} - {activity.tickets?.titulo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getStatusLabel(activity.status_anterior)} → {getStatusLabel(activity.status_novo)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.data_alteracao).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow border-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Performance
            </CardTitle>
            <CardDescription>Métricas de eficiência do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceMetrics />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
