import "server-only";
import { createClient } from "@supabase/supabase-js";
export function createAdminClient() { const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY; return url && key ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) : null; }
