import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  className?: string;
}

/** Card de KPI reutilizável (usa apenas tokens de tema). */
export function KpiCard({ label, value, icon: Icon, hint, className }: KpiCardProps) {
  return (
    <Card className={cn('shadow-sm', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground truncate">{hint}</p>}
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
