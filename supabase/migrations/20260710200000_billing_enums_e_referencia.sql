-- ============================================================================
-- SUPER APP EVOLIGHT - Módulo Billing (Faturamento GD)
-- Fusão energy-insights (wegen-energy) -> sunflow-dev
-- Arquivo 1/2: role 'gerador', enums, colunas regulatórias em cliente_ufvs,
--              tabelas de referência (tarifas_concessionaria, lei_14300_transicao),
--              seeds e funções obter_tarifa_vigente / classificar_gd /
--              obter_percentual_fio_b.
-- Pré-requisitos existentes no sunflow-dev: clientes, cliente_ufvs, profiles,
-- user_roles (enum app_role próprio), is_staff(uuid), is_admin_safe(),
-- has_role(uuid, app_role), update_updated_at_column().
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. app_role: apenas adiciona o valor 'gerador' ao enum existente do Sunflow.
--    NÃO recriar/alterar o enum. O novo valor NÃO é utilizado nestes arquivos
--    (restrição do Postgres para ADD VALUE dentro da mesma transação).
-- ----------------------------------------------------------------------------
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gerador';

-- ----------------------------------------------------------------------------
-- 1. Enums do módulo billing (idempotentes)
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.fonte_energia AS ENUM ('solar', 'eolica', 'hidraulica', 'biomassa', 'outros');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.modalidade_gd AS ENUM ('autoconsumo_remoto', 'geracao_compartilhada', 'consorcio', 'cooperativa');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.modalidade_economia AS ENUM ('ppa_tarifa', 'desconto_fatura_global');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.referencia_desconto AS ENUM ('valor_total', 'te_tusd', 'apenas_te');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.classificacao_gd AS ENUM ('gd1', 'gd2');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.grupo_tarifario AS ENUM ('A', 'B');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 2. cliente_ufvs: colunas regulatórias (a usina canônica do Sunflow substitui
--    a antiga usinas_remotas do energy-insights).
--    Já existentes em cliente_ufvs (não duplicar): nome, endereco, potencia_kwp,
--    status, cliente_id, latitude/longitude etc.
-- ----------------------------------------------------------------------------
ALTER TABLE public.cliente_ufvs
  ADD COLUMN IF NOT EXISTS uc_geradora TEXT,
  ADD COLUMN IF NOT EXISTS cnpj_titular TEXT,
  ADD COLUMN IF NOT EXISTS distribuidora TEXT,
  ADD COLUMN IF NOT EXISTS fonte public.fonte_energia NOT NULL DEFAULT 'solar',
  ADD COLUMN IF NOT EXISTS modalidade_gd public.modalidade_gd NOT NULL DEFAULT 'autoconsumo_remoto',
  ADD COLUMN IF NOT EXISTS data_conexao DATE,
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS data_protocolo_aneel DATE,
  ADD COLUMN IF NOT EXISTS classificacao_gd TEXT DEFAULT 'gd2',
  ADD COLUMN IF NOT EXISTS numero_processo_aneel TEXT;

COMMENT ON COLUMN public.cliente_ufvs.uc_geradora IS 'Número da UC geradora junto à distribuidora';
COMMENT ON COLUMN public.cliente_ufvs.cnpj_titular IS 'CNPJ do titular da usina';
COMMENT ON COLUMN public.cliente_ufvs.data_protocolo_aneel IS 'Data de protocolo junto à ANEEL/distribuidora';
COMMENT ON COLUMN public.cliente_ufvs.classificacao_gd IS 'gd1 = protocolo até 06/01/2023 (direito adquirido), gd2 = após';
COMMENT ON COLUMN public.cliente_ufvs.numero_processo_aneel IS 'Número do processo na distribuidora';

