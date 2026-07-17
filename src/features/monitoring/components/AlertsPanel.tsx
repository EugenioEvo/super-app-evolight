import { Link } from 'react-router-dom';
import { AlertTriangle, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SolarAlert } from '@/features/monitoring/hooks/useSolarAlerts';
import { SeverityBadge } from './SeverityBadge';
import { EmptyState } from './EmptyState';
import { formatDateTime } from '@/features/monitoring/lib/format';

interface AlertsPanelProps {
  alerts: SolarAlert[];
  isLoading?: boolean;
  isError?: boolean;
  emptyDescription?: string;
}

const statusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
  const s = status.toLowerCase();
  if (s === 'aberto' || s === 'ativo' || s === 'open') return 'default';
  if (s === 'resolvido' || s === 'fechado' || s === 'resolved' || s === 'closed') return 'secondary';
  return 'outline';
};

/**
 * Lista de alertas com severidade, status e link para o ticket de O&M
 * (quando `ticket_id` existir). Trata loading/erro/vazio.
 */
export function AlertsPanel({ alerts, isLoading, isError, emptyDescription }: AlertsPanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Não foi possível carregar os alertas"
        description="Ocorreu um erro ao buscar os alertas. Tente novamente mais tarde."
      />
    );
  }

  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Nenhum alerta"
        description={emptyDescription ?? 'Não há alertas registrados no momento.'}
      />
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="rounded-md border border-border bg-card p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severidade={alert.severidade} />
                <Badge variant={statusVariant(alert.status)}>{alert.status}</Badge>
                {alert.tipo && (
                  <span className="text-xs text-muted-foreground">{alert.tipo}</span>
                )}
              </div>
              <h4 className="mt-2 font-medium text-foreground">
                {alert.titulo ?? 'Alerta sem título'}
              </h4>
              {alert.descricao && (
                <p className="mt-1 text-sm text-muted-foreground">{alert.descricao}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Registrado em {formatDateTime(alert.created_at)}
              </p>
            </div>
            {alert.ticket_id && (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link to="/tickets">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver ticket
                </Link>
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
