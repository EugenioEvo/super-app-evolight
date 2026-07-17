// Scheduler de sincronização de monitoramento — porte adaptado de
// monitor-ai-insight (supabase/functions/scheduler). Percorre solar_plants
// com sync_enabled=true e invoca o conector correspondente ao
// monitoring_provider. Protegido por header X-Scheduler-Secret (comparado a
// env SCHEDULER_SECRET) em vez de verify_jwt, já que é chamado por cron
// (sem sessão de usuário) — mesmo padrão de outras functions cron do repo
// (ex.: send-os-reminders, process-email-retries) que usam verify_jwt=false.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildCorsHeaders, jsonResponse, createServiceClient } from '../_shared/monitoring.ts';

const PROVIDER_FUNCTION: Record<string, string> = {
  sungrow: 'sungrow-connector',
  solaredge: 'solaredge-connector',
};

serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  const expectedSecret = Deno.env.get('SCHEDULER_SECRET');
  const providedSecret = req.headers.get('X-Scheduler-Secret');
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return jsonResponse({ error: 'Unauthorized' }, 401, cors);
  }

  const supabase = createServiceClient();

  try {
    const { data: plants, error } = await supabase
      .from('solar_plants')
      .select('id, nome, monitoring_provider, sync_enabled')
      .eq('sync_enabled', true)
      .eq('ativo', true);

    if (error) throw error;

    const results: Array<{ plantId: string; provider: string; success: boolean; message: string }> = [];

    for (const plant of plants ?? []) {
      const provider = (plant as any).monitoring_provider as string | null;
      const functionName = provider ? PROVIDER_FUNCTION[provider] : undefined;

      if (!functionName) {
        // solarz/manual ou sem provider definido: não há conector a invocar aqui.
        continue;
      }

      try {
        // Chamada server-to-server: os conectores aceitam X-Scheduler-Secret
        // (via requireStaffOrScheduler) como alternativa ao JWT de staff,
        // já que aqui não há sessão de usuário humano.
        const { data, error: invokeError } = await supabase.functions.invoke(functionName, {
          body: { action: 'sync_data', plantId: plant.id },
          headers: {
            'X-Scheduler-Secret': expectedSecret,
          },
        });

        if (invokeError) throw invokeError;
        results.push({ plantId: plant.id, provider, success: !!data?.success, message: data?.message ?? data?.error ?? '' });
      } catch (err: any) {
        results.push({ plantId: plant.id, provider, success: false, message: err?.message || 'Erro ao invocar conector' });
      }
    }

    return jsonResponse(
      {
        success: true,
        totalPlants: plants?.length ?? 0,
        results,
      },
      200,
      cors
    );
  } catch (error: any) {
    console.error('Erro no monitoring-scheduler:', error);
    return jsonResponse({ error: error.message || 'Erro interno' }, 500, cors);
  }
});