-- ----------------------------------------------------------------------------
-- 3. Tabela de referência: tarifas_concessionaria
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tarifas_concessionaria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  concessionaria TEXT NOT NULL,
  grupo_tarifario TEXT NOT NULL CHECK (grupo_tarifario IN ('A', 'B')),
  subgrupo TEXT, -- A1, A2, A3, A3a, A4, AS, B1, B2, B3
  modalidade TEXT, -- THS_VERDE, THS_AZUL, Convencional

  -- Tarifas TE (R$/kWh)
  te_ponta_rs_kwh NUMERIC DEFAULT 0,
  te_fora_ponta_rs_kwh NUMERIC DEFAULT 0,
  te_reservado_rs_kwh NUMERIC DEFAULT 0,
  te_unica_rs_kwh NUMERIC DEFAULT 0, -- Para Grupo B

  -- Tarifas TUSD (R$/kWh)
  tusd_ponta_rs_kwh NUMERIC DEFAULT 0,
  tusd_fora_ponta_rs_kwh NUMERIC DEFAULT 0,
  tusd_reservado_rs_kwh NUMERIC DEFAULT 0,
  tusd_unica_rs_kwh NUMERIC DEFAULT 0, -- Para Grupo B

  -- Componentes TUSD detalhados
  tusd_fio_a_rs_kwh NUMERIC DEFAULT 0,
  tusd_fio_b_rs_kwh NUMERIC DEFAULT 0,
  tusd_encargos_rs_kwh NUMERIC DEFAULT 0,

  -- Demanda (R$/kW)
  demanda_ponta_rs_kw NUMERIC DEFAULT 0,
  demanda_fora_ponta_rs_kw NUMERIC DEFAULT 0,
  demanda_unica_rs_kw NUMERIC DEFAULT 0,
  demanda_geracao_rs_kw NUMERIC DEFAULT 0,
  demanda_ultrapassagem_rs_kw NUMERIC DEFAULT 0,

  -- Bandeiras (R$/kWh adicional)
  bandeira_verde_rs_kwh NUMERIC DEFAULT 0,
  bandeira_amarela_rs_kwh NUMERIC DEFAULT 0,
  bandeira_vermelha1_rs_kwh NUMERIC DEFAULT 0,
  bandeira_vermelha2_rs_kwh NUMERIC DEFAULT 0,

  -- Tributos padrão (%)
  icms_percent NUMERIC DEFAULT 0,
  pis_percent NUMERIC DEFAULT 0,
  cofins_percent NUMERIC DEFAULT 0,

  -- Metadados
  vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  vigencia_fim DATE,
  resolucao_aneel TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tarifas_concessionaria_grupo
  ON public.tarifas_concessionaria(concessionaria, grupo_tarifario, ativo);
CREATE INDEX IF NOT EXISTS idx_tarifas_vigencia
  ON public.tarifas_concessionaria(vigencia_inicio, vigencia_fim);

-- Chave natural para idempotência do seed
CREATE UNIQUE INDEX IF NOT EXISTS uq_tarifas_concessionaria_natural
  ON public.tarifas_concessionaria(concessionaria, grupo_tarifario, COALESCE(subgrupo, ''), COALESCE(modalidade, ''), vigencia_inicio);

ALTER TABLE public.tarifas_concessionaria ENABLE ROW LEVEL SECURITY;

-- Dados de referência: leitura para autenticados, escrita apenas staff
DROP POLICY IF EXISTS "Usuarios autenticados podem ler tarifas" ON public.tarifas_concessionaria;
CREATE POLICY "Usuarios autenticados podem ler tarifas"
  ON public.tarifas_concessionaria FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Staff gerencia tarifas" ON public.tarifas_concessionaria;
CREATE POLICY "Staff gerencia tarifas"
  ON public.tarifas_concessionaria FOR ALL
  USING (public.is_staff((SELECT auth.uid())))
  WITH CHECK (public.is_staff((SELECT auth.uid())));

DROP POLICY IF EXISTS "Service role gerencia tarifas" ON public.tarifas_concessionaria;
CREATE POLICY "Service role gerencia tarifas"
  ON public.tarifas_concessionaria FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_tarifas_concessionaria_updated_at ON public.tarifas_concessionaria;
