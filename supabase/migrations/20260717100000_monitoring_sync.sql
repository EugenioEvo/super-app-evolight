-- Super APP Evolight — Sincronização de Monitoramento (Sungrow / SolarEdge)
-- Adiciona credenciais por usina, log de sincronização e colunas de controle
-- em solar_plants. Portado da lógica do Monitor.ai (monitor-ai-insight),
-- corrigindo os problemas conhecidos da origem: credenciais nunca em coluna
-- aberta (aqui só staff/service_role enxergam plant_credentials via RLS),
-- sem policy de cliente nas duas tabelas novas.

CREATE TABLE IF NOT EXISTS public.plant_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid NOT NULL REFERENCES public.solar_plants(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('sungrow', 'solaredge')),
  credentials jsonb NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plant_id, provider)
);

CREATE TABLE IF NOT EXISTS public.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid NOT NULL REFERENCES public.solar_plants(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('sungrow', 'solaredge')),
  status text NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  mensagem text,
  metrics_inseridas integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

-- Colunas de controle de sincronização em solar_plants.
ALTER TABLE public.solar_plants
  ADD COLUMN IF NOT EXISTS monitoring_provider text CHECK (monitoring_provider IN ('solarz', 'sungrow', 'solaredge', 'manual')),
  ADD COLUMN IF NOT EXISTS api_site_id text,
  ADD COLUMN IF NOT EXISTS sync_enabled boolean NOT NULL DEFAULT false;

-- Índice único usado pelo upsert de métricas nos conectores (onConflict plant_id+timestamp).
CREATE UNIQUE INDEX IF NOT EXISTS uq_solar_metrics_plant_timestamp
  ON public.solar_metrics(plant_id, "timestamp");

CREATE INDEX IF NOT EXISTS idx_plant_credentials_plant ON public.plant_credentials(plant_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_plant ON public.sync_logs(plant_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON public.sync_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_solar_plants_sync_enabled ON public.solar_plants(sync_enabled);

DROP TRIGGER IF EXISTS update_plant_credentials_updated_at ON public.plant_credentials;
CREATE TRIGGER update_plant_credentials_updated_at BEFORE UPDATE ON public.plant_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.plant_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs         ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- plant_credentials: SOMENTE staff gerencia (dados sensíveis; sem policy de cliente).
  DROP POLICY IF EXISTS "Staff manage plant_credentials" ON public.plant_credentials;
  CREATE POLICY "Staff manage plant_credentials" ON public.plant_credentials FOR ALL
    USING (public.is_staff((SELECT auth.uid()))) WITH CHECK (public.is_staff((SELECT auth.uid())));
  DROP POLICY IF EXISTS "Service role manages plant_credentials" ON public.plant_credentials;
  CREATE POLICY "Service role manages plant_credentials" ON public.plant_credentials FOR ALL TO service_role
    USING (true) WITH CHECK (true);

  -- sync_logs: staff só lê (escrita é sempre via service_role, pelas edge functions).
  DROP POLICY IF EXISTS "Staff view sync_logs" ON public.sync_logs;
  CREATE POLICY "Staff view sync_logs" ON public.sync_logs FOR SELECT
    USING (public.is_staff((SELECT auth.uid())));
  DROP POLICY IF EXISTS "Service role manages sync_logs" ON public.sync_logs;
  CREATE POLICY "Service role manages sync_logs" ON public.sync_logs FOR ALL TO service_role
    USING (true) WITH CHECK (true);
END $$;
