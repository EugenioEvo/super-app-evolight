/**
 * Tipos manuais para plant_credentials e sync_logs.
 *
 * TODO: estas tabelas foram criadas pela migration
 * supabase/migrations/20260717100000_monitoring_sync.sql mas ainda não foram
 * aplicadas ao banco, então não existem em src/integrations/supabase/types.ts.
 * Quando o types.ts for regenerado (`supabase gen types`), trocar estes tipos
 * manuais por `Tables<'plant_credentials'>` / `Tables<'sync_logs'>` e remover
 * os casts `(supabase as any)` isolados nos hooks deste módulo.
 */

export type MonitoringProvider = 'sungrow' | 'solaredge';

export interface SungrowCredentialsPayload {
  username: string;
  password: string;
  appkey: string;
  accessKey: string;
}

export interface SolarEdgeCredentialsPayload {
  apiKey: string;
}

export type ProviderCredentialsPayload = SungrowCredentialsPayload | SolarEdgeCredentialsPayload;

export interface PlantCredential {
  id: string;
  plant_id: string;
  provider: MonitoringProvider;
  credentials: ProviderCredentialsPayload;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export type SyncLogStatus = 'success' | 'error' | 'partial';

export interface SyncLog {
  id: string;
  plant_id: string;
  provider: MonitoringProvider;
  status: SyncLogStatus;
  mensagem: string | null;
  metrics_inseridas: number;
  started_at: string;
  finished_at: string | null;
}