CREATE TRIGGER update_tarifas_concessionaria_updated_at
  BEFORE UPDATE ON public.tarifas_concessionaria
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. Tabela de referência: lei_14300_transicao
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lei_14300_transicao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL UNIQUE,
  percentual_fio_b NUMERIC NOT NULL,
  percentual_encargos NUMERIC DEFAULT 100,
  descricao TEXT,
  vigente BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lei_14300_transicao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios autenticados podem ler lei 14300" ON public.lei_14300_transicao;
CREATE POLICY "Usuarios autenticados podem ler lei 14300"
  ON public.lei_14300_transicao FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Staff gerencia lei 14300" ON public.lei_14300_transicao;
CREATE POLICY "Staff gerencia lei 14300"
  ON public.lei_14300_transicao FOR ALL
  USING (public.is_staff((SELECT auth.uid())))
  WITH CHECK (public.is_staff((SELECT auth.uid())));

DROP POLICY IF EXISTS "Service role gerencia lei 14300" ON public.lei_14300_transicao;
CREATE POLICY "Service role gerencia lei 14300"
  ON public.lei_14300_transicao FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_lei_14300_transicao_updated_at ON public.lei_14300_transicao;
CREATE TRIGGER update_lei_14300_transicao_updated_at
  BEFORE UPDATE ON public.lei_14300_transicao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5. Seeds
-- ----------------------------------------------------------------------------
-- Percentuais de transição definidos na Lei 14.300/2022
INSERT INTO public.lei_14300_transicao (ano, percentual_fio_b, percentual_encargos, descricao) VALUES
  (2023, 15, 100, 'Primeiro ano de transição - 15% do Fio B'),
  (2024, 30, 100, 'Segundo ano - 30% do Fio B'),
  (2025, 45, 100, 'Terceiro ano - 45% do Fio B'),
  (2026, 60, 100, 'Quarto ano - 60% do Fio B'),
  (2027, 75, 100, 'Quinto ano - 75% do Fio B'),
  (2028, 90, 100, 'Sexto ano - 90% do Fio B'),
  (2029, 100, 100, 'Fim da transição - 100% do Fio B não compensável')
ON CONFLICT (ano) DO NOTHING;

-- Tarifas exemplo (valores aproximados - devem ser atualizados com valores reais)
INSERT INTO public.tarifas_concessionaria (
  concessionaria, grupo_tarifario, subgrupo, modalidade,
  te_ponta_rs_kwh, te_fora_ponta_rs_kwh, te_unica_rs_kwh,
  tusd_ponta_rs_kwh, tusd_fora_ponta_rs_kwh, tusd_unica_rs_kwh,
  tusd_fio_a_rs_kwh, tusd_fio_b_rs_kwh, tusd_encargos_rs_kwh,
  demanda_ponta_rs_kw, demanda_fora_ponta_rs_kw, demanda_unica_rs_kw, demanda_geracao_rs_kw,
  bandeira_verde_rs_kwh, bandeira_amarela_rs_kwh, bandeira_vermelha1_rs_kwh, bandeira_vermelha2_rs_kwh,
  icms_percent, pis_percent, cofins_percent,
  vigencia_inicio, resolucao_aneel
) VALUES
-- Equatorial Goiás - Grupo A - THS Verde (A4)
('Equatorial Goiás', 'A', 'A4', 'THS_VERDE',
  0.42856, 0.28574, 0,
  0.55231, 0.17411, 0,
  0.08500, 0.05500, 0.03411,
  0, 0, 31.45, 12.58,
  0, 0.01874, 0.03971, 0.09492,
  29, 0.65, 3.00,
  '2026-01-01', 'REH 3.187/2024'),

