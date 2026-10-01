// Utilitários compartilhados pelos conectores de monitoramento
// (sungrow-connector, solaredge-connector, monitoring-scheduler).
//
// Portado da lógica do Monitor.ai (monitor-ai-insight), corrigindo os
// problemas conhecidos da origem:
//  - CORS com allowlist via env ALLOWED_ORIGINS (fallback "*"), em vez de "*" fixo.
//  - Toda chamada externa usa fetchWithTimeout (AbortController, 20s default).
//  - Credenciais nunca aceitas via body: sempre lidas de plant_credentials.
//  - Auth obrigatória: valida o JWT do chamador e exige role staff.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const DEFAULT_TIMEOUT_MS = 20_000;

/** Monta os headers de CORS a partir de ALLOWED_ORIGINS (lista separada por vírgula). Fallback "*". */
export function buildCorsHeaders(req: Request): Record<string, string> {
  const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  const origin = req.headers.get('Origin') ?? '';
  const allowOrigin = allowedOrigins.length === 0
    ? '*'
    : (allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-scheduler-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function jsonResponse(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

/** fetch() com timeout via AbortController (nenhum dos conectores de origem tinha isso). */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Requisição externa expirou após ${timeoutMs}ms: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function createServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

export interface StaffAuthResult {
  ok: true;
  userId: string;
}

export interface StaffAuthError {
  ok: false;
  status: number;
  error: string;
}

/**
 * Valida o JWT do chamador (Authorization: Bearer ...) e exige que o usuário
 * tenha um papel de staff em user_roles. Mesmo padrão de gerar-ordem-servico,
 * mas usando a lista de papéis atual de is_staff() (inclui 'lider').
 */
export async function requireStaffUser(
  req: Request,
  supabase: SupabaseClient
): Promise<StaffAuthResult | StaffAuthError> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }
  const token = authHeader.replace('Bearer ', '');
  const { data } = await supabase.auth.getUser(token);
  const user = data.user;
  if (!user) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const { data: rolesData } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  const userRoles = (rolesData || []).map((r: { role: string }) => r.role);
  const allowedRoles = ['admin', 'engenharia', 'supervisao', 'lider'];
  if (!userRoles.some((r: string) => allowedRoles.includes(r))) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }

  return { ok: true, userId: user.id };
}

/**
 * Igual a requireStaffUser, mas também aceita o header X-Scheduler-Secret
 * (comparado a env SCHEDULER_SECRET) como caminho de autorização alternativo,
 * usado pelo monitoring-scheduler ao invocar os conectores server-to-server
 * (sem sessão de usuário humano). Se SCHEDULER_SECRET não estiver configurado,
 * esse caminho fica desabilitado e só o JWT de staff é aceito.
 */
export async function requireStaffOrScheduler(
  req: Request,
  supabase: SupabaseClient
): Promise<StaffAuthResult | StaffAuthError> {
  const expectedSecret = Deno.env.get('SCHEDULER_SECRET');
  const providedSecret = req.headers.get('X-Scheduler-Secret');
  if (expectedSecret && providedSecret === expectedSecret) {
    return { ok: true, userId: 'scheduler' };
  }
  return requireStaffUser(req, supabase);
}

export type Provider = 'sungrow' | 'solaredge';

/** Carrega a credencial ativa de uma usina para um provider. Nunca aceita credenciais via body. */
export async function loadPlantCredentials(
  supabase: SupabaseClient,
  plantId: string,
  provider: Provider
): Promise<Record<string, unknown> | null> {
  // TODO: plant_credentials ainda não está em src/integrations/supabase/types.ts
  // (migration não aplicada). Trocar o cast quando o types.ts for regenerado.
  const { data, error } = await (supabase as any)
    .from('plant_credentials')
    .select('credentials, ativo')
    .eq('plant_id', plantId)
    .eq('provider', provider)
    .eq('ativo', true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return data.credentials as Record<string, unknown>;
}

/** Registra o resultado de uma sincronização em sync_logs. */
export async function logSyncResult(
  supabase: SupabaseClient,
  params: {
    plantId: string;
    provider: Provider;
    status: 'success' | 'error' | 'partial';
    mensagem?: string;
    metricsInseridas?: number;
    startedAt: string;
  }
): Promise<void> {
  const { error } = await supabase.from('sync_logs').insert({
    plant_id: params.plantId,
    provider: params.provider,
    status: params.status,
    mensagem: params.mensagem ?? null,
    metrics_inseridas: params.metricsInseridas ?? 0,
    started_at: params.startedAt,
    finished_at: new Date().toISOString(),
  });
  if (error) console.error('Erro ao gravar sync_logs:', error);
}

/** Cria um alerta de falha de sincronização em solar_alerts. */
export async function createSyncFailureAlert(
  supabase: SupabaseClient,
  params: { plantId: string; provider: Provider; mensagem: string }
): Promise<void> {
  const { error } = await supabase.from('solar_alerts').insert({
    plant_id: params.plantId,
    tipo: 'sync',
    severidade: 'alta',
    titulo: `Falha na sincronização (${params.provider})`,
    descricao: params.mensagem,
    dados_contexto: { provider: params.provider },
    status: 'aberto',
  });
  if (error) console.error('Erro ao gravar solar_alerts:', error);
}

/** Marca solar_plants.ultima_sincronizacao = agora. */
export async function touchPlantSyncTimestamp(supabase: SupabaseClient, plantId: string): Promise<void> {
  const { error } = await supabase
    .from('solar_plants')
    .update({ ultima_sincronizacao: new Date().toISOString() })
    .eq('id', plantId);
  if (error) console.error('Erro ao atualizar ultima_sincronizacao:', error);
}

export interface MetricRow {
  plant_id: string;
  timestamp: string;
  geracao_kwh?: number | null;
  potencia_instantanea_kw?: number | null;
  corrente_ac?: number | null;
  corrente_dc?: number | null;
  eficiencia_percent?: number | null;
  fator_potencia?: number | null;
  frequencia_hz?: number | null;
  irradiacao_wm2?: number | null;
  temperatura_inversor?: number | null;
  tensao_ac?: number | null;
  tensao_dc?: number | null;
}

/** Upsert de métricas em solar_metrics, por plant_id+timestamp (índice único uq_solar_metrics_plant_timestamp). */
export async function upsertMetrics(supabase: SupabaseClient, rows: MetricRow[]): Promise<number> {
  if (rows.length === 0) return 0;
  const { error } = await supabase
    .from('solar_metrics')
    .upsert(rows, { onConflict: 'plant_id,timestamp', ignoreDuplicates: false });
  if (error) throw error;
  return rows.length;
}
