import React, { useMemo } from 'react';
import { DashboardLayout } from '@/features/billing/components/layout/DashboardLayout';
import { useEnergy } from '@/features/billing/context/EnergyContext';
import { useAuthContext } from '@/features/billing/context/BillingAuth';
import { Loader2, DollarSign, Plug, Battery, Users, Sun, CheckCircle2 } from 'lucide-react';
import { KPICard } from '@/features/billing/components/dashboard/KPICard';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/billing/formatters';

export default function DashboardGerador() {
    const { isGerador, isAdmin } = useAuthContext();
    const { isLoading, faturas, unidadesConsumidoras: ucs, mesAtual } = useEnergy();

    const metricasMesAtual = useMemo(() => {
        // Filtro faturas do mês selecionado
        const faturasDoMes = faturas.filter(f => f.mes_ref === mesAtual);

        let injecaoTotalKwh = 0;
        let receitaEstimaRs = 0;
        let compensacaoRealizadaKwh = 0;
        let consumidoresAtivos = new Set();

        faturasDoMes.forEach(f => {
            // Injeção da usina
            injecaoTotalKwh += Number(f.injecao_total_kwh) || 0;

            // Receita é baseada no custo que a gestora cobra pelo crédito (custo_assinatura_rs) 
            // Em uma usina real, haveria um % de spread da gestora, mas somaremos o custo total
            // Custo_assinatura_rs é efetivamente o montante financeiro faturado contra o consumidor pelo crédito
            receitaEstimaRs += Number(f.custo_assinatura_rs) || 0;

            // Kwh efetivamente compensados nos consumidores
            compensacaoRealizadaKwh += Number(f.credito_remoto_kwh) || 0;

            if (Number(f.credito_remoto_kwh) > 0 || Number(f.custo_assinatura_rs) > 0) {
                consumidoresAtivos.add(f.uc_id);
            }
        });

        const eficienciaAlocacao = injecaoTotalKwh > 0
            ? (compensacaoRealizadaKwh / injecaoTotalKwh) * 100
            : 0;

        return {
            injecaoTotalKwh,
            receitaEstimaRs,
            compensacaoRealizadaKwh,
            consumidoresAtivos: consumidoresAtivos.size,
            eficienciaAlocacao
        };
    }, [faturas, mesAtual]);

    // Histórico de Faturamento para Tabela Resumo
    const faturasComContratos = useMemo(() => {
        return faturas
            .filter(f => Number(f.custo_assinatura_rs) > 0)
            .sort((a, b) => b.mes_ref.localeCompare(a.mes_ref));
    }, [faturas]);

    if (!isGerador && !isAdmin) {
        return (
            <DashboardLayout title="Acesso Negado">
                <div className="flex justify-center items-center h-64">
                    <p className="text-muted-foreground">Esta visão é exclusiva para Geradores parceiros.</p>
                </div>
            </DashboardLayout>
        );
    }

    if (isLoading) {
        return (
            <DashboardLayout title="Dashboard do Gerador" subtitle="Visão Executiva da Usina">
                <div className="flex h-[400px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Painel do Gerador" subtitle={`Rendimentos e Desempenho da Usina • ${mesAtual}`}>
            <div className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        title="Receita Gerada (Mês)"
                        value={formatCurrency(metricasMesAtual.receitaEstimaRs)}
                        subtitle="Faturamento Total"
                        icon={<DollarSign className="h-6 w-6" />}
                        variant="success"
                    />
                    <KPICard
                        title="Energia Injetada (Mês)"
                        value={`${formatNumber(metricasMesAtual.injecaoTotalKwh)} kWh`}
                        subtitle="Na rede da concessionária"
                        icon={<Plug className="h-6 w-6" />}
                    />
                    <KPICard
                        title="Consumidores Alocados"
                        value={metricasMesAtual.consumidoresAtivos.toString()}
                        subtitle="Unidades recebendo créditos"
                        icon={<Users className="h-6 w-6" />}
                    />
                    <KPICard
                        title="Eficiência de Alocação"
                        value={formatPercent(metricasMesAtual.eficienciaAlocacao)}
                        subtitle={`${formatNumber(metricasMesAtual.compensacaoRealizadaKwh)} kWh alocados`}
                        icon={<Sun className="h-6 w-6" />}
                        variant={metricasMesAtual.eficienciaAlocacao >= 95 ? 'success' : 'warning'}
                    />
                </div>

                {/* Status de Recebimentos / Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Status de Faturamento — {mesAtual}
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-border">
                                <span className="text-muted-foreground">Volume de Créditos Repassados</span>
                                <span className="font-medium">{formatNumber(metricasMesAtual.compensacaoRealizadaKwh)} kWh</span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-b border-border">
                                <span className="text-muted-foreground">Valor Bruto Faturado</span>
                                <span className="font-medium text-green-600">{formatCurrency(metricasMesAtual.receitaEstimaRs)}</span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-b border-border">
                                <span className="text-muted-foreground">Taxa da Gestora (Exemplo 15%)</span>
                                <span className="font-medium text-amber-600">- {formatCurrency(metricasMesAtual.receitaEstimaRs * 0.15)}</span>
                            </div>

                            <div className="flex justify-between items-center py-3 -mx-6 px-6 bg-green-50 dark:bg-green-950/30 rounded-lg mt-2">
                                <span className="font-semibold">Receita Líquida Estimada</span>
                                <span className="font-bold text-lg text-green-600">{formatCurrency(metricasMesAtual.receitaEstimaRs * 0.85)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Consumidores Ativos */}
                    <div className="bg-card rounded-xl border border-border p-6 overflow-hidden flex flex-col">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
                            Principais Consumidores ({mesAtual})
                        </h3>
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">UC</th>
                                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">Créditos</th>
                                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">Fatura</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {faturasComContratos
                                        .filter(f => f.mes_ref === mesAtual)
                                        .slice(0, 5) // Mostrar apenas o Top 5
                                        .map((fatura, idx) => {
                                            const uc = ucs.find(u => u.id === fatura.uc_id);
                                            return (
                                                <tr key={fatura.id || idx} className="border-b border-border/50 hover:bg-muted/30">
                                                    <td className="py-3 px-2 font-medium">{uc?.numero || 'Desconhecida'}</td>
                                                    <td className="text-right py-3 px-2">{formatNumber(Number(fatura.credito_remoto_kwh))} kWh</td>
                                                    <td className="text-right py-3 px-2 font-medium text-green-600">
                                                        {formatCurrency(Number(fatura.custo_assinatura_rs))}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    {faturasComContratos.filter(f => f.mes_ref === mesAtual).length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="text-center py-4 text-muted-foreground">
                                                Nenhum faturamento registrado neste mês.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
