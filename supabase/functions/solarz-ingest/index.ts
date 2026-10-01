// Ingestão de monitoramento vindo do SolarZ (push externo — JARVIS/automação).
// O pipeline antigo escrevia direto no banco do sunflow-dev com service key;
// aqui o acesso é por secret dedicado (X-Ingest-Secret vs SOLARZ_INGEST_SECRET),
// com escrita restrita a solar_metrics/solar_alerts e validação de plant_id —
// a automação externa nunca recebe a service key do projeto.
//
// POST /functions/v1/solarz-ingest
//   headers: X-Ingest-Secret: <SOLARZ_INGEST_SECRET>
//   body: {
//     metrics?: Array<{ plant_id: uuid, timestamp: ISO, geracao_kwh?, potencia_instantanea_kw?, ... }>,
//     alerts?:  Array<{ plant_id: uuid, tipo?, severidade?, titulo, descricao?, dados_contexto? }>
//   }
// Upsert de métricas por (plant_id, timestamp); plant_ids desconhecidos são
// rejeitados item a item (resposta lista os rejeitados, status 207 se parcial).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  buildCorsHeaders,
  jsonResponse,
  createServiceClient,
  upsertMetrics,
  logSyncResult,
  type MetricRow,
} from '../_shared/monitoring.ts';

const METRIC_FIELDS = new Set([
  'plant_id', 'timestamp', 'geracao_kwh', 'potencia_instantanea_kw', 'corrente_ac',
  'corrente_dc', 'eficiencia_percent', 'fator_potencia', 'frequencia_hz',
  'irradiacao_wm2', 'temperatura_inversor', 'tensao_ac', 'tensao_dc',
]);
const MAX_BATCH = 2000;

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return jsonResponse({ error: 'Use POST' }, 405, cors);

  const expectedSecret = Deno.env.get('SOLARZ_INGEST_SECRET');
  const providedSecret = req.headers.get('X-Ingest-Secret');
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return jsonResponse({ error: 'Unauthorized' }, 401, cors);
  }

  const supabase = createServiceClient();
  const startedAt = new Date().toISOString();

  let body: { metrics?: unknown[]; alerts?: unknown[] };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Body JSON inválido' }, 400, cors);
  }

  const metricsIn = Array.isArray(body.metrics) ? body.metrics : [];
  const alertsIn = Array.isArray(body.alerts) ? body.alerts : [];
  if (metricsIn.length === 0 && alertsIn.length === 0) {
    return jsonResponse({ error: 'Envie metrics e/ou alerts' }, 400, cors);
  }
  if (metricsIn.length > MAX_BATCH || alertsIn.length > MAX_BATCH) {
    return jsonResponse({ error: `Máximo de ${MAX_BATCH} itens por lote` }, 413, cors);
  }

  // Valida plant_ids contra o banco (uma consulta para o lote inteiro).
  const plantIds = new Set<string>();
  for (const raw of [...metricsIn, ...alertsIn]) {
    const pid = (raw as Record<string, unknown>)?.plant_id;
    if (typeof pid === 'string') plantIds.add(pid);
  }
  const { data: plantsFound, error: plantsErr } = await supabase
    .from('solar_plants')
    .select('id')
    .in('id', [...plantIds]);
  if (plantsErr) return jsonResponse({ error: `Falha ao validar usinas: ${plantsErr.message}` }, 500, cors);
  const knownPlants = new Set((plantsFound ?? []).map((p: { id: string }) => p.id));

  const rejected: Array<{ index: number; kind: string; reason: string }> = [];

  const metrics: MetricRow[] = [];
  metricsIn.forEach((raw, index) => {
    const m = raw as Record<string, unknown>;
    if (typeof m?.plant_id !== 'string' || !knownPlants.has(m.plant_id)) {
      rejected.push({ index, kind: 'metric', reason: 'plant_id desconhecido' });
      return;
    }
    const ts = typeof m.timestamp === 'string' ? new Date(m.timestamp) : null;
    if (!ts || Number.isNaN(ts.getTime())) {
      rejected.push({ index, kind: 'metric', reason: 'timestamp inválido' });
      return;
    }
    const row: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(m)) {
      if (!METRIC_FIELDS.has(k)) continue;
      if (k !== 'plant_id' && k !== 'timestamp' && v !== null && typeof v !== 'number') {
        continue; // campos numéricos: ignora valores de outro tipo
      }
      row[k] = v;
    }
    row.timestamp = ts.toISOString();
    metrics.push(row as unknown as MetricRow);
  });

  const alerts: Record<string, unknown>[] = [];
  alertsIn.forEach((raw, index) => {
    const a = raw as Record<string, unknown>;
    if (typeof a?.plant_id !== 'string' || !knownPlants.has(a.plant_id)) {
      rejected.push({ index, kind: 'alert', reason: 'plant_id desconhecido' });
      return;
    }
    if (typeof a.titulo !== 'string' || !a.titulo.trim()) {
      rejected.push({ index, kind: 'alert', reason: 'titulo obrigatório' });
      return;
    }
    alerts.push({
      plant_id: a.plant_id,
      tipo: typeof a.tipo === 'string' ? a.tipo : 'solarz',
      severidade: typeof a.severidade === 'string' ? a.severidade : 'media',
      titulo: a.titulo,
      descricao: typeof a.descricao === 'string' ? a.descricao : null,
      dados_contexto: a.dados_contexto ?? { origem: 'solarz-ingest' },
      status: 'aberto',
    });
  });

  let metricsInseridas = 0;
  let alertasInseridos = 0;
  const errors: string[] = [];

  try {
    if (metrics.length > 0) metricsInseridas = await upsertMetrics(supabase, metrics);
  } catch (e) {
    errors.push(`metrics: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (alerts.length > 0) {
    const { error } = await supabase.from('solar_alerts').insert(alerts);
    if (error) errors.push(`alerts: ${error.message}`);
    else alertasInseridos = alerts.length;
  }

  // Atualiza ultima_sincronizacao das usinas que receberam métricas.
  const touched = [...new Set(metrics.map((m) => m.plant_id))];
  if (touched.length > 0 && metricsInseridas > 0) {
    await supabase
      .from('solar_plants')
      .update({ ultima_sincronizacao: new Date().toISOString() })
      .in('id', touched);
  }

  // sync_logs: um registro por lote, na primeira usina do lote (visão operacional).
  const logPlant = touched[0] ?? (alerts[0]?.plant_id as string | undefined);
  if (logPlant) {
    await logSyncResult(supabase, {
      plantId: logPlant,
      provider: 'solarz',
      status: errors.length ? 'partial' : 'success',
      mensagem: `ingest: ${metricsInseridas} métrica(s), ${alertasInseridos} alerta(s), ${rejected.length} rejeitado(s)` +
        (errors.length ? ` | ${errors.join('; ')}` : ''),
      metricsInseridas,
      startedAt,
    });
  }

  const status = errors.length ? 500 : rejected.length ? 207 : 200;
  return jsonResponse(
    { success: errors.length === 0, metricsInseridas, alertasInseridos, rejected, errors },
    status,
    cors
  );
});
