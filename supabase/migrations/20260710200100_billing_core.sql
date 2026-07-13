-- ============================================================================
-- SUPER APP EVOLIGHT - Módulo Billing (Faturamento GD)
-- Fusão energy-insights (wegen-energy) -> sunflow-dev
-- Arquivo 2/2: tabelas core do faturamento GD:
--   unidades_consumidoras, faturas_mensais, geracoes_mensais,
--   assinaturas_mensais, cliente_usina_vinculo, usina_geracao_mensal,
--   usina_rateio_mensal + RLS, triggers e índices.
-- Adaptações: usinas_remotas NÃO é criada — a usina canônica é
-- public.cliente_ufvs (colunas regulatórias adicionadas no arquivo 1);
-- as FKs usam ufv_id -> cliente_ufvs(id). cliente_id referencia a tabela
-- canônica public.clientes do Sunflow.
-- RLS: staff total via is_staff(auth.uid()); cliente SELECT via
-- clientes.profile_id -> profiles.id / profiles.user_id = auth.uid()
-- (mesmo idioma das policies existentes de cliente_ufvs); service_role total.
-- Depende de: 20260710200000_billing_enums_e_referencia.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. unidades_consumidoras
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.unidades_consumidoras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  endereco TEXT NOT NULL,
  distribuidora TEXT NOT NULL,
  modalidade_tarifaria TEXT NOT NULL CHECK (modalidade_tarifaria IN ('convencional', 'branca', 'verde', 'azul')),
  demanda_contratada NUMERIC NOT NULL DEFAULT 0,
  -- Wizard Equatorial/Grupo A
  concessionaria TEXT NOT NULL DEFAULT 'Equatorial Goiás',
  classe_tarifaria TEXT,
  tensao_kv NUMERIC DEFAULT 13.8,
  tipo_fornecimento TEXT DEFAULT 'TRIFÁSICO',
  demanda_geracao_kw NUMERIC DEFAULT 0,
  -- Lei 14.300
  grupo_tarifario TEXT DEFAULT 'B',
  subgrupo TEXT,
  custo_disponibilidade_kwh NUMERIC DEFAULT 100,
  tem_geracao_propria BOOLEAN DEFAULT false,
  data_protocolo_gd DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.unidades_consumidoras.grupo_tarifario IS 'Grupo tarifário: A (alta tensão) ou B (baixa tensão)';
COMMENT ON COLUMN public.unidades_consumidoras.subgrupo IS 'Subgrupo tarifário: A1, A2, A3, A4, AS, B1, B2, B3';
COMMENT ON COLUMN public.unidades_consumidoras.custo_disponibilidade_kwh IS 'Custo de disponibilidade em kWh (30, 50 ou 100)';
COMMENT ON COLUMN public.unidades_consumidoras.tem_geracao_propria IS 'Indica se UC possui geração própria (autoconsumo local)';
COMMENT ON COLUMN public.unidades_consumidoras.data_protocolo_gd IS 'Data de protocolo da GD para esta UC';

