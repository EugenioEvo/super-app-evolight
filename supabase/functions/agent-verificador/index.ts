import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const RESOLUTION_THRESHOLD = 0.8
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const startTime = Date.now()
  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
  let rmeId: string | null = null, plantId: string | null = null
  try {
    const body = await req.json()
    rmeId = body.rme_id
    if (!rmeId) throw new Error('Missing required field: rme_id')
    const { data: rme, error: rmeErr } = await supabaseAdmin.from('rme_relatorios').select('id, ordem_servico_id, ticket_id').eq('id', rmeId).single()
    if (rmeErr || !rme) throw new Error(`RME not found: ${rmeId}`)
    const osId = body.os_id ?? rme.ordem_servico_id
    const ticketId = body.ticket_id ?? rme.ticket_id
    const [osRes, ticketRes] = await Promise.all([
      supabaseAdmin.from('ordens_servico').select('id, numero_os, ticket_id').eq('id', osId).single(),
      supabaseAdmin.from('tickets').select('id, numero_ticket, titulo, cliente_id').eq('id', ticketId).single(),
    ])
    if (osRes.error || !osRes.data) throw new Error(`OS not found: ${osId}`)
    if (ticketRes.error || !ticketRes.data) throw new Error(`Ticket not found: ${ticketId}`)
    const ticket = ticketRes.data
    const { data: alertas } = await supabaseAdmin.from('solar_alerts').select('id, plant_id, tipo, severidade, status').eq('ticket_id', ticket.id).order('created_at', { ascending: false }).limit(1)
    if (!alertas || alertas.length === 0) {
      await supabaseAdmin.from('solar_agent_logs').insert([{ agent_name: 'verificador', action: 'verify_resolution', status: 'skipped', duration_ms: Date.now()-startTime, input_data: { rme_id: rmeId }, output_data: { reason: 'No solar alert linked' } }])
      return new Response(JSON.stringify({ resolved: null, action_taken: 'skipped', reason: 'Ticket manual sem alerta solar' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const alerta = alertas[0]; plantId = alerta.plant_id
    const now = new Date()
    const last24h = new Date(now.getTime() - 24*60*60*1000).toISOString()
    const thirtyDaysAgo = new Date(now.getTime() - 30*24*60*60*1000).toISOString()
    const [currentRes, histRes] = await Promise.all([
      supabaseAdmin.from('solar_metrics').select('geracao_kwh').eq('plant_id', plantId).gte('timestamp', last24h).limit(100),
      supabaseAdmin.from('solar_metrics').select('geracao_kwh').eq('plant_id', plantId).gte('timestamp', thirtyDaysAgo).lt('timestamp', last24h).limit(1000),
    ])
    const validCurrent = (currentRes.data ?? []).filter((m: any) => m.geracao_kwh != null)
    const validHist = (histRes.data ?? []).filter((m: any) => m.geracao_kwh != null)
    if (validCurrent.length === 0) {
      await supabaseAdmin.from('solar_agent_logs').insert([{ agent_name: 'verificador', action: 'verify_resolution', plant_id: plantId, status: 'pending', duration_ms: Date.now()-startTime, input_data: { rme_id: rmeId }, output_data: { reason: 'No current metrics' } }])
      return new Response(JSON.stringify({ resolved: null, action_taken: 'pending', reason: 'Sem metricas nas ultimas 24h' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const currentAvg = validCurrent.reduce((s: number, m: any) => s + (m.geracao_kwh ?? 0), 0) / validCurrent.length
    const historicalAvg = validHist.length > 0 ? validHist.reduce((s: number, m: any) => s + (m.geracao_kwh ?? 0), 0) / validHist.length : currentAvg
    const ratio = historicalAvg > 0 ? currentAvg / historicalAvg : 1
    const resolved = ratio >= RESOLUTION_THRESHOLD
    const metrics = { current_avg: Math.round(currentAvg*100)/100, historical_avg: Math.round(historicalAvg*100)/100, ratio: Math.round(ratio*1000)/10 }
    let actionTaken: string
    if (resolved) {
      await supabaseAdmin.from('solar_alerts').update({ status: 'resolvido', resolvido_em: new Date().toISOString() }).eq('id', alerta.id)
      actionTaken = 'resolved'
    } else {
      const { data: newAlert } = await supabaseAdmin.from('solar_alerts').insert([{ plant_id: plantId, tipo: 'verificacao_falha', severidade: 'warning', titulo: 'Problema nao resolvido apos manutencao', descricao: `Geracao atual ${metrics.current_avg} kWh = ${metrics.ratio}% da media (${metrics.historical_avg} kWh)`, dados_contexto: { rme_id: rmeId, ratio: metrics.ratio }, ticket_id: ticketId, status: 'aberto' }]).select('id').single()
      if (newAlert) {
        try { await supabaseAdmin.functions.invoke('jarvis-orchestrator', { body: { alert_id: newAlert.id, plant_id: plantId, tipo: 'verificacao_falha', severidade: 'warning' } }) } catch {}
      }
      actionTaken = 'escalated'
    }
    await supabaseAdmin.from('solar_agent_logs').insert([{ agent_name: 'verificador', action: 'verify_resolution', plant_id: plantId, status: 'success', duration_ms: Date.now()-startTime, input_data: { rme_id: rmeId, alert_id: alerta.id }, output_data: { resolved, metrics, action_taken: actionTaken } }])
    return new Response(JSON.stringify({ resolved, metrics, action_taken: actionTaken }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    try { await supabaseAdmin.from('solar_agent_logs').insert([{ agent_name: 'verificador', action: 'verify_resolution', plant_id: plantId, status: 'error', duration_ms: Date.now()-startTime, error_message: errorMessage, input_data: { rme_id: rmeId }, output_data: {} }]) } catch {}
    return new Response(JSON.stringify({ success: false, error: errorMessage }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
