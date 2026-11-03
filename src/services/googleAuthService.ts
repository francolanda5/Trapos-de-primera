/**
 * Inicio de sesión con Google Identity Services (GIS).
 * Solo se activa si hay un Client ID en VITE_GOOGLE_CLIENT_ID (ver GOOGLE_OAUTH.md).
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

// Client ID leído de las variables de entorno de Vite (.env.local o Vercel)
export const GOOGLE_CLIENT_ID =
  ((import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || '').trim();

export interface GoogleUserPayload {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

/**
 * Decodifica el token JWT que devuelve Google, sin librerías externas.
 * OJO: solo LEE los datos, NO verifica la firma. Verificarla requiere un servidor, así que
 * en una app real esto no alcanza. Es aceptable en este TP porque no hay backend ni datos sensibles.
 */
export function parseJwt(token: string): GoogleUserPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error al decodificar token de Google:', e);
    return null;
  }
}

// Se guarda la promesa para que el script se cargue una sola vez, aunque el modal se abra varias.
let scriptPromise: Promise<boolean> | null = null;

/**
 * Carga dinámicamente el SDK oficial de Google Identity Services
 */
export function loadGoogleIdentityScript(): Promise<boolean> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    if (window.google?.accounts?.id) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('No se pudo cargar Google Identity Services.');
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}