-- ----------------------------------------------------------------------------
-- 2. faturas_mensais (DDL consolidado com todas as extensões, incl. Lei 14.300)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faturas_mensais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uc_id UUID NOT NULL REFERENCES public.unidades_consumidoras(id) ON DELETE CASCADE,
  mes_ref TEXT NOT NULL, -- YYYY-MM
  consumo_total_kwh NUMERIC NOT NULL DEFAULT 0,
  ponta_kwh NUMERIC NOT NULL DEFAULT 0,
  fora_ponta_kwh NUMERIC NOT NULL DEFAULT 0,
  demanda_contratada_kw NUMERIC NOT NULL DEFAULT 0,
  demanda_medida_kw NUMERIC NOT NULL DEFAULT 0,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  valor_te NUMERIC NOT NULL DEFAULT 0,
  valor_tusd NUMERIC NOT NULL DEFAULT 0,
  bandeiras TEXT NOT NULL CHECK (bandeiras IN ('verde', 'amarela', 'vermelha1', 'vermelha2')),
  multa_demanda NUMERIC NOT NULL DEFAULT 0,
  multa_reativo NUMERIC NOT NULL DEFAULT 0,
  outros_encargos NUMERIC NOT NULL DEFAULT 0,

  -- Campos específicos Grupo A
  demanda_geracao_kw NUMERIC NOT NULL DEFAULT 0,
  multa_ufer_ponta NUMERIC NOT NULL DEFAULT 0,
  multa_ufer_fora_ponta NUMERIC NOT NULL DEFAULT 0,
  iluminacao_publica NUMERIC NOT NULL DEFAULT 0,
  multa_demanda_ultrapassagem NUMERIC NOT NULL DEFAULT 0,
  energia_ponta_rs NUMERIC NOT NULL DEFAULT 0,
  energia_fora_ponta_rs NUMERIC NOT NULL DEFAULT 0,
  demanda_contratada_rs NUMERIC NOT NULL DEFAULT 0,
  demanda_geracao_rs NUMERIC NOT NULL DEFAULT 0,

  -- Cabeçalho / ciclo de leitura
  status TEXT NOT NULL DEFAULT 'rascunho',
  data_emissao DATE,
  data_apresentacao DATE,
  leitura_anterior DATE,
  leitura_atual DATE,
  dias_faturados INTEGER,
  proxima_leitura DATE,
  vencimento DATE,

  -- Consumo reservado (horário reservado)
  consumo_reservado_kwh NUMERIC DEFAULT 0,

  -- Demanda
  demanda_ultrapassagem_kw NUMERIC DEFAULT 0,
  valor_demanda_rs NUMERIC DEFAULT 0,
  valor_demanda_ultrapassagem_rs NUMERIC DEFAULT 0,

  -- SCEE / GD
  scee_geracao_ciclo_ponta_kwh NUMERIC DEFAULT 0,
  scee_geracao_ciclo_fp_kwh NUMERIC DEFAULT 0,
  scee_geracao_ciclo_hr_kwh NUMERIC DEFAULT 0,
  scee_credito_recebido_kwh NUMERIC DEFAULT 0,
  scee_excedente_recebido_kwh NUMERIC DEFAULT 0,
  scee_saldo_kwh_p NUMERIC DEFAULT 0,
  scee_saldo_kwh_fp NUMERIC DEFAULT 0,
  scee_saldo_kwh_hr NUMERIC DEFAULT 0,
  scee_saldo_expirar_30d_kwh NUMERIC DEFAULT 0,
  scee_saldo_expirar_60d_kwh NUMERIC DEFAULT 0,
  scee_rateio_percent NUMERIC DEFAULT 0,

  -- Bandeiras TE
  bandeira_te_p_rs NUMERIC DEFAULT 0,
  bandeira_te_fp_rs NUMERIC DEFAULT 0,
  bandeira_te_hr_rs NUMERIC DEFAULT 0,

  -- Consumo não compensado TUSD
  nao_compensado_tusd_p_rs NUMERIC DEFAULT 0,
  nao_compensado_tusd_fp_rs NUMERIC DEFAULT 0,
  nao_compensado_tusd_hr_rs NUMERIC DEFAULT 0,

  -- Consumo não compensado TE
  nao_compensado_te_p_rs NUMERIC DEFAULT 0,
  nao_compensado_te_fp_rs NUMERIC DEFAULT 0,
  nao_compensado_te_hr_rs NUMERIC DEFAULT 0,

  -- SCEE compensação
  scee_consumo_fp_tusd_rs NUMERIC DEFAULT 0,
  scee_parcela_te_fp_rs NUMERIC DEFAULT 0,
  scee_injecao_fp_te_rs NUMERIC DEFAULT 0,
  scee_injecao_fp_tusd_rs NUMERIC DEFAULT 0,

  -- Reativo + CIP
  ufer_fp_kvarh NUMERIC DEFAULT 0,
  ufer_fp_rs NUMERIC DEFAULT 0,
  cip_rs NUMERIC DEFAULT 0,

  -- Tributos
  base_pis_cofins_rs NUMERIC DEFAULT 0,
  pis_aliquota_percent NUMERIC DEFAULT 0,
  pis_rs NUMERIC DEFAULT 0,
  cofins_aliquota_percent NUMERIC DEFAULT 0,
  cofins_rs NUMERIC DEFAULT 0,
  base_icms_rs NUMERIC DEFAULT 0,
  icms_aliquota_percent NUMERIC DEFAULT 0,
  icms_rs NUMERIC DEFAULT 0,

  -- Alertas gerados
  alertas JSONB DEFAULT '[]'::jsonb,
  recomendacoes JSONB DEFAULT '[]'::jsonb,

  -- Energia simultânea vs créditos de assinatura
  energia_simultanea_kwh NUMERIC DEFAULT 0,
  energia_simultanea_rs NUMERIC DEFAULT 0,
  credito_assinatura_kwh NUMERIC DEFAULT 0,
  credito_assinatura_rs NUMERIC DEFAULT 0,
  desconto_assinatura_percent NUMERIC DEFAULT 0,

  -- Lei 14.300: decomposição TUSD
  tusd_fio_a_rs NUMERIC DEFAULT 0,
  tusd_fio_b_rs NUMERIC DEFAULT 0,
  tusd_encargos_rs NUMERIC DEFAULT 0,
  percentual_fio_b_aplicado NUMERIC DEFAULT 0,
  economia_simultaneidade_rs NUMERIC DEFAULT 0,
  economia_compensacao_rs NUMERIC DEFAULT 0,
  valor_nao_compensavel_rs NUMERIC DEFAULT 0,
  classificacao_gd_aplicada TEXT DEFAULT 'gd2',

  -- Geração local (usina junto à carga)
  geracao_local_total_kwh NUMERIC DEFAULT 0,
  autoconsumo_ponta_kwh NUMERIC DEFAULT 0,
  autoconsumo_fp_kwh NUMERIC DEFAULT 0,
  autoconsumo_hr_kwh NUMERIC DEFAULT 0,
  autoconsumo_total_kwh NUMERIC DEFAULT 0,
  autoconsumo_rs NUMERIC DEFAULT 0,
  injecao_ponta_kwh NUMERIC DEFAULT 0,
  injecao_fp_kwh NUMERIC DEFAULT 0,
  injecao_hr_kwh NUMERIC DEFAULT 0,
  injecao_total_kwh NUMERIC DEFAULT 0,

  -- Créditos remotos (da usina assinada)
  credito_remoto_kwh NUMERIC DEFAULT 0,
  credito_remoto_compensado_rs NUMERIC DEFAULT 0,
  custo_assinatura_rs NUMERIC DEFAULT 0,
  economia_liquida_rs NUMERIC DEFAULT 0,

  -- Controle
  consumo_residual_kwh NUMERIC DEFAULT 0,
  consumo_final_kwh NUMERIC DEFAULT 0,
  grupo_tarifario TEXT DEFAULT 'A',

  -- Detalhamento por posto horário (R$/kWh)
  autoconsumo_ponta_rs NUMERIC DEFAULT 0,
  autoconsumo_fp_rs NUMERIC DEFAULT 0,
  autoconsumo_hr_rs NUMERIC DEFAULT 0,
  credito_remoto_ponta_kwh NUMERIC DEFAULT 0,
  credito_remoto_fp_kwh NUMERIC DEFAULT 0,
  credito_remoto_hr_kwh NUMERIC DEFAULT 0,
  credito_remoto_ponta_rs NUMERIC DEFAULT 0,
  credito_remoto_fp_rs NUMERIC DEFAULT 0,
  credito_remoto_hr_rs NUMERIC DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(uc_id, mes_ref)
);

