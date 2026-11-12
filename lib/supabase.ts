import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Proyecto Supabase compartido con la invitación de Stephanie (proyecto `stephanie-xv`): las tablas y funciones de
 * esta plataforma llevan el prefijo inv_ y no tocan las suyas. La clave publicable está pensada para exponerse
 * (RLS + funciones RPC protegen los datos); por eso puede vivir en el código. Si existen variables, mandan.
 */
export const SUPABASE_URL = process.env.SUPABASE_URL || "https://enfxxkwxetzoujgphmrg.supabase.co";
export const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_wVMA2MVelJdP-2L43AEd_w_LMMx1f5d";

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (client) return client;
  client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { "x-application-name": "invitaciones" } },
  });
  return client;
}

/** URL pública (CDN de Supabase Storage) de un archivo del bucket de portadas. */
export function coverStorageUrl(objectName: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/inv-covers/${objectName}`;
}
