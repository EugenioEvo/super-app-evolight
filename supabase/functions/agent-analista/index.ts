import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

function getMonthRange(mes: number, ano: number) {
  return { firstDay: new Date(Date.UTC(ano, mes - 1, 1)).toISOString(), lastDay: new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999)).toISOString() }
}
function daysInMonth(mes: number, ano: number): number { return new Date(ano, mes, 0).getDate() }
const PEAK_SUN_HOURS: Record<number, number> = { 1:5.0,2:5.2,3:5.0,4:4.5,5:4.0,6:3.8,7:4.0,8:4.5,9:4.8,10:5.0,11:5.2,12:5.0 }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const startTime = Date.now()
  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
  try {
    const { mes, ano, cliente_id } = await req.json()
    if (!mes || !ano) return new Response(JSON.stringify({ error: 'mes and ano are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const { firstDay, lastDay } = getMonthRange(mes, ano)
    const totalDays = daysInMonth(mes, ano)
    const peakSunHours = PEAK_SUN_HOURS[mes] ?? 4.5
    let plantsQuery = supabaseAdmin.from('solar_plants').select('id, nome, potencia_kwp, cliente_id').eq('ativo', true)
    if (cliente_id) plantsQuery = plantsQuery.eq('cliente_id', cliente_id)
    const { data: plants, error: plantsErr } = await plantsQuery
    if (plantsErr) throw plantsErr
    const plantIds = (plants ?? []).map((p: any) => p.id)
    const empty = ['00000000-0000-0000-0000-000000000000']
    const ids = plantIds.length > 0 ? plantIds : empty
    const [alertsResult, metricsResult, ticketsResult, resolvedAlertsResult] = await Promise.all([
      supabaseAdmin.from('solar_alerts').select('id, plant_id, tipo, severidade, status, created_at, resolvido_em').gte('created_at', firstDay).lte('created_at', lastDay).in('plant_id', ids),
      supabaseAdmin.from('solar_metrics').select('plant_id, timestamp, geracao_kwh').gte('timestamp', firstDay).lte('timestamp', lastDay).in('plant_id', ids),
      (() => { let q = supabaseAdmin.from('tickets').select('id, status, data_abertura, data_conclusao, equipamento_tipo, cliente_id').gte('data_abertura', firstDay).lte('data_abertura', lastDay); if (cliente_id) q = q.eq('cliente_id', cliente_id); return q })(),
      supabaseAdmin.from('solar_alerts').select('id, plant_id, created_at, resolvido_em').eq('status', 'resolvido').not('resolvido_em', 'is', null).gte('created_at', firstDay).lte('created_at', lastDay).in('plant_id', ids),
    ])
    const alerts = alertsResult.data ?? [], metrics = metricsResult.data ?? [], tickets = ticketsResult.data ?? [], resolvedAlerts = resolvedAlertsResult.data ?? []
    const alertsBySeverity: Record<string, number> = {}
    for (const a of alerts) { const s = a.severidade ?? 'unknown'; alertsBySeverity[s] = (alertsBySeverity[s] ?? 0) + 1 }
    const repairTimes = resolvedAlerts.filter((a: any) => a.created_at && a.resolvido_em).map((a: any) => (new Date(a.resolvido_em).getTime() - new Date(a.created_at).getTime()) / 3600000).filter((h: number) => h >= 0)
    const mttrHours = repairTimes.length > 0 ? Math.round((repairTimes.reduce((s: number, v: number) => s + v, 0) / repairTimes.length) * 10) / 10 : null
    const resolvedCount = alerts.filter((a: any) => a.status === 'resolvido').length
    const resolutionRate = alerts.length > 0 ? Math.round((resolvedCount / alerts.length) * 1000) / 10 : null
    const incidentsByPlant = new Map<string, { count: number; name: string }>()
    for (const a of alerts) { const plant = (plants ?? []).find((p: any) => p.id === a.plant_id); const e = incidentsByPlant.get(a.plant_id) ?? { count: 0, name: plant?.nome ?? 'Unknown' }; e.count++; incidentsByPlant.set(a.plant_id, e) }
    const top5 = Array.from(incidentsByPlant.entries()).map(([id, v]) => ({ plant_id: id, plant_name: v.name, incident_count: v.count })).sort((a, b) => b.incident_count - a.incident_count).slice(0, 5)
    const genByPlant = new Map<string, number>()
    for (const m of metrics) { genByPlant.set(m.plant_id, (genByPlant.get(m.plant_id) ?? 0) + (Number(m.geracao_kwh) || 0)) }
    const totalCap = (plants ?? []).reduce((s: number, p: any) => s + (Number(p.potencia_kwp) || 0), 0)
    const expectedGen = totalCap * peakSunHours * totalDays
    const actualGen = Array.from(genByPlant.values()).reduce((s, v) => s + v, 0)
    const pr = expectedGen > 0 ? Math.round((actualGen / expectedGen) * 1000) / 10 : null
    const plantAvail = (plants ?? []).map((plant: any) => { const pm = metrics.filter((m: any) => m.plant_id === plant.id); const dwd = new Set(pm.map((m: any) => m.timestamp?.substring(0, 10))).size; return { plant_id: plant.id, plant_name: plant.nome, days_online: dwd, days_total: totalDays, availability_percent: Math.round((dwd / totalDays) * 1000) / 10 } })
    const portAvail = plantAvail.length > 0 ? Math.round((plantAvail.reduce((s: number, p: any) => s + p.availability_percent, 0) / plantAvail.length) * 10) / 10 : null
    const osByType: Record<string, number> = {}; for (const t of tickets) { const tp = t.equipamento_tipo ?? 'outros'; osByType[tp] = (osByType[tp] ?? 0) + 1 }
    const completionTimes = tickets.filter((t: any) => t.data_abertura && t.data_conclusao).map((t: any) => (new Date(t.data_conclusao).getTime() - new Date(t.data_abertura).getTime()) / 3600000).filter((h: number) => h >= 0)
    const avgCompletion = completionTimes.length > 0 ? Math.round((completionTimes.reduce((s: number, v: number) => s + v, 0) / completionTimes.length) * 10) / 10 : null
    const kpis = { periodo: `${String(mes).padStart(2,'0')}/${ano}`, cliente_id: cliente_id ?? null, portfolio: { total_plants: (plants ?? []).length, total_capacity_kwp: totalCap, actual_generation_kwh: Math.round(actualGen*100)/100, expected_generation_kwh: Math.round(expectedGen*100)/100, performance_ratio_percent: pr, portfolio_availability_percent: portAvail }, alerts: { total: alerts.length, by_severity: alertsBySeverity, resolved: resolvedCount, resolution_rate_percent: resolutionRate, mttr_hours: mttrHours }, top_incident_plants: top5, plant_availability: plantAvail, work_orders: { total_opened: tickets.length, total_completed: tickets.filter((t: any) => t.status === 'concluido').length, total_cancelled: tickets.filter((t: any) => t.status === 'cancelado').length, avg_completion_hours: avgCompletion, by_equipment_type: osByType } }
    await supabaseAdmin.from('solar_agent_logs').insert([{ agent_name: 'analista', action: 'generate_kpis', input_data: { mes, ano, cliente_id: cliente_id ?? null }, output_data: kpis, status: 'success', duration_ms: Date.now() - startTime }])
    return new Response(JSON.stringify(kpis), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    try { await supabaseAdmin.from('solar_agent_logs').insert([{ agent_name: 'analista', action: 'generate_kpis', status: 'error', error_message: errorMsg, duration_ms: Date.now() - startTime }]) } catch {}
    return new Response(JSON.stringify({ error: errorMsg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
