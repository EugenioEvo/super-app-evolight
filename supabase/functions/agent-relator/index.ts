import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
function getMonthRange(mes: number, ano: number) { return { firstDay: new Date(Date.UTC(ano, mes-1, 1)).toISOString(), lastDay: new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999)).toISOString() } }
function daysInMonth(mes: number, ano: number): number { return new Date(ano, mes, 0).getDate() }
function calculatePlantKPIs(plant: any, metrics: any[], alerts: any[], tickets: any[], totalDays: number) {
  const dailyGen = new Map<string, number>()
  for (const m of metrics) { const d = m.timestamp?.substring(0,10) ?? ''; dailyGen.set(d, (dailyGen.get(d) ?? 0) + (Number(m.geracao_kwh)||0)) }
  const geracaoTotal = Array.from(dailyGen.values()).reduce((s,v)=>s+v,0)
  const alertasPorSev: Record<string,number> = {}
  for (const a of alerts) { const s = a.severidade ?? 'unknown'; alertasPorSev[s] = (alertasPorSev[s]??0)+1 }
  return { plant_id: plant.id, plant_name: plant.nome, potencia_kwp: plant.potencia_kwp, geracao_total_kwh: Math.round(geracaoTotal*100)/100, geracao_media_diaria_kwh: dailyGen.size > 0 ? Math.round((geracaoTotal/dailyGen.size)*100)/100 : 0, dias_geracao_zero: totalDays - dailyGen.size, alertas_por_severidade: alertasPorSev, os_abertas: tickets.filter((t:any)=>t.status!=='concluido'&&t.status!=='cancelado').length, os_concluidas: tickets.filter((t:any)=>t.status==='concluido').length }
}
async function generateReportText(kpis: any[], mes: number, ano: number, clienteName: string): Promise<string> {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
  if (!ANTHROPIC_API_KEY) return buildFallback(kpis, mes, ano, clienteName)
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, system: 'Voce e o assistente de relatorios da Evolight Solar. Gere um relatorio mensal profissional em texto puro (sem markdown). Estrutura: Resumo executivo, Desempenho por planta, Incidentes, Recomendacoes.', messages: [{ role: 'user', content: `Cliente: ${clienteName}\nPeriodo: ${String(mes).padStart(2,'0')}/${ano}\n\nDados:\n${JSON.stringify(kpis,null,2)}` }] }) })
    if (!res.ok) return buildFallback(kpis, mes, ano, clienteName)
    const data = await res.json()
    return data.content?.[0]?.text ?? buildFallback(kpis, mes, ano, clienteName)
  } catch { return buildFallback(kpis, mes, ano, clienteName) }
}
function buildFallback(kpis: any[], mes: number, ano: number, clienteName: string): string {
  const totalGen = kpis.reduce((s,k)=>s+k.geracao_total_kwh,0)
  const totalAlertas = kpis.reduce((s,k)=>s+Object.values(k.alertas_por_severidade as Record<string,number>).reduce((a:number,b:number)=>a+b,0),0)
  const totalOS = kpis.reduce((s,k)=>s+k.os_concluidas,0)
  return `RELATORIO MENSAL - ${String(mes).padStart(2,'0')}/${ano}\nCliente: ${clienteName}\n\nRESUMO\nGeracao total: ${totalGen.toFixed(1)} kWh | Alertas: ${totalAlertas} | OS concluidas: ${totalOS} | Plantas: ${kpis.length}\n\nDESEMPENHO\n${kpis.map(k=>`- ${k.plant_name}: ${k.geracao_total_kwh.toFixed(1)} kWh (media ${k.geracao_media_diaria_kwh.toFixed(1)} kWh/dia, ${k.dias_geracao_zero} dias sem geracao)`).join('\n')}\n\nINCIDENTES\n${kpis.map(k=>{const t=Object.values(k.alertas_por_severidade as Record<string,number>).reduce((a:number,b:number)=>a+b,0);return t===0?`- ${k.plant_name}: Nenhum alerta`:`- ${k.plant_name}: ${t} alertas (${Object.entries(k.alertas_por_severidade as Record<string,number>).map(([s,c])=>`${s}: ${c}`).join(', ')})`}).join('\n')}\n\nRelatorio gerado automaticamente - Evolight Solar`
}
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const startTime = Date.now()
  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
  try {
    const { cliente_id, mes, ano } = await req.json()
    if (!cliente_id || !mes || !ano) return new Response(JSON.stringify({ error: 'cliente_id, mes, ano required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const { firstDay, lastDay } = getMonthRange(mes, ano)
    const totalDays = daysInMonth(mes, ano)
    const { data: cliente } = await supabaseAdmin.from('clientes').select('id, empresa, cidade').eq('id', cliente_id).single()
    if (!cliente) return new Response(JSON.stringify({ error: 'Client not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const { data: plants } = await supabaseAdmin.from('solar_plants').select('id, nome, potencia_kwp').eq('cliente_id', cliente_id).eq('ativo', true)
    if (!plants || plants.length === 0) return new Response(JSON.stringify({ error: 'No active plants' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const plantIds = plants.map((p: any) => p.id)
    const [metricsRes, alertsRes, ticketsRes] = await Promise.all([
      supabaseAdmin.from('solar_metrics').select('plant_id, timestamp, geracao_kwh').in('plant_id', plantIds).gte('timestamp', firstDay).lte('timestamp', lastDay),
      supabaseAdmin.from('solar_alerts').select('plant_id, tipo, severidade, status').in('plant_id', plantIds).gte('created_at', firstDay).lte('created_at', lastDay),
      supabaseAdmin.from('tickets').select('id, status, data_conclusao, equipamento_tipo').eq('cliente_id', cliente_id).gte('data_conclusao', firstDay).lte('data_conclusao', lastDay),
    ])
    const allMetrics = metricsRes.data ?? [], allAlerts = alertsRes.data ?? [], allTickets = ticketsRes.data ?? []
    const plantKPIs = plants.map((plant: any) => calculatePlantKPIs(plant, allMetrics.filter((m:any)=>m.plant_id===plant.id), allAlerts.filter((a:any)=>a.plant_id===plant.id), allTickets, totalDays))
    const reportText = await generateReportText(plantKPIs, mes, ano, cliente.empresa ?? 'Cliente')
    await supabaseAdmin.from('solar_agent_logs').insert([{ agent_name: 'relator', action: 'generate_monthly_report', input_data: { cliente_id, mes, ano }, output_data: { report_text: reportText.substring(0,500), kpis_summary: plantKPIs }, status: 'success', duration_ms: Date.now()-startTime }])
    return new Response(JSON.stringify({ report_text: reportText, kpis: plantKPIs, plants_summary: { total_plants: plants.length, total_generation_kwh: plantKPIs.reduce((s:number,k:any)=>s+k.geracao_total_kwh,0), total_alerts: allAlerts.length, total_os_concluidas: allTickets.filter((t:any)=>t.status==='concluido').length }, periodo: `${String(mes).padStart(2,'0')}/${ano}`, cliente: cliente.empresa }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    try { await supabaseAdmin.from('solar_agent_logs').insert([{ agent_name: 'relator', action: 'generate_monthly_report', status: 'error', error_message: errorMsg, duration_ms: Date.now()-startTime }]) } catch {}
    return new Response(JSON.stringify({ error: errorMsg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
