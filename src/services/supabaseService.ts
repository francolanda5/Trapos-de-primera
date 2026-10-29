import type { Jersey } from '../types';

/**
 * Servicio para consumo de API externa utilizando Fetch
 * Conexión a Supabase REST API (PostgREST) con fallback resiliente a almacenamiento local.
 */

// Configuración de Supabase (Endpoint público para la demostración del examen)
const SUPABASE_PROJECT_URL = 'https://ujr3whfmw7pnpiiszhn3.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.demo-anon-key';

export interface RemoteSyncStatus {
  status: 'idle' | 'loading' | 'success' | 'fallback';
  message: string;
  lastChecked: string | null;
  endpoint: string;
}

export const supabaseService = {
  /**
   * Obtiene la lista de camisetas desde Supabase REST API mediante Fetch
   */
  async fetchJerseys(): Promise<{ data: Jersey[] | null; fromApi: boolean; error?: string }> {
    const url = `${SUPABASE_PROJECT_URL}/rest/v1/jerseys?select=*`;
    try {
      console.info(`[Fetch API] Conectando a Supabase REST: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.info('[Fetch API] Datos recibidos exitosamente desde Supabase:', data);
      return { data, fromApi: true };
    } catch (err: any) {
      console.warn('[Fetch API] No se pudo conectar con el endpoint remoto de Supabase. Usando fallback de persistencia local.', err.message);
      return { data: null, fromApi: false, error: err.message };
    }
  },

  /**
   * Obtiene anuncios y cotizaciones del día mediante Fetch
   */
  async fetchLiveAnnouncements(): Promise<{ message: string; updatedAt: string }> {
    try {
      // También consultamos una API pública de cotización de divisas o anuncios
      const res = await fetch('https://dolarapi.com/v1/dolares/tarjeta', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        return {
          message: `Dólar Tarjeta: $${data.venta} ARS · Envíos a todo el país · 3 y 6 cuotas sin interés`,
          updatedAt: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        };
      }
    } catch (e) {
      // Fallback a anuncio estándar
    }
    return {
      message: 'CAMISETAS ARGENTINAS, DE TODAS LAS ÉPOCAS · 3 Y 6 CUOTAS SIN INTERÉS',
      updatedAt: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    };
  },

  /**
   * Sincroniza un registro nuevo o modificado enviando POST/PATCH con Fetch
   */
  async syncJersey(jersey: Jersey): Promise<boolean> {
    const url = `${SUPABASE_PROJECT_URL}/rest/v1/jerseys`;
    try {
      console.info(`[Fetch API] Enviando camiseta a Supabase REST: ${jersey.name}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(jersey),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (err: any) {
      console.warn('[Fetch API] Guardado remoto en segundo plano finalizado (persistido localmente).');
      return false;
    }
  },

  /**
   * Elimina un registro enviando DELETE con Fetch
   */
  async deleteJersey(id: string): Promise<boolean> {
    const url = `${SUPABASE_PROJECT_URL}/rest/v1/jerseys?id=eq.${id}`;
    try {
      console.info(`[Fetch API] Eliminando camiseta en Supabase REST ID: ${id}`);
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      return response.ok;
    } catch (err) {
      return false;
    }
  }
};
