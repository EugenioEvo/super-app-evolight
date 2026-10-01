-- Porte do pipeline JARVIS (sunflow-dev → super-app-evolight).
-- 1) solar_agent_logs: trilha de execução dos agentes (jarvis-orchestrator,
--    agent-monitor, agent-dispatcher, agent-analista/verificador/relator).
-- 2) tickets.origem: usada pelo dispatcher para deduplicar tickets do agente
--    (existia no sunflow-dev; a importação a descartou por não existir aqui).

CREATE TABLE IF NOT EXISTS public.solar_agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  action text NOT NULL,
  plant_id uuid REFERENCES public.solar_plants(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('success', 'error')),
  duration_ms integer,
  error_message text,
  input_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solar_agent_logs_created ON public.solar_agent_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solar_agent_logs_agent ON public.solar_agent_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_solar_agent_logs_plant ON public.solar_agent_logs(plant_id);

ALTER TABLE public.solar_agent_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Escrita só via service_role (edge functions); staff lê.
  DROP POLICY IF EXISTS "Service role manages solar_agent_logs" ON public.solar_agent_logs;
  CREATE POLICY "Service role manages solar_agent_logs" ON public.solar_agent_logs FOR ALL TO service_role
    USING (true) WITH CHECK (true);
  DROP POLICY IF EXISTS "Staff view solar_agent_logs" ON public.solar_agent_logs;
  CREATE POLICY "Staff view solar_agent_logs" ON public.solar_agent_logs FOR SELECT
    USING (public.is_staff((SELECT auth.uid())));
END $$;

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS origem text;