COMMENT ON COLUMN public.faturas_mensais.status IS 'Status da fatura: rascunho, fechado';
COMMENT ON COLUMN public.faturas_mensais.tusd_fio_a_rs IS 'Componente Fio A da TUSD (transporte até subestação)';
COMMENT ON COLUMN public.faturas_mensais.tusd_fio_b_rs IS 'Componente Fio B da TUSD (distribuição local)';
COMMENT ON COLUMN public.faturas_mensais.tusd_encargos_rs IS 'Encargos setoriais embutidos na TUSD';
COMMENT ON COLUMN public.faturas_mensais.percentual_fio_b_aplicado IS 'Percentual de Fio B não compensável aplicado conforme ano';
COMMENT ON COLUMN public.faturas_mensais.valor_nao_compensavel_rs IS 'Valor não compensável conforme Lei 14.300';
COMMENT ON COLUMN public.faturas_mensais.classificacao_gd_aplicada IS 'Classificação GD aplicada nesta fatura (gd1 ou gd2)';
COMMENT ON COLUMN public.faturas_mensais.autoconsumo_total_kwh IS 'Energia consumida simultaneamente (100% economia)';
COMMENT ON COLUMN public.faturas_mensais.credito_remoto_kwh IS 'Créditos recebidos da usina remota assinada';
COMMENT ON COLUMN public.faturas_mensais.economia_liquida_rs IS 'Economia líquida (compensação - custo assinatura)';
COMMENT ON COLUMN public.faturas_mensais.grupo_tarifario IS 'Grupo tarifário no momento da fatura (A=binômia, B=monômia)';

