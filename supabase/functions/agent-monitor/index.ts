import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const LOW_GENERATION_RATIO = 0.70
const FETCH_TIMEOUT_MS = 10000  // 10s per API call
const MAX_RUNTIME_MS = 110000  // 110s global limit (Supabase kills at 150s)

let functionStartTime = 0

function isTimeUp(): boolean {
  return (Date.now() - functionStartTime) > MAX_RUNTIME_MS
}

function proxyHeaders(): Record<string, string> {
  const secret = Deno.env.get('SOLARZ_PROXY_SECRET') || ''
  return { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Proxy-Secret': secret }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

async function solarzGet(url: string) {
  const res = await fetchWithTimeout(url, { headers: proxyHeaders() })
  if (!res.ok) { const e = await res.text(); throw new Error(`SolarZ GET ${url} failed: ${res.status} - ${e.substring(0,200)}`) }
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) { const p = (await res.text()).substring(0,300); throw new Error(`Non-JSON from ${url}: ${ct} - ${p}`) }
  return res.json()
}

async function solarzPost(url: string, body?: any) {
  const res = await fetchWithTimeout(url, { method: 'POST', headers: proxyHeaders(), body: body ? JSON.stringify(body) : '{}' })
  if (!res.ok) { const e = await res.text(); throw new Error(`SolarZ POST ${url} failed: ${res.status} - ${e.substring(0,200)}`) }
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) { const p = (await res.text()).substring(0,300); throw new Error(`Non-JSON from ${url}: ${ct} - ${p}`) }
  return res.json()
}

async function dispatchCritical(supabaseAdmin: any, plantId: string, tipo: string, severidade: string) {
  try { await supabaseAdmin.functions.invoke('agent-dispatcher', { body: { plant_id: plantId, alert_type: tipo, severity: severidade } }) } catch (err) { console.warn('Dispatcher failed:', err) }
}

