import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/features/billing/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, CheckCircle, Clock, AlertCircle, Zap, Plus } from 'lucide-react';
import { TarifasTable } from '@/features/billing/components/tarifas/TarifasTable';
import { EditTarifaModal } from '@/features/billing/components/tarifas/EditTarifaModal';

export default function Tarifas() {
  const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Buscar tarifas do banco
  const { data: tarifas, isLoading } = useQuery({
    queryKey: ['tarifas-concessionaria'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarifas_concessionaria')
        .select('*')
        .eq('ativo', true)
        .order('subgrupo', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const tarifasGrupoA = tarifas?.filter((t) => t.grupo_tarifario === 'A') || [];
  const tarifasGrupoB = tarifas?.filter((t) => t.grupo_tarifario === 'B') || [];

  const ultimaAtualizacao = tarifas?.[0]?.updated_at
    ? new Date(tarifas[0].updated_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const resolucaoAtual = tarifas?.[0]?.resolucao_aneel;
  const vigenciaAtual = tarifas?.[0]?.vigencia_inicio
    ? new Date(tarifas[0].vigencia_inicio).toLocaleDateString('pt-BR')
    : null;

  return (
    <DashboardLayout title="Gerenciamento de Tarifas" subtitle="Cadastre e mantenha as tarifas homologadas pela ANEEL">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-end">
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Tarifa (Grupo {activeTab})
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Concessionária</p>
                  <p className="font-semibold">Equatorial Goiás</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resolução ANEEL</p>
                  <p className="font-semibold">{resolucaoAtual || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vigência</p>
                  <p className="font-semibold">{vigenciaAtual || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última Atualização</p>
                  <p className="font-semibold text-sm">{ultimaAtualizacao || 'Nunca'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Tarifas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tarifas Vigentes</CardTitle>
                <CardDescription>
                  {tarifas?.length || 0} tarifas cadastradas
                </CardDescription>
              </div>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'A' | 'B')}>
                <TabsList>
                  <TabsTrigger value="A" className="gap-2">
                    <Badge variant="outline" className="font-mono">A</Badge>
                    Alta Tensão ({tarifasGrupoA.length})
                  </TabsTrigger>
                  <TabsTrigger value="B" className="gap-2">
                    <Badge variant="outline" className="font-mono">B</Badge>
                    Baixa Tensão ({tarifasGrupoB.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : activeTab === 'A' ? (
              <TarifasTable tarifas={tarifasGrupoA} grupoTarifario="A" />
            ) : (
              <TarifasTable tarifas={tarifasGrupoB} grupoTarifario="B" />
            )}
          </CardContent>
        </Card>

        <EditTarifaModal
          tarifa={null}
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          createGrupo={activeTab}
        />
      </div>
    </DashboardLayout>
  );
}
