import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function proxyHeaders(proxySecret: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Proxy-Secret': proxySecret,
  }
}

async function testAuth(baseUrl: string, headers: Record<string, string>): Promise<{step:string,success:boolean,duration_ms:number,data?:unknown,error?:string}> {
  const start = Date.now()
  try {
    const url = `${baseUrl}/openApi/seller/plantWithInfos/list`
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ page: 0, pageSize: 1 }) })
    const rawText = await res.text()
    let body: any
    try { body = JSON.parse(rawText) } catch {
      return { step: 'auth', success: false, duration_ms: Date.now() - start, error: `Not JSON (${res.status}): ${rawText.substring(0, 300)}` }
    }
    if (!res.ok) return { step: 'auth', success: false, duration_ms: Date.now() - start, error: `HTTP ${res.status}: ${JSON.stringify(body)}` }
    const count = Array.isArray(body.content) ? body.content.length : 0
    return { step: 'auth', success: true, duration_ms: Date.now() - start, data: { message: 'Proxy Auth OK', plants_in_page: count } }
  } catch (err) {
    return { step: 'auth', success: false, duration_ms: Date.now() - start, error: String(err) }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const totalStart = Date.now()
  const results: any[] = []
  try {
    let baseUrl = (Deno.env.get('SOLARZ_API_URL') ?? '').replace(/\/$/, '')
    if (baseUrl && !baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl
    const proxySecret = Deno.env.get('SOLARZ_PROXY_SECRET') ?? ''
    if (!baseUrl || !proxySecret) {
      return new Response(JSON.stringify({ success: false, error: 'Missing: SOLARZ_API_URL and/or SOLARZ_PROXY_SECRET', configured: { SOLARZ_API_URL: !!baseUrl, SOLARZ_PROXY_SECRET: !!proxySecret } }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const authResult = await testAuth(baseUrl, proxyHeaders(proxySecret))
    results.push(authResult)
    return new Response(JSON.stringify({ success: authResult.success, total_duration_ms: Date.now() - totalStart, results }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, total_duration_ms: Date.now() - totalStart, error: String(err), results }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