async function dispatchJarvis(supabaseAdmin: any, alertId: string, plantId: string, tipo: string, severidade: string) {
  try { await supabaseAdmin.functions.invoke('jarvis-orchestrator', { body: { alert_id: alertId, plant_id: plantId, tipo, severidade } }) } catch (err) { console.warn('JARVIS failed:', err) }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  // Porte super-app: no sunflow-dev esta function ficava aberta (verify_jwt=false,
  // sem auth). Aqui exigimos o X-Scheduler-Secret, como no monitoring-scheduler.
  const expectedSecret = Deno.env.get('SCHEDULER_SECRET')
  const providedSecret = req.headers.get('X-Scheduler-Secret')
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  functionStartTime = Date.now()
  let alertsCreated = 0, metricsChecked = 0, plantsProcessed = 0, jarvisInvocations = 0, plantsSkipped = 0
  let errorMessage: string | null = null
  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

  try {
    let SOLARZ_API_URL = (Deno.env.get('SOLARZ_API_URL') ?? '').replace(/\/$/, '')
    if (SOLARZ_API_URL && !SOLARZ_API_URL.startsWith('http')) SOLARZ_API_URL = 'https://' + SOLARZ_API_URL
    const SOLARZ_PROXY_SECRET = Deno.env.get('SOLARZ_PROXY_SECRET')
    if (!SOLARZ_API_URL || !SOLARZ_PROXY_SECRET) throw new Error('SOLARZ_API_URL and SOLARZ_PROXY_SECRET must be configured')

    // Fetch all SolarZ plants with pagination (with timeout per page)
    let allSolarzPlants: any[] = []
    let page = 1
    while (true) {
      if (isTimeUp()) { console.warn('[monitor] Time limit approaching during plant list fetch, stopping pagination'); break }
      try {
        const res = await solarzPost(`${SOLARZ_API_URL}/openApi/seller/plantWithInfos/list?page=${page}&pageSize=100`)
        allSolarzPlants.push(...(res.content || []))
        if (res.last === true || (res.content || []).length === 0) break
        page++
      } catch (err) {
        console.error(`[monitor] Failed to fetch plant list page ${page}:`, err)
        if (allSolarzPlants.length === 0) throw err // Fatal if we got nothing
        break // Use what we have
      }
    }

    const { data: dbPlants, error: dbErr } = await supabaseAdmin.from('solar_plants').select('id, solarz_plant_id, nome, potencia_kwp').eq('ativo', true).not('solarz_plant_id', 'is', null)
    if (dbErr) throw dbErr

    const dbMap = new Map((dbPlants ?? []).map((p: any) => [p.solarz_plant_id, p]))
    const todayStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    for (const szPlant of allSolarzPlants) {
      // Check global time limit before each plant
      if (isTimeUp()) {
        plantsSkipped = allSolarzPlants.length - plantsProcessed - plantsSkipped
        console.warn(`[monitor] Time limit reached. Processed ${plantsProcessed}, skipping ${plantsSkipped} remaining plants.`)
        break
      }

      const dbPlant = dbMap.get(String(szPlant.id))
      if (!dbPlant) continue
      plantsProcessed++
      const status = szPlant.status?.status
      try {
        let tipo: string | null = null, severidade: string | null = null
        if (status === 'CRITICO') { tipo = 'erro_inversor'; severidade = 'critical' }
        else if (status === 'DESCONHECIDO') { tipo = 'comunicacao'; severidade = 'critical' }
        else if (status === 'ALERTA') { tipo = 'alerta_sistema'; severidade = 'warning' }

        if (tipo && severidade) {
          const { data: existing } = await supabaseAdmin.from('solar_alerts').select('id').eq('plant_id', dbPlant.id).eq('tipo', tipo).eq('status', 'aberto').gte('created_at', todayStart).maybeSingle()
          if (!existing) {
            const { data: insertedAlert } = await supabaseAdmin.from('solar_alerts').insert([{ plant_id: dbPlant.id, tipo, severidade, titulo: `${status}: ${szPlant.name}`, descricao: `Planta ${szPlant.name} com status ${status}.`, dados_contexto: { solarz_status: status, solarz_plant_id: szPlant.id }, status: 'aberto' }]).select('id').single()
            if (insertedAlert) {
              alertsCreated++
              if (severidade === 'critical') await dispatchCritical(supabaseAdmin, dbPlant.id, tipo, severidade)
              else { jarvisInvocations++; await dispatchJarvis(supabaseAdmin, insertedAlert.id, dbPlant.id, tipo, severidade) }
            }
          }
        }

        // Performance check (with individual timeout)
        if (!isTimeUp()) {
          try {
            const perfData = await solarzPost(`${SOLARZ_API_URL}/openApi/seller/plant/performance/plantId/${szPlant.id}`)
            if (perfData.expected1D > 0 && perfData.total1D > 0) {
              const ratio = perfData.total1D / perfData.expected1D
              if (ratio < LOW_GENERATION_RATIO) {
                const { data: existingLow } = await supabaseAdmin.from('solar_alerts').select('id').eq('plant_id', dbPlant.id).eq('tipo', 'baixa_geracao').eq('status', 'aberto').gte('created_at', todayStart).maybeSingle()
                if (!existingLow) {
                  const pct = Math.round(ratio * 100)
                  const { data: insertedAlert } = await supabaseAdmin.from('solar_alerts').insert([{ plant_id: dbPlant.id, tipo: 'baixa_geracao', severidade: 'warning', titulo: `Baixa geracao: ${pct}%`, descricao: `Geracao ${perfData.total1D?.toFixed(1)} kWh vs esperado ${perfData.expected1D?.toFixed(1)} kWh`, dados_contexto: { ratio: pct }, status: 'aberto' }]).select('id').single()
                  if (insertedAlert) { alertsCreated++; jarvisInvocations++; await dispatchJarvis(supabaseAdmin, insertedAlert.id, dbPlant.id, 'baixa_geracao', 'warning') }
                }
              }
            }
          } catch (perfErr) { console.warn(`[monitor] Perf check failed for plant ${dbPlant.id}:`, perfErr) }
        }

        // Power/metrics check (with individual timeout)
        if (!isTimeUp()) {
          try {
            const powerData = await solarzGet(`${SOLARZ_API_URL}/openApi/seller/plant/power?id=${szPlant.id}`)
            // Porte super-app: upsert por (plant_id,timestamp) — o banco novo tem índice único uq_solar_metrics_plant_timestamp.
            await supabaseAdmin.from('solar_metrics').upsert([{ plant_id: dbPlant.id, timestamp: new Date().toISOString(), geracao_kwh: powerData.totalGenerated ?? null, potencia_instantanea_kw: powerData.instantPower ?? null }], { onConflict: 'plant_id,timestamp', ignoreDuplicates: true })
            metricsChecked++
          } catch (powerErr) { console.warn(`[monitor] Power check failed for plant ${dbPlant.id}:`, powerErr) }
        }

        await supabaseAdmin.from('solar_plants').update({ ultima_sincronizacao: new Date().toISOString(), solarz_status: status ?? null }).eq('id', dbPlant.id)
      } catch (plantErr) {
        console.error(`[monitor] Error processing plant ${dbPlant.id}:`, plantErr)
        errorMessage = errorMessage ?? (plantErr instanceof Error ? plantErr.message : String(plantErr))
      }
    }
  } catch (err) {
    console.error('[monitor] Fatal error:', err)
    errorMessage = err instanceof Error ? err.message : String(err)
  }

  const durationMs = Date.now() - functionStartTime
  try { await supabaseAdmin.from('solar_agent_logs').insert([{ agent_name: 'monitor', action: 'sync_all_plants', status: errorMessage ? 'error' : 'success', duration_ms: durationMs, error_message: errorMessage, input_data: { plants_processed: plantsProcessed, plants_skipped: plantsSkipped }, output_data: { alerts_created: alertsCreated, metrics_checked: metricsChecked, jarvis_invocations: jarvisInvocations } }]) } catch (logErr) { console.error('Failed to log:', logErr) }

  return new Response(JSON.stringify({ success: !errorMessage, duration_ms: durationMs, plants_processed: plantsProcessed, plants_skipped: plantsSkipped, alerts_created: alertsCreated, metrics_checked: metricsChecked, jarvis_invocations: jarvisInvocations, error: errorMessage }), { status: errorMessage ? 500 : 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
