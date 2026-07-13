import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  icon?: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantClass = {
  default: '',
  success: 'kpi-success',
  warning: 'kpi-warning',
  danger: 'kpi-danger',
};

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = 'default',
  className,
}: KPICardProps) {
  return (
    <div className={cn('kpi-card', variantClass[variant], className)}>
      <div className="flex items-center justify-between">
        <p className="kpi-label">{title}</p>
        {icon && <span className="text-muted-foreground/50 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
      </div>
      <p className="kpi-value mt-2">{value}</p>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
      {trend && (
        <div className="flex items-center gap-1.5 mt-3 border-t border-border/60 pt-2.5">
          {trend.value > 0 ? (
            <TrendingUp className={cn('h-3.5 w-3.5', trend.isPositive ? 'text-success' : 'text-destructive')} />
          ) : trend.value < 0 ? (
            <TrendingDown className={cn('h-3.5 w-3.5', trend.isPositive ? 'text-success' : 'text-destructive')} />
          ) : (
            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span
            className={cn(
              'text-sm font-medium tabular-nums',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}
          >
            {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
          </span>
          <span className="text-sm text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
