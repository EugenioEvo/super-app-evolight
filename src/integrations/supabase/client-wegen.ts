import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types-wegen';
import { supabase } from './client';

// Shim transitório da fusão: mesma instância do client, tipada com o schema
// do wegen-energy (types-wegen). Será eliminado quando o types.ts unificado
// for regenerado a partir do banco fundido (Fase 1/2 do super app).
export const supabaseWegen = supabase as unknown as SupabaseClient<Database>;
