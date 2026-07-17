import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SeverityBadgeProps {
  severidade: string | null | undefined;
}

const LABELS: Record<string, string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
  info: 'Informativa',
};

/**
 * Badge de severidade de alerta. Cores derivam de tokens de tema
 * (destructive/primary/muted); nada hard-coded fora dos tokens.
 */
export function SeverityBadge({ severidade }: SeverityBadgeProps) {
  const key = (severidade ?? '').toLowerCase();
  const label = LABELS[key] ?? (severidade ? severidade : 'Desconhecida');

  // Mapeia severidade para ênfase visual usando apenas tokens de tema.
  let className = 'bg-muted text-muted-foreground border-transparent';
  if (key === 'critica' || key === 'alta') {
    className = 'bg-destructive/10 text-destructive border-destructive/30';
  } else if (key === 'media') {
    className = 'bg-primary/10 text-primary border-primary/30';
  }

  return (
    <Badge variant="outline" className={cn('font-medium', className)}>
      {label}
    </Badge>
  );
}
