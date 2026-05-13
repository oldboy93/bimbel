-- ══════════════════════════════════════════════════════════════
-- BULLETPROOF JWT RLS FUNCTIONS (Anti-Crash & Exception Safe)
-- Menggunakan blok EXCEPTION PL/pgSQL agar 100% kebal dari error casting JSON.
-- ══════════════════════════════════════════════════════════════

-- 1. Fungsi get_user_tenant_id dengan PL/pgSQL Exception Handling (Sangat Aman)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid AS $$
DECLARE
  v_claims text;
BEGIN
  v_claims := current_setting('request.jwt.claims', true);
  IF v_claims IS NULL OR v_claims = '' THEN
    RETURN NULL;
  END IF;
  RETURN (v_claims::jsonb -> 'app_metadata' ->> 'tenant_id')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Fungsi get_user_role dengan PL/pgSQL Exception Handling (Sangat Aman)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  v_claims text;
BEGIN
  v_claims := current_setting('request.jwt.claims', true);
  IF v_claims IS NULL OR v_claims = '' THEN
    RETURN NULL;
  END IF;
  RETURN v_claims::jsonb -> 'app_metadata' ->> 'role';
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;