-- ----------------------------------------------------------------------------
-- 3. geracoes_mensais
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.geracoes_mensais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uc_id UUID NOT NULL REFERENCES public.unidades_consumidoras(id) ON DELETE CASCADE,
  mes_ref TEXT NOT NULL, -- YYYY-MM
  geracao_total_kwh NUMERIC NOT NULL DEFAULT 0,
  autoconsumo_kwh NUMERIC NOT NULL DEFAULT 0,
  injecao_kwh NUMERIC NOT NULL DEFAULT 0,
  compensacao_kwh NUMERIC NOT NULL DEFAULT 0,
  disponibilidade_percent NUMERIC NOT NULL DEFAULT 100,
  perdas_estimadas_kwh NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(uc_id, mes_ref)
);

-- ----------------------------------------------------------------------------
-- 4. cliente_usina_vinculo (usina_id -> ufv_id apontando para cliente_ufvs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cliente_usina_vinculo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  ufv_id UUID NOT NULL REFERENCES public.cliente_ufvs(id) ON DELETE CASCADE,
  uc_beneficiaria_id UUID NOT NULL REFERENCES public.unidades_consumidoras(id) ON DELETE CASCADE,
  percentual_rateio NUMERIC NOT NULL DEFAULT 0 CHECK (percentual_rateio >= 0 AND percentual_rateio <= 100),
  energia_contratada_kwh NUMERIC NOT NULL DEFAULT 0,
  desconto_garantido_percent NUMERIC NOT NULL DEFAULT 0,
  data_inicio_contrato DATE,
  data_fim_contrato DATE,
  numero_contrato TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  modalidade_economia public.modalidade_economia DEFAULT 'desconto_fatura_global',
  tarifa_ppa_rs_kwh NUMERIC DEFAULT 0,
  referencia_desconto public.referencia_desconto DEFAULT 'valor_total',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, ufv_id, uc_beneficiaria_id)
);

-- ----------------------------------------------------------------------------
-- 5. assinaturas_mensais (usina_id -> ufv_id)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assinaturas_mensais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uc_id UUID NOT NULL REFERENCES public.unidades_consumidoras(id) ON DELETE CASCADE,
  mes_ref TEXT NOT NULL, -- YYYY-MM
  uc_remota TEXT NOT NULL,
  energia_contratada_kwh NUMERIC NOT NULL DEFAULT 0,
  energia_alocada_kwh NUMERIC NOT NULL DEFAULT 0,
  valor_assinatura NUMERIC NOT NULL DEFAULT 0,
  economia_prometida_percent NUMERIC NOT NULL DEFAULT 0,
  ufv_id UUID REFERENCES public.cliente_ufvs(id),
  vinculo_id UUID REFERENCES public.cliente_usina_vinculo(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(uc_id, mes_ref)
);

-- ----------------------------------------------------------------------------
-- 6. usina_geracao_mensal (usina_id -> ufv_id)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usina_geracao_mensal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ufv_id UUID NOT NULL REFERENCES public.cliente_ufvs(id) ON DELETE CASCADE,
  mes_ref TEXT NOT NULL, -- YYYY-MM
  geracao_total_kwh NUMERIC NOT NULL DEFAULT 0,
  geracao_ponta_kwh NUMERIC DEFAULT 0,
  geracao_fora_ponta_kwh NUMERIC DEFAULT 0,
  geracao_reservado_kwh NUMERIC DEFAULT 0,
  fator_capacidade_percent NUMERIC,
  disponibilidade_percent NUMERIC DEFAULT 100,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ufv_id, mes_ref)
);

