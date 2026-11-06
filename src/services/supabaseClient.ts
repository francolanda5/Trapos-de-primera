import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Conexión con Supabase. Las dos variables salen de Supabase > Connect (framework Vue).
 * La "publishable key" es pública a propósito: viaja en el código del navegador y los datos
 * los protegen las reglas de seguridad por filas (RLS) que crea supabase/setup.sql.
 *
 * Si las variables no están, la web sigue funcionando como antes, guardando todo en LocalStorage.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
export const isSupabaseEnabled = supabase !== null;

// Para el código que solo corre cuando Supabase está activado
export function sb(): SupabaseClient {
  if (!supabase) throw new Error('Supabase no está configurado.');
  return supabase;
}
