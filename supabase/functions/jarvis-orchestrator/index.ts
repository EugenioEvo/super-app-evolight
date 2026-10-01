import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

const SYSTEM_PROMPT = `Voce e o JARVIS, assistente de operacoes da Evolight Solar.
Analise o alerta e decida a melhor acao. Responda APENAS com JSON:
{"action": "criar_os" | "notificar_cliente" | "aguardar" | "escalar", "reason": "motivo curto", "priority": "critica" | "alta" | "media" | "baixa"}`

function buildUserPrompt(ctx: any): string {
  return [
    `Alerta: ${ctx.alert.tipo} (${ctx.alert.severidade})`,
    `Titulo: ${ctx.alert.titulo ?? 'N/A'}`,
    `Planta: ${ctx.plant.nome} (${ctx.plant.potencia_kwp ?? '?'} kWp) - ${ctx.plant.cidade ?? 'N/A'}`,
    `Cliente: ${ctx.cliente?.empresa ?? 'N/A'}`,
    `Historico: ${ctx.history.length} alertas anteriores`,
    `OS Abertas: ${ctx.openTickets.length}`,
    `Metricas 24h: ${ctx.metrics.length} registros`,
  ].join('\n')
}

function fallbackDecision(severidade: string) {
  if (severidade === 'critical' || severidade === 'warning') return { action: 'criar_os', reason: 'Fallback: IA indisponivel', priority: severidade === 'critical' ? 'critica' : 'alta' }
  return { action: 'aguardar', reason: 'Fallback: severidade baixa', priority: 'baixa' }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const startTime = Date.now()
  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
  let plantId: string | null = null, alertType: string | null = null, severidade: string | null = null

  try {
    const body = await req.json()
    const alertId: string = body.alert_id
    plantId = body.plant_id; alertType = body.tipo; severidade = body.severidade
    if (!alertId || !plantId || !alertType || !severidade) throw new Error('Missing required fields: alert_id, plant_id, tipo, severidade')

    const [plantRes, alertRes, historyRes] = await Promise.all([
      supabaseAdmin.from('solar_plants').select('id, nome, cidade, estado, cliente_id, potencia_kwp, marca_inversor').eq('id', plantId).single(),
      supabaseAdmin.from('solar_alerts').select('id, titulo, descricao, tipo, severidade, status').eq('id', alertId).single(),
      supabaseAdmin.from('solar_alerts').select('id, tipo, severidade, status, created_at').eq('plant_id', plantId).order('created_at', { ascending: false }).limit(10),
    ])

    if (plantRes.error || !plantRes.data) throw new Error(`Plant not found: ${plantId}`)
    const plant = plantRes.data
    const alert = alertRes.data ?? { tipo: alertType, severidade, titulo: null }
    const history = historyRes.data ?? []

    const [clienteRes, ticketsRes, metricsRes] = await Promise.all([
      supabaseAdmin.from('clientes').select('id, empresa, cidade').eq('id', plant.cliente_id).single(),
      supabaseAdmin.from('tickets').select('id, numero_ticket, titulo, status').eq('cliente_id', plant.cliente_id).not('status', 'in', '("concluido","cancelado")'),
      supabaseAdmin.from('solar_metrics').select('geracao_kwh, potencia_instantanea_kw, timestamp').eq('plant_id', plantId).gte('timestamp', new Date(Date.now() - 24*60*60*1000).toISOString()).limit(50),
    ])

    const cliente = clienteRes.data
    const openTickets = ticketsRes.data ?? []
    const metrics = metricsRes.data ?? []

    let decision: any
    let aiRaw: string | null = null

    try {
      const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
      if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')
      const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 300, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: buildUserPrompt({ alert, plant, cliente, history, openTickets, metrics }) }] }),
      })
      if (!aiResponse.ok) throw new Error(`Claude API ${aiResponse.status}`)
      const aiData = await aiResponse.json()
      const content = aiData.content?.[0]?.text ?? ''
      aiRaw = content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in Claude response')
      decision = JSON.parse(jsonMatch[0])
      if (!['criar_os','notificar_cliente','aguardar','escalar'].includes(decision.action)) throw new Error(`Invalid action: ${decision.action}`)
    } catch (aiErr) {
      console.error('AI failed, fallback:', aiErr)
      decision = fallbackDecision(severidade)
      aiRaw = `fallback: ${(aiErr as Error).message}`
    }

    let dispatchedTo: string | null = null
    if (decision.action === 'criar_os' || decision.action === 'escalar') {
      const sev = decision.action === 'escalar' ? 'critical' : severidade
      if (decision.action === 'escalar') await supabaseAdmin.from('solar_alerts').update({ severidade: 'critical' }).eq('id', alertId)
      await supabaseAdmin.functions.invoke('agent-dispatcher', { body: { plant_id: plantId, alert_type: alertType, severity: sev, reason: decision.reason, priority: decision.priority } })
      dispatchedTo = decision.action === 'escalar' ? 'agent-dispatcher (escalado)' : 'agent-dispatcher'
    } else if (decision.action === 'notificar_cliente') {
      dispatchedTo = 'notificacao (pendente)'
    }

    const durationMs = Date.now() - startTime
    await supabaseAdmin.from('solar_agent_logs').insert([{ agent_name: 'jarvis', action: 'orchestrate_decision', plant_id: plantId, status: 'success', duration_ms: durationMs, input_data: { alert_id: alertId, tipo: alertType, severidade }, output_data: { decision, ai_raw: aiRaw, dispatched_to: dispatchedTo } }])

    return new Response(JSON.stringify({ success: true, decision: decision.action, reason: decision.reason, priority: decision.priority, dispatched_to: dispatchedTo }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    const durationMs = Date.now() - startTime
    try { await supabaseAdmin.from('solar_agent_logs').insert([{ agent_name: 'jarvis', action: 'orchestrate_decision', plant_id: plantId, status: 'error', duration_ms: durationMs, error_message: errorMessage, input_data: { tipo: alertType, severidade }, output_data: {} }]) } catch {}
    return new Response(JSON.stringify({ success: false, error: errorMessage }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