-- ----------------------------------------------------------------------------
-- 7. usina_rateio_mensal
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usina_rateio_mensal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  geracao_id UUID NOT NULL REFERENCES public.usina_geracao_mensal(id) ON DELETE CASCADE,
  vinculo_id UUID NOT NULL REFERENCES public.cliente_usina_vinculo(id) ON DELETE CASCADE,
  uc_beneficiaria_id UUID NOT NULL REFERENCES public.unidades_consumidoras(id),
  energia_alocada_kwh NUMERIC NOT NULL DEFAULT 0,
  energia_ponta_kwh NUMERIC DEFAULT 0,
  energia_fora_ponta_kwh NUMERIC DEFAULT 0,
  energia_reservado_kwh NUMERIC DEFAULT 0,
  percentual_aplicado NUMERIC NOT NULL DEFAULT 0,
  valor_fatura_usina_rs NUMERIC DEFAULT 0,
  valor_compensado_estimado_rs NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'utilizado', 'expirado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(geracao_id, vinculo_id)
);

-- ----------------------------------------------------------------------------
-- 8. Índices
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ucs_cliente_id ON public.unidades_consumidoras(cliente_id);
CREATE INDEX IF NOT EXISTS idx_faturas_uc_id ON public.faturas_mensais(uc_id);
CREATE INDEX IF NOT EXISTS idx_faturas_mes_ref ON public.faturas_mensais(mes_ref);
CREATE INDEX IF NOT EXISTS idx_faturas_mensais_status ON public.faturas_mensais(status);
CREATE INDEX IF NOT EXISTS idx_geracoes_uc_id ON public.geracoes_mensais(uc_id);
CREATE INDEX IF NOT EXISTS idx_geracoes_mes_ref ON public.geracoes_mensais(mes_ref);
CREATE INDEX IF NOT EXISTS idx_assinaturas_uc_id ON public.assinaturas_mensais(uc_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_mes_ref ON public.assinaturas_mensais(mes_ref);
CREATE INDEX IF NOT EXISTS idx_assinaturas_mensais_ufv_id ON public.assinaturas_mensais(ufv_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_mensais_vinculo_id ON public.assinaturas_mensais(vinculo_id);
CREATE INDEX IF NOT EXISTS idx_cliente_usina_vinculo_cliente ON public.cliente_usina_vinculo(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_usina_vinculo_ufv ON public.cliente_usina_vinculo(ufv_id);
CREATE INDEX IF NOT EXISTS idx_cliente_usina_vinculo_uc ON public.cliente_usina_vinculo(uc_beneficiaria_id);
CREATE INDEX IF NOT EXISTS idx_usina_geracao_mensal_ufv ON public.usina_geracao_mensal(ufv_id);
CREATE INDEX IF NOT EXISTS idx_usina_rateio_mensal_geracao ON public.usina_rateio_mensal(geracao_id);
CREATE INDEX IF NOT EXISTS idx_usina_rateio_mensal_vinculo_id ON public.usina_rateio_mensal(vinculo_id);
CREATE INDEX IF NOT EXISTS idx_usina_rateio_mensal_uc ON public.usina_rateio_mensal(uc_beneficiaria_id);

-- ----------------------------------------------------------------------------
-- 9. Triggers updated_at (função update_updated_at_column já existe no Sunflow)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS update_ucs_updated_at ON public.unidades_consumidoras;
CREATE TRIGGER update_ucs_updated_at
  BEFORE UPDATE ON public.unidades_consumidoras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_faturas_updated_at ON public.faturas_mensais;
CREATE TRIGGER update_faturas_updated_at
  BEFORE UPDATE ON public.faturas_mensais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_geracoes_updated_at ON public.geracoes_mensais;
CREATE TRIGGER update_geracoes_updated_at
  BEFORE UPDATE ON public.geracoes_mensais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_assinaturas_updated_at ON public.assinaturas_mensais;
CREATE TRIGGER update_assinaturas_updated_at
  BEFORE UPDATE ON public.assinaturas_mensais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cliente_usina_vinculo_updated_at ON public.cliente_usina_vinculo;
CREATE TRIGGER update_cliente_usina_vinculo_updated_at
  BEFORE UPDATE ON public.cliente_usina_vinculo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_usina_geracao_mensal_updated_at ON public.usina_geracao_mensal;
CREATE TRIGGER update_usina_geracao_mensal_updated_at
  BEFORE UPDATE ON public.usina_geracao_mensal
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_usina_rateio_mensal_updated_at ON public.usina_rateio_mensal;
CREATE TRIGGER update_usina_rateio_mensal_updated_at
  BEFORE UPDATE ON public.usina_rateio_mensal
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 10. RLS
--     Staff (admin/engenharia/supervisao/lider) gerencia tudo: is_staff(auth.uid())
--     Cliente: SELECT nas próprias linhas via clientes.profile_id -> profiles.id
--              e profiles.user_id = auth.uid() (idioma das policies do Sunflow)
--     service_role: acesso total (edge functions / sync)
-- ----------------------------------------------------------------------------
ALTER TABLE public.unidades_consumidoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geracoes_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_usina_vinculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usina_geracao_mensal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usina_rateio_mensal ENABLE ROW LEVEL SECURITY;

-- ============ unidades_consumidoras ============
DROP POLICY IF EXISTS "Staff manage unidades_consumidoras" ON public.unidades_consumidoras;
CREATE POLICY "Staff manage unidades_consumidoras"
  ON public.unidades_consumidoras FOR ALL
  USING (public.is_staff((SELECT auth.uid())))
  WITH CHECK (public.is_staff((SELECT auth.uid())));

DROP POLICY IF EXISTS "Service role manages unidades_consumidoras" ON public.unidades_consumidoras;
CREATE POLICY "Service role manages unidades_consumidoras"
  ON public.unidades_consumidoras FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Clients view own unidades_consumidoras" ON public.unidades_consumidoras;
CREATE POLICY "Clients view own unidades_consumidoras"
  ON public.unidades_consumidoras FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clientes c
      JOIN public.profiles p ON p.id = c.profile_id
      WHERE c.id = unidades_consumidoras.cliente_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

-- ============ faturas_mensais ============
DROP POLICY IF EXISTS "Staff manage faturas_mensais" ON public.faturas_mensais;
CREATE POLICY "Staff manage faturas_mensais"
  ON public.faturas_mensais FOR ALL
  USING (public.is_staff((SELECT auth.uid())))
  WITH CHECK (public.is_staff((SELECT auth.uid())));

DROP POLICY IF EXISTS "Service role manages faturas_mensais" ON public.faturas_mensais;
CREATE POLICY "Service role manages faturas_mensais"
  ON public.faturas_mensais FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Clients view own faturas_mensais" ON public.faturas_mensais;
CREATE POLICY "Clients view own faturas_mensais"
  ON public.faturas_mensais FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.unidades_consumidoras uc
      JOIN public.clientes c ON c.id = uc.cliente_id
      JOIN public.profiles p ON p.id = c.profile_id
      WHERE uc.id = faturas_mensais.uc_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

-- ============ geracoes_mensais ============
DROP POLICY IF EXISTS "Staff manage geracoes_mensais" ON public.geracoes_mensais;
CREATE POLICY "Staff manage geracoes_mensais"
  ON public.geracoes_mensais FOR ALL
  USING (public.is_staff((SELECT auth.uid())))
  WITH CHECK (public.is_staff((SELECT auth.uid())));

DROP POLICY IF EXISTS "Service role manages geracoes_mensais" ON public.geracoes_mensais;
CREATE POLICY "Service role manages geracoes_mensais"
  ON public.geracoes_mensais FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Clients view own geracoes_mensais" ON public.geracoes_mensais;
CREATE POLICY "Clients view own geracoes_mensais"
  ON public.geracoes_mensais FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.unidades_consumidoras uc
      JOIN public.clientes c ON c.id = uc.cliente_id
      JOIN public.profiles p ON p.id = c.profile_id
      WHERE uc.id = geracoes_mensais.uc_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

-- ============ assinaturas_mensais ============
DROP POLICY IF EXISTS "Staff manage assinaturas_mensais" ON public.assinaturas_mensais;
CREATE POLICY "Staff manage assinaturas_mensais"
  ON public.assinaturas_mensais FOR ALL
  USING (public.is_staff((SELECT auth.uid())))
  WITH CHECK (public.is_staff((SELECT auth.uid())));

DROP POLICY IF EXISTS "Service role manages assinaturas_mensais" ON public.assinaturas_mensais;
CREATE POLICY "Service role manages assinaturas_mensais"
  ON public.assinaturas_mensais FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Clients view own assinaturas_mensais" ON public.assinaturas_mensais;
CREATE POLICY "Clients view own assinaturas_mensais"
  ON public.assinaturas_mensais FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.unidades_consumidoras uc
      JOIN public.clientes c ON c.id = uc.cliente_id
      JOIN public.profiles p ON p.id = c.profile_id
      WHERE uc.id = assinaturas_mensais.uc_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

-- ============ cliente_usina_vinculo ============
DROP POLICY IF EXISTS "Staff manage cliente_usina_vinculo" ON public.cliente_usina_vinculo;
CREATE POLICY "Staff manage cliente_usina_vinculo"
  ON public.cliente_usina_vinculo FOR ALL
  USING (public.is_staff((SELECT auth.uid())))
  WITH CHECK (public.is_staff((SELECT auth.uid())));

DROP POLICY IF EXISTS "Service role manages cliente_usina_vinculo" ON public.cliente_usina_vinculo;
CREATE POLICY "Service role manages cliente_usina_vinculo"
  ON public.cliente_usina_vinculo FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Clients view own cliente_usina_vinculo" ON public.cliente_usina_vinculo;
CREATE POLICY "Clients view own cliente_usina_vinculo"
  ON public.cliente_usina_vinculo FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clientes c
      JOIN public.profiles p ON p.id = c.profile_id
      WHERE c.id = cliente_usina_vinculo.cliente_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

-- ============ usina_geracao_mensal ============
DROP POLICY IF EXISTS "Staff manage usina_geracao_mensal" ON public.usina_geracao_mensal;
CREATE POLICY "Staff manage usina_geracao_mensal"
  ON public.usina_geracao_mensal FOR ALL
  USING (public.is_staff((SELECT auth.uid())))
  WITH CHECK (public.is_staff((SELECT auth.uid())));

DROP POLICY IF EXISTS "Service role manages usina_geracao_mensal" ON public.usina_geracao_mensal;
CREATE POLICY "Service role manages usina_geracao_mensal"
  ON public.usina_geracao_mensal FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Cliente vê a geração das usinas com as quais tem vínculo ativo de assinatura
DROP POLICY IF EXISTS "Clients view usina_geracao_mensal vinculada" ON public.usina_geracao_mensal;
CREATE POLICY "Clients view usina_geracao_mensal vinculada"
  ON public.usina_geracao_mensal FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cliente_usina_vinculo cuv
      JOIN public.clientes c ON c.id = cuv.cliente_id
      JOIN public.profiles p ON p.id = c.profile_id
      WHERE cuv.ufv_id = usina_geracao_mensal.ufv_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

-- ============ usina_rateio_mensal ============
DROP POLICY IF EXISTS "Staff manage usina_rateio_mensal" ON public.usina_rateio_mensal;
CREATE POLICY "Staff manage usina_rateio_mensal"
  ON public.usina_rateio_mensal FOR ALL
  USING (public.is_staff((SELECT auth.uid())))
  WITH CHECK (public.is_staff((SELECT auth.uid())));

DROP POLICY IF EXISTS "Service role manages usina_rateio_mensal" ON public.usina_rateio_mensal;
CREATE POLICY "Service role manages usina_rateio_mensal"
  ON public.usina_rateio_mensal FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Clients view own usina_rateio_mensal" ON public.usina_rateio_mensal;
CREATE POLICY "Clients view own usina_rateio_mensal"
  ON public.usina_rateio_mensal FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.unidades_consumidoras uc
      JOIN public.clientes c ON c.id = uc.cliente_id
      JOIN public.profiles p ON p.id = c.profile_id
      WHERE uc.id = usina_rateio_mensal.uc_beneficiaria_id
        AND p.user_id = (SELECT auth.uid())
    )
  );
