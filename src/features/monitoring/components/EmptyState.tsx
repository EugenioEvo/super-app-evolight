import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

/** Estado vazio padronizado (usa apenas tokens de tema). */
export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="bg-card rounded-md border border-dashed border-border p-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
