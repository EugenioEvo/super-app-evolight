-- Agendamento do monitoring-scheduler via pg_cron + pg_net (Parte B do monitoramento).
-- NÃO é migration: contém o SCHEDULER_SECRET, então deve ser executado manualmente
-- no SQL Editor (ou via MCP) com o placeholder substituído — nunca commitado preenchido.
--
-- Pré-requisitos:
--   1. Edge function monitoring-scheduler deployada com verify_jwt=false.
--   2. Secret SCHEDULER_SECRET definido nas edge functions
--      (supabase secrets set SCHEDULER_SECRET=... --project-ref ctbvtnuwhcjtxnesthyg).
--   3. Substituir <SCHEDULER_SECRET> abaixo pelo MESMO valor.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove agendamento anterior, se existir (idempotente).
DO $do$
BEGIN
  PERFORM cron.unschedule('monitoring-sync');
EXCEPTION WHEN OTHERS THEN
  NULL;
END
$do$;

-- Mesmo intervalo do Monitor.ai original: a cada 30 minutos.
SELECT cron.schedule(
  'monitoring-sync',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ctbvtnuwhcjtxnesthyg.supabase.co/functions/v1/monitoring-scheduler',
    headers := '{"Content-Type": "application/json", "X-Scheduler-Secret": "<SCHEDULER_SECRET>"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) AS request_id;
  $$
);

-- Conferência: SELECT jobname, schedule, active FROM cron.job;
