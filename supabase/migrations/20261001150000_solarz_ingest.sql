-- Monitoramento via SolarZ (push externo/JARVIS): o provider 'solarz' passa a
-- ser válido em sync_logs, para a function solarz-ingest registrar execuções.
ALTER TABLE public.sync_logs DROP CONSTRAINT IF EXISTS sync_logs_provider_check;
ALTER TABLE public.sync_logs
  ADD CONSTRAINT sync_logs_provider_check CHECK (provider IN ('sungrow', 'solaredge', 'solarz'));
