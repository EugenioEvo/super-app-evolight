// Conector SolarEdge — porte adaptado de monitor-ai-insight
// (supabase/functions/solaredge-connector). Mudanças em relação à origem:
//  - Auth obrigatória: exige JWT + role staff.
//  - Credenciais (api_key) lidas de plant_credentials, nunca do body.
//  - Todas as chamadas HTTP usam fetchWithTimeout (20s) — a origem não tinha timeout.
//  - CORS via allowlist (ALLOWED_ORIGINS), não "*" fixo.
//  - Escreve em solar_metrics/solar_plants/solar_alerts.
//  - NÃO portamos a leitura de telemetria por equipamento/otimizador da origem:
//    lá, tensão/corrente de otimizador eram mockadas com Math.random() (marcado
//    "temporário" no código original) — preferimos omitir a mockar dado falso.
//  - Ações mínimas: test_connection e sync_data.

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

interface SolarEdgeCredentials {
  apiKey: string;
}

const BASE_URL = 'https://monitoringapi.solaredge.com';

function isSolarEdgeCredentials(v: unknown): v is SolarEdgeCredentials {
  const c = v as Record<string, unknown> | null;
  return !!c && typeof c.apiKey === 'string' && c.apiKey.length > 0;
}

async function solarEdgeGet(path: string, apiKey: string, params: Record<string, string> = {}): Promise<any> {
  const query = new URLSearchParams({ ...params, api_key: apiKey }).toString();
  const res = await fetchWithTimeout(`${BASE_URL}${path}?${query}`, { method: 'GET' });

  if (res.status === 401) throw new Error('Credenciais SolarEdge inválidas');
  if (res.status === 403) throw new Error('Acesso negado pela API SolarEdge');
  if (!res.ok) throw new Error(`SolarEdge API retornou HTTP ${res.status}`);

  return await res.json();
}

async function testConnection(creds: SolarEdgeCredentials, siteId: string): Promise<{ success: boolean; message: string }> {
  const data = await solarEdgeGet(`/site/${siteId}/details`, creds.apiKey);
  if (!data?.details) throw new Error('Resposta inesperada da API SolarEdge');
  return { success: true, message: 'Conexão com SolarEdge validada com sucesso.' };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

async function syncData(
  creds: SolarEdgeCredentials,
  plantId: string,
  siteId: string
): Promise<{ metrics: MetricRow[]; message: string }> {
  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  const energyData = await solarEdgeGet(`/site/${siteId}/energy`, creds.apiKey, {
    timeUnit: 'QUARTER_OF_AN_HOUR',
    startDate: fmt(since).slice(0, 10),
    endDate: fmt(now).slice(0, 10),
  });

  let powerData: any = null;
  try {
    powerData = await solarEdgeGet(`/site/${siteId}/power`, creds.apiKey, {
      startTime: fmt(since),
      endTime: fmt(now),
    });
  } catch {
    // Potência instantânea é opcional — segue apenas com geração se falhar.
    powerData = null;
  }

  const energyPoints: Array<{ date: string; value: number | null }> = energyData?.energy?.values ?? [];
  const powerPoints: Array<{ date: string; value: number | null }> = powerData?.power?.values ?? [];
  const powerByDate = new Map(powerPoints.map((p) => [p.date, p.value]));

  const metrics: MetricRow[] = energyPoints
    .filter((p) => typeof p.value === 'number' && p.value > 0)
    .map((p) => {
      const powerValue = powerByDate.get(p.date);
      return {
        plant_id: plantId,
        timestamp: new Date(p.date.replace(' ', 'T')).toISOString(),
        geracao_kwh: (p.value as number) / 1000, // Wh -> kWh
        potencia_instantanea_kw: typeof powerValue === 'number' ? powerValue / 1000 : null, // W -> kW
      };
    });

  return { metrics, message: `${metrics.length} ponto(s) coletado(s) do SolarEdge.` };
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

    const rawCreds = await loadPlantCredentials(supabase, plantId, 'solaredge');
    if (!rawCreds || !isSolarEdgeCredentials(rawCreds)) {
      return jsonResponse({ error: 'Credenciais SolarEdge não configuradas ou incompletas para esta usina' }, 400, cors);
    }

    const apiSiteId = (plant as any).api_site_id;
    if (!apiSiteId) {
      return jsonResponse({ error: 'Usina não possui api_site_id (site_id SolarEdge) configurado' }, 400, cors);
    }

    if (action === 'test_connection') {
      const result = await testConnection(rawCreds, apiSiteId);
      return jsonResponse(result, 200, cors);
    }

    if (action === 'sync_data') {
      const startedAt = new Date().toISOString();
      try {
        const { metrics, message } = await syncData(rawCreds, plantId, apiSiteId);
        const inserted = await upsertMetrics(supabase, metrics);
        await touchPlantSyncTimestamp(supabase, plantId);
        await logSyncResult(supabase, {
          plantId,
          provider: 'solaredge',
          status: 'success',
          mensagem: message,
          metricsInseridas: inserted,
          startedAt,
        });
        return jsonResponse({ success: true, message, metricsInseridas: inserted }, 200, cors);
      } catch (syncError: any) {
        const mensagem = syncError?.message || 'Erro desconhecido na sincronização SolarEdge';
        await logSyncResult(supabase, { plantId, provider: 'solaredge', status: 'error', mensagem, startedAt });
        await createSyncFailureAlert(supabase, { plantId, provider: 'solaredge', mensagem });
        return jsonResponse({ success: false, error: mensagem }, 502, cors);
      }
    }

    return jsonResponse({ error: `Ação desconhecida: ${action}` }, 400, cors);
  } catch (error: any) {
    console.error('Erro no solaredge-connector:', error);
    return jsonResponse({ error: error.message || 'Erro interno' }, 500, cors);
  }
});
