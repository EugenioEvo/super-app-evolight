import { ReactNode } from 'react';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

/**
 * Layout das páginas de faturamento GD dentro do Super App.
 *
 * Difere do DashboardLayout original do energy-insights: o shell (sidebar +
 * top header) já é fornecido pelo App do Sunflow, então aqui renderizamos
 * apenas o cabeçalho contextual do módulo (título, seletor de mês, export
 * PDF) e o conteúdo.
 */
export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <div className="min-h-full bg-background">
      <Header title={title} subtitle={subtitle} />
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
