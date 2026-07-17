-- Endurecimento RLS: remove policies permissivas legadas da 1ª migration
-- (USING(true) para qualquer autenticado em insumos/responsaveis).
-- As policies granulares staff/backoffice/técnico já existentes cobrem o
-- acesso legítimo. Aplicada no banco em 2026-07-16.
DROP POLICY IF EXISTS "Authenticated users can manage insumos" ON public.insumos;
DROP POLICY IF EXISTS "Authenticated users can view insumos" ON public.insumos;
DROP POLICY IF EXISTS "Authenticated users can manage responsaveis" ON public.responsaveis;
DROP POLICY IF EXISTS "Authenticated users can view responsaveis" ON public.responsaveis;
