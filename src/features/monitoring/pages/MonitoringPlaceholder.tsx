import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

/**
 * Ponto de entrada do módulo de Monitoramento.
 *
 * Placeholder da fase fundacional: apenas a rota/navegação existe. O
 * conteúdo real (usinas, geração em tempo real, alarmes etc.) é
 * implementado em uma fase posterior por outro agente.
 */
const MonitoringPlaceholder = () => {
  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">
          Monitoramento
        </h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Acompanhamento de usinas em tempo real
        </p>
      </div>

      <Card className="shadow-lg border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Monitoramento — em construção
          </CardTitle>
          <CardDescription>
            Esta área vai reunir o monitoramento das usinas (geração, alarmes e desempenho) em um só lugar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Estamos preparando esta tela. Em breve você poderá acompanhar aqui os dados de monitoramento das usinas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringPlaceholder;
