// Conector Sungrow (iSolarCloud) — porte adaptado de monitor-ai-insight
// (supabase/functions/sungrow-connector). Mudanças em relação à origem:
//  - Auth obrigatória: exige JWT + role staff (a origem tinha verify_jwt=false
//    com service role exposto ao chamador).
//  - Credenciais são lidas de plant_credentials (nunca aceitas no body).
//  - Todas as chamadas HTTP usam fetchWithTimeout (20s) — a origem não tinha timeout.
//  - CORS via allowlist (ALLOWED_ORIGINS), não "*" fixo.
//  - Escreve em solar_metrics/solar_plants/solar_alerts (schema do banco unificado),
//    não em plants/readings (schema antigo do Monitor.ai standalone).
//  - Ações mínimas: test_connection e sync_data (as demais ações de descoberta/
//    OAuth da origem não foram portadas — este conector usa apenas login direto
//    por usuário/senha + appkey + x-access-key, que é o que plant_credentials guarda).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  buildCorsHeaders,
  jsonResponse,
  fetchWithTimeout,
  createServiceClient,
  requireStaffOrScheduler,
  loadPlantCredentials,
  logSyncResult,
  createSyncFailureAlert,
  touchPlantSyncTimestamp,
  upsertMetrics,
  type MetricRow,
} from '../_shared/monitoring.ts';

interface SungrowCredentials {
  username: string;
  password: string;
  appkey: string;
  accessKey: string; // header x-access-key
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://gateway.isolarcloud.com.hk';

function isSungrowCredentials(v: unknown): v is SungrowCredentials {
  const c = v as Record<string, unknown> | null;
  return !!c && typeof c.username === 'string' && typeof c.password === 'string'
    && typeof c.appkey === 'string' && typeof c.accessKey === 'string';
}

async function sungrowRequest(
  baseUrl: string,
  endpoint: string,
  accessKey: string,
  body: Record<string, unknown>
): Promise<any> {
  const res = await fetchWithTimeout(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Evolight-Monitoring/1.0',
      'x-access-key': accessKey,
    },
    body: JSON.stringify({ sys_code: '901', ...body }),
  });

  if (!res.ok) {
    throw new Error(`Sungrow API retornou HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json.result_code !== '1') {
    throw new Error(`Sungrow API: ${json.result_msg ?? 'erro desconhecido'} (${json.result_code})`);
  }
  return json.result_data;
}

async function authenticate(creds: SungrowCredentials): Promise<{ token: string; baseUrl: string }> {
  const baseUrl = creds.baseUrl || DEFAULT_BASE_URL;
  const result = await sungrowRequest(baseUrl, '/openapi/login', creds.accessKey, {
    appkey: creds.appkey,
    user_account: creds.username,
    user_password: creds.password,
  });
  const token = result?.token;
  if (!token) throw new Error('Login Sungrow não retornou token');
  return { token, baseUrl };
}

async function testConnection(creds: SungrowCredentials): Promise<{ success: boolean; message: string }> {
  await authenticate(creds);
  return { success: true, message: 'Conexão com Sungrow validada com sucesso.' };
}

async function syncData(
  creds: SungrowCredentials,
  plantId: string,
  apiSiteId: string
): Promise<{ metrics: MetricRow[]; message: string }> {
  const { token, baseUrl } = await authenticate(creds);

  const energy = await sungrowRequest(baseUrl, '/openapi/getStationEnergy', creds.accessKey, {
    appkey: creds.appkey,
    token,
    ps_id: apiSiteId,
    query_type: 1, // 1 = por dia
  });

  const points: Array<{ time: string; energy?: number; power?: number }> = energy?.list ?? [];

  const metrics: MetricRow[] = points.map((pt) => ({
    plant_id: plantId,
    timestamp: new Date(pt.time).toISOString(),
    geracao_kwh: pt.energy && pt.energy > 0 ? pt.energy / 1000 : 0, // Wh -> kWh
    potencia_instantanea_kw: pt.power ? pt.power / 1000 : null, // W -> kW
  }));

  return { metrics, message: `${metrics.length} ponto(s) coletado(s) do Sungrow.` };
}

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  const supabase = createServiceClient();

  try {
    const auth = await requireStaffOrScheduler(req, supabase);
    if (!auth.ok) {
      return jsonResponse({ error: auth.error }, auth.status, cors);
    }

    const { action, plantId } = await req.json();
    if (!plantId || typeof plantId !== 'string') {
      return jsonResponse({ error: 'plantId é obrigatório' }, 400, cors);
    }

    const { data: plant, error: plantError } = await supabase
      .from('solar_plants')
      .select('id, api_site_id')
      .eq('id', plantId)
      .maybeSingle();
    if (plantError) throw plantError;
    if (!plant) {
      return jsonResponse({ error: 'Usina não encontrada' }, 404, cors);
    }

    const rawCreds = await loadPlantCredentials(supabase, plantId, 'sungrow');
    if (!rawCreds || !isSungrowCredentials(rawCreds)) {
      return jsonResponse({ error: 'Credenciais Sungrow não configuradas ou incompletas para esta usina' }, 400, cors);
    }

    if (action === 'test_connection') {
      const result = await testConnection(rawCreds);
      return jsonResponse(result, 200, cors);
    }

    if (action === 'sync_data') {
      const startedAt = new Date().toISOString();
      const apiSiteId = (plant as any).api_site_id;
      if (!apiSiteId) {
        return jsonResponse({ error: 'Usina não possui api_site_id configurado' }, 400, cors);
      }

      try {
        const { metrics, message } = await syncData(rawCreds, plantId, apiSiteId);
        const inserted = await upsertMetrics(supabase, metrics);
        await touchPlantSyncTimestamp(supabase, plantId);
        await logSyncResult(supabase, {
          plantId,
          provider: 'sungrow',
          status: 'success',
          mensagem: message,
          metricsInseridas: inserted,
          startedAt,
        });
        return jsonResponse({ success: true, message, metricsInseridas: inserted }, 200, cors);
      } catch (syncError: any) {
        const mensagem = syncError?.message || 'Erro desconhecido na sincronização Sungrow';
        await logSyncResult(supabase, { plantId, provider: 'sungrow', status: 'error', mensagem, startedAt });
        await createSyncFailureAlert(supabase, { plantId, provider: 'sungrow', mensagem });
        return jsonResponse({ success: false, error: mensagem }, 502, cors);
      }
    }

    return jsonResponse({ error: `Ação desconhecida: ${action}` }, 400, cors);
  } catch (error: any) {
    console.error('Erro no sungrow-connector:', error);
    return jsonResponse({ error: error.message || 'Erro interno' }, 500, cors);
  }
});