-- Equatorial Goiás - Grupo A - THS Azul (A4)
('Equatorial Goiás', 'A', 'A4', 'THS_AZUL',
  0.42856, 0.28574, 0,
  0.55231, 0.17411, 0,
  0.08500, 0.05500, 0.03411,
  45.67, 31.45, 0, 12.58,
  0, 0.01874, 0.03971, 0.09492,
  29, 0.65, 3.00,
  '2026-01-01', 'REH 3.187/2024'),

-- Equatorial Goiás - Grupo B - Convencional (B3)
('Equatorial Goiás', 'B', 'B3', 'Convencional',
  0, 0, 0.35412,
  0, 0, 0.42156,
  0.08500, 0.05500, 0.03411,
  0, 0, 0, 0,
  0, 0.01874, 0.03971, 0.09492,
  29, 0.65, 3.00,
  '2026-01-01', 'REH 3.187/2024'),

-- CEMIG - Grupo A - THS Verde (A4)
('CEMIG', 'A', 'A4', 'THS_VERDE',
  0.39876, 0.26584, 0,
  0.51234, 0.16178, 0,
  0.07800, 0.05100, 0.03278,
  0, 0, 28.92, 11.57,
  0, 0.01874, 0.03971, 0.09492,
  18, 0.65, 3.00,
  '2026-01-01', 'REH 3.200/2024'),

-- CEMIG - Grupo B - Convencional (B3)
('CEMIG', 'B', 'B3', 'Convencional',
  0, 0, 0.32845,
  0, 0, 0.39123,
  0.07800, 0.05100, 0.03278,
  0, 0, 0, 0,
  0, 0.01874, 0.03971, 0.09492,
  18, 0.65, 3.00,
  '2026-01-01', 'REH 3.200/2024')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. Funções do domínio billing
-- ----------------------------------------------------------------------------

-- Busca a tarifa vigente para concessionária/grupo/modalidade na data informada
CREATE OR REPLACE FUNCTION public.obter_tarifa_vigente(
  p_concessionaria TEXT,
  p_grupo_tarifario TEXT,
  p_modalidade TEXT DEFAULT NULL,
  p_data_referencia DATE DEFAULT CURRENT_DATE
)
RETURNS public.tarifas_concessionaria
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tarifa public.tarifas_concessionaria;
BEGIN
  SELECT * INTO v_tarifa
  FROM public.tarifas_concessionaria
  WHERE concessionaria = p_concessionaria
    AND grupo_tarifario = p_grupo_tarifario
    AND (p_modalidade IS NULL OR modalidade = p_modalidade)
    AND ativo = true
    AND vigencia_inicio <= p_data_referencia
    AND (vigencia_fim IS NULL OR vigencia_fim >= p_data_referencia)
  ORDER BY vigencia_inicio DESC
  LIMIT 1;

  RETURN v_tarifa;
END;
$$;

-- Classifica GD automaticamente pela data de protocolo (Lei 14.300)
CREATE OR REPLACE FUNCTION public.classificar_gd(data_protocolo DATE)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF data_protocolo IS NULL THEN
    RETURN 'gd2';
  END IF;

  -- Data limite: 06/01/2023 (Lei 14.300)
  IF data_protocolo <= '2023-01-06'::date THEN
    RETURN 'gd1';
  ELSE
    RETURN 'gd2';
  END IF;
END;
$$;

-- Percentual de Fio B não compensável por ano de referência
CREATE OR REPLACE FUNCTION public.obter_percentual_fio_b(ano_referencia INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  percentual NUMERIC;
BEGIN
  SELECT percentual_fio_b INTO percentual
  FROM public.lei_14300_transicao
  WHERE ano = ano_referencia AND vigente = true;

  IF percentual IS NULL THEN
    -- Após 2029, 100% não compensável
    IF ano_referencia >= 2029 THEN
      RETURN 100;
    -- Antes de 2023, 0% (regras antigas)
    ELSIF ano_referencia < 2023 THEN
      RETURN 0;
    ELSE
      RETURN 100; -- Default conservador
    END IF;
  END IF;

  RETURN percentual;
END;
$$;
