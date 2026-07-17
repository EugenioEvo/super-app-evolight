-- Super APP Evolight — Módulo de Monitoramento Solar
-- Tabelas de telemetria de usinas (replicadas do sunflow-dev para o banco
-- unificado ctbvtnuwhcjtxnesthyg). Alimentadas por sync externo (SolarZ).
-- solar_alerts.ticket_id liga o alerta ao fluxo de O&M (tickets).

CREATE TABLE IF NOT EXISTS public.solar_plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  nome text NOT NULL,
  endereco text,
  cidade text,
  estado text,
  potencia_kwp numeric,
  marca_inversor text,
  modelo_inversor text,
  serial_inversor text,
  solarz_plant_id text,
  solarz_status text,
  ultima_sincronizacao timestamptz,
  data_instalacao date,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.solar_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid NOT NULL REFERENCES public.solar_plants(id) ON DELETE CASCADE,
  "timestamp" timestamptz NOT NULL DEFAULT now(),
  geracao_kwh numeric,
  potencia_instantanea_kw numeric,
  corrente_ac numeric,
  corrente_dc numeric,
  eficiencia_percent numeric,
  fator_potencia numeric,
  frequencia_hz numeric,
  irradiacao_wm2 numeric,
  temperatura_inversor numeric,
  tensao_ac numeric,
  tensao_dc numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.solar_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid NOT NULL REFERENCES public.solar_plants(id) ON DELETE CASCADE,
  tipo text,
  severidade text,
  titulo text,
  descricao text,
  dados_contexto jsonb,
  status text NOT NULL DEFAULT 'aberto',
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE SET NULL,
  resolvido_em timestamptz,
  resolvido_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solar_plants_cliente ON public.solar_plants(cliente_id);
CREATE INDEX IF NOT EXISTS idx_solar_plants_ativo ON public.solar_plants(ativo);
CREATE INDEX IF NOT EXISTS idx_solar_metrics_plant_ts ON public.solar_metrics(plant_id, "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_solar_alerts_plant ON public.solar_alerts(plant_id);
CREATE INDEX IF NOT EXISTS idx_solar_alerts_status ON public.solar_alerts(status);
CREATE INDEX IF NOT EXISTS idx_solar_alerts_ticket ON public.solar_alerts(ticket_id);

DROP TRIGGER IF EXISTS update_solar_plants_updated_at ON public.solar_plants;
CREATE TRIGGER update_solar_plants_updated_at BEFORE UPDATE ON public.solar_plants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_solar_alerts_updated_at ON public.solar_alerts;
CREATE TRIGGER update_solar_alerts_updated_at BEFORE UPDATE ON public.solar_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.solar_plants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solar_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solar_alerts  ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- solar_plants
  DROP POLICY IF EXISTS "Staff manage solar_plants" ON public.solar_plants;
  CREATE POLICY "Staff manage solar_plants" ON public.solar_plants FOR ALL
    USING (public.is_staff((SELECT auth.uid()))) WITH CHECK (public.is_staff((SELECT auth.uid())));
  DROP POLICY IF EXISTS "Service role manages solar_plants" ON public.solar_plants;
  CREATE POLICY "Service role manages solar_plants" ON public.solar_plants FOR ALL TO service_role
    USING (true) WITH CHECK (true);
  DROP POLICY IF EXISTS "Clients view own solar_plants" ON public.solar_plants;
  CREATE POLICY "Clients view own solar_plants" ON public.solar_plants FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.clientes c JOIN public.profiles p ON p.id = c.profile_id
      WHERE c.id = solar_plants.cliente_id AND p.user_id = (SELECT auth.uid())
    ));

  -- solar_metrics (via plant → cliente)
  DROP POLICY IF EXISTS "Staff manage solar_metrics" ON public.solar_metrics;
  CREATE POLICY "Staff manage solar_metrics" ON public.solar_metrics FOR ALL
    USING (public.is_staff((SELECT auth.uid()))) WITH CHECK (public.is_staff((SELECT auth.uid())));
  DROP POLICY IF EXISTS "Service role manages solar_metrics" ON public.solar_metrics;
  CREATE POLICY "Service role manages solar_metrics" ON public.solar_metrics FOR ALL TO service_role
    USING (true) WITH CHECK (true);
  DROP POLICY IF EXISTS "Clients view own solar_metrics" ON public.solar_metrics;
  CREATE POLICY "Clients view own solar_metrics" ON public.solar_metrics FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.solar_plants sp
      JOIN public.clientes c ON c.id = sp.cliente_id
      JOIN public.profiles p ON p.id = c.profile_id
      WHERE sp.id = solar_metrics.plant_id AND p.user_id = (SELECT auth.uid())
    ));

  -- solar_alerts (via plant → cliente)
  DROP POLICY IF EXISTS "Staff manage solar_alerts" ON public.solar_alerts;
  CREATE POLICY "Staff manage solar_alerts" ON public.solar_alerts FOR ALL
    USING (public.is_staff((SELECT auth.uid()))) WITH CHECK (public.is_staff((SELECT auth.uid())));
  DROP POLICY IF EXISTS "Service role manages solar_alerts" ON public.solar_alerts;
  CREATE POLICY "Service role manages solar_alerts" ON public.solar_alerts FOR ALL TO service_role
    USING (true) WITH CHECK (true);
  DROP POLICY IF EXISTS "Clients view own solar_alerts" ON public.solar_alerts;
  CREATE POLICY "Clients view own solar_alerts" ON public.solar_alerts FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.solar_plants sp
      JOIN public.clientes c ON c.id = sp.cliente_id
      JOIN public.profiles p ON p.id = c.profile_id
      WHERE sp.id = solar_alerts.plant_id AND p.user_id = (SELECT auth.uid())
    ));
END $$;
