import { useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { SolarPlant } from '@/features/monitoring/hooks/useSolarPlants';
import {
  usePlantCredentials,
  useUpsertPlantCredential,
  useUpdatePlantSyncSettings,
} from '@/features/monitoring/hooks/usePlantCredentials';
import { useSyncLogs } from '@/features/monitoring/hooks/useSyncLogs';
import { useTestConnection, useTriggerSync } from '@/features/monitoring/hooks/useTriggerSync';
import { formatDateTime } from '@/features/monitoring/lib/format';
import type {
  MonitoringProvider,
  SolarEdgeCredentialsPayload,
  SungrowCredentialsPayload,
} from '@/features/monitoring/types-sync';

interface SyncPanelProps {
  plant: SolarPlant;
}

const PROVIDER_OPTIONS: Array<{ value: MonitoringProvider; label: string }> = [
  { value: 'sungrow', label: 'Sungrow (iSolarCloud)' },
  { value: 'solaredge', label: 'SolarEdge' },
];

const EMPTY_SUNGROW: SungrowCredentialsPayload = { username: '', password: '', appkey: '', accessKey: '' };
const EMPTY_SOLAREDGE: SolarEdgeCredentialsPayload = { apiKey: '' };

const STATUS_META: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  success: { label: 'Sucesso', icon: CheckCircle2, className: 'text-green-600' },
  error: { label: 'Erro', icon: XCircle, className: 'text-destructive' },
  partial: { label: 'Parcial', icon: RefreshCw, className: 'text-amber-600' },
};

export function SyncPanel({ plant }: SyncPanelProps) {
  const { toast } = useToast();
  const plantId = plant.id;

  const provider = ((plant as any).monitoring_provider as MonitoringProvider | 'manual' | 'solarz' | null) ?? null;
  const syncEnabled = Boolean((plant as any).sync_enabled);
  const apiSiteId = ((plant as any).api_site_id as string | null) ?? '';

  const [formProvider, setFormProvider] = useState<MonitoringProvider>(
    provider === 'sungrow' || provider === 'solaredge' ? provider : 'sungrow'
  );
  const [siteIdInput, setSiteIdInput] = useState(apiSiteId);
  const [sungrowForm, setSungrowForm] = useState<SungrowCredentialsPayload>(EMPTY_SUNGROW);
  const [solaredgeForm, setSolaredgeForm] = useState<SolarEdgeCredentialsPayload>(EMPTY_SOLAREDGE);

  const credentialsQuery = usePlantCredentials(plantId);
  const syncLogsQuery = useSyncLogs(plantId, 10);
  const upsertCredential = useUpsertPlantCredential();
  const updateSyncSettings = useUpdatePlantSyncSettings();
  const testConnection = useTestConnection();
  const triggerSync = useTriggerSync();

  const hasCredentialFor = (p: MonitoringProvider) =>
    (credentialsQuery.data ?? []).some((c) => c.provider === p && c.ativo);

  const handleSaveCredentials = async () => {
    if (!siteIdInput.trim()) {
      toast({ title: 'Erro', description: 'Informe o ID da usina no provider (api_site_id).', variant: 'destructive' });
      return;
    }

    const credentials = formProvider === 'sungrow' ? sungrowForm : solaredgeForm;

    if (formProvider === 'sungrow') {
      const c = credentials as SungrowCredentialsPayload;
      if (!c.username || !c.password || !c.appkey || !c.accessKey) {
        toast({ title: 'Erro', description: 'Preencha todos os campos da credencial Sungrow.', variant: 'destructive' });
        return;
      }
    } else {
      const c = credentials as SolarEdgeCredentialsPayload;
      if (!c.apiKey) {
        toast({ title: 'Erro', description: 'Informe a API Key do SolarEdge.', variant: 'destructive' });
        return;
      }
    }

    try {
      await upsertCredential.mutateAsync({ plantId, provider: formProvider, credentials });
      await updateSyncSettings.mutateAsync({
        plantId,
        syncEnabled,
        monitoringProvider: formProvider,
        apiSiteId: siteIdInput.trim(),
      });
      toast({ title: 'Credencial salva', description: 'Credencial de sincronização configurada com sucesso.' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Falha ao salvar credencial', variant: 'destructive' });
    }
  };

  const handleToggleSync = async (checked: boolean) => {
    try {
      await updateSyncSettings.mutateAsync({ plantId, syncEnabled: checked });
      toast({
        title: checked ? 'Sincronização ativada' : 'Sincronização desativada',
        description: checked
          ? 'A usina passará a ser sincronizada automaticamente pelo scheduler.'
          : 'A usina não será mais sincronizada automaticamente.',
      });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Falha ao atualizar sincronização', variant: 'destructive' });
    }
  };

  const handleTestConnection = async () => {
    if (provider !== 'sungrow' && provider !== 'solaredge') {
      toast({ title: 'Erro', description: 'Configure um provider antes de testar a conexão.', variant: 'destructive' });
      return;
    }
    try {
      const result = await testConnection.mutateAsync({ plantId, provider });
      toast({
        title: result.success ? 'Conexão validada' : 'Falha na conexão',
        description: result.message || result.error,
        variant: result.success ? 'default' : 'destructive',
      });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Falha ao testar conexão', variant: 'destructive' });
    }
  };

  const handleSyncNow = async () => {
    if (provider !== 'sungrow' && provider !== 'solaredge') {
      toast({ title: 'Erro', description: 'Configure um provider antes de sincronizar.', variant: 'destructive' });
      return;
    }
    try {
      const result = await triggerSync.mutateAsync({ plantId, provider });
      toast({
        title: result.success ? 'Sincronização concluída' : 'Falha na sincronização',
        description: result.message || result.error,
        variant: result.success ? 'default' : 'destructive',
      });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Falha ao sincronizar', variant: 'destructive' });
    }
  };

  const isSavingCredential = upsertCredential.isPending || updateSyncSettings.isPending;

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            Configuração de sincronização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-3 rounded-md border border-border p-4">
            <div>
              <p className="font-medium text-foreground">Sincronização automática</p>
              <p className="text-sm text-muted-foreground">
                Quando ativa, o scheduler coleta métricas periodicamente para esta usina.
              </p>
            </div>
            <Switch checked={syncEnabled} onCheckedChange={handleToggleSync} disabled={updateSyncSettings.isPending} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={formProvider} onValueChange={(v: MonitoringProvider) => setFormProvider(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                      {hasCredentialFor(o.value) && ' (configurado)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ID da usina no provider (site_id / ps_id)</Label>
              <Input
                value={siteIdInput}
                onChange={(e) => setSiteIdInput(e.target.value)}
                placeholder="Ex: 123456"
              />
            </div>
          </div>

          {formProvider === 'sungrow' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Usuário</Label>
                <Input
                  value={sungrowForm.username}
                  onChange={(e) => setSungrowForm({ ...sungrowForm, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={sungrowForm.password}
                  onChange={(e) => setSungrowForm({ ...sungrowForm, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>App Key</Label>
                <Input
                  value={sungrowForm.appkey}
                  onChange={(e) => setSungrowForm({ ...sungrowForm, appkey: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>X-Access-Key</Label>
                <Input
                  type="password"
                  value={sungrowForm.accessKey}
                  onChange={(e) => setSungrowForm({ ...sungrowForm, accessKey: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={solaredgeForm.apiKey}
                  onChange={(e) => setSolaredgeForm({ apiKey: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSaveCredentials} disabled={isSavingCredential}>
              {isSavingCredential && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar credencial
            </Button>
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testConnection.isPending || (provider !== 'sungrow' && provider !== 'solaredge')}
            >
              {testConnection.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Testar conexão
            </Button>
            <Button
              variant="outline"
              onClick={handleSyncNow}
              disabled={triggerSync.isPending || (provider !== 'sungrow' && provider !== 'solaredge')}
              className="gap-1.5"
            >
              {triggerSync.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sincronizar agora
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Histórico de sincronização</CardTitle>
        </CardHeader>
        <CardContent>
          {syncLogsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : syncLogsQuery.isError ? (
            <p className="text-sm text-muted-foreground">Não foi possível carregar o histórico de sincronização.</p>
          ) : (syncLogsQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma sincronização registrada ainda.</p>
          ) : (
            <div className="space-y-2">
              {(syncLogsQuery.data ?? []).map((log) => {
                const meta = STATUS_META[log.status] ?? STATUS_META.error;
                const Icon = meta.icon;
                return (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-3 rounded-md border border-border p-3 text-sm"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${meta.className}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{meta.label}</span>
                          <Badge variant="outline">{log.provider}</Badge>
                        </div>
                        {log.mensagem && (
                          <p className="text-muted-foreground truncate">{log.mensagem}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 text-xs text-muted-foreground">
                      <p>{formatDateTime(log.started_at)}</p>
                      <p>{log.metrics_inseridas} métrica(s)</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
