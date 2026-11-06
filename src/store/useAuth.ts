import { ref, computed, watch } from 'vue';
import type { User } from '../types';
import { parseJwt } from '../services/googleAuthService';
import { supabase, isSupabaseEnabled } from '../services/supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  CURRENT_USER: 'tdp_current_user_v1',
  USERS: 'tdp_users_v2'
};

/**
 * Hash de contraseñas (SHA-256 con salt) para no guardarlas en texto plano en LocalStorage.
 * Ojo: todo corre en el navegador, así que es una simulación didáctica de login,
 * no seguridad real. Una app real validaría en un servidor.
 */
export async function hashPassword(plain: string): Promise<string> {
  const enc = new TextEncoder().encode(plain + '_tdp_salt_2026');
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Cuentas precargadas iniciales
const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Facundo Romero (Admin)',
    email: 'admin@traposdeprimera.com',
    role: 'admin',
    passwordHash: 'c720631e1f7349eedf6a0b7506007beb11c1af84c3e2d2449ad4bc5ded224ea9', // admin123
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-customer',
    name: 'Franco Fusco (Cliente)',
    email: 'franco@gmail.com',
    role: 'customer',
    passwordHash: '09afc18e18b61d2a192313f6dceb9be8b65a376134cf8d8c3b17f46d0715f050', // cliente123
    createdAt: new Date().toISOString()
  }
];

function loadStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error al leer usuarios de LocalStorage:', e);
  }
  return [...INITIAL_USERS];
}

// La sesión guardada solo vale si el usuario existe; el rol siempre sale de su cuenta.
function loadStoredSession(users: User[]): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) {
      const stored = JSON.parse(raw);
      return users.find((u) => u.id === stored?.id) ?? null;
    }
  } catch (e) {
    console.error('Error al leer sesión de LocalStorage:', e);
  }
  return null;
}

export const registeredUsers = ref<User[]>(loadStoredUsers());
// Con Supabase la sesión no sale de LocalStorage: la recupera Supabase Auth (ver initSupabaseAuth al final)
export const currentUser = ref<User | null>(isSupabaseEnabled ? null : loadStoredSession(registeredUsers.value));
export const isAuthModalOpen = ref<boolean>(false);
export const authModalMode = ref<'login' | 'register'>('login');
export const authModalMessage = ref<string>('');

// Abre el modal de login, opcionalmente explicando por qué se pide iniciar sesión.
export function openLoginModal(message = '') {
  authModalMode.value = 'login';
  authModalMessage.value = message;
  isAuthModalOpen.value = true;
}

watch(
  registeredUsers,
  (newVal) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newVal));
    } catch (e) {
      console.error('Error al guardar usuarios en LocalStorage:', e);
    }
  },
  { deep: true }
);

watch(
  currentUser,
  (newVal) => {
    try {
      if (newVal) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newVal));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.error('Error al guardar sesión en LocalStorage:', e);
    }
  },
  { deep: true }
);

export const isAuthenticated = computed(() => !!currentUser.value);
export const isAdmin = computed(() => currentUser.value?.role === 'admin');

/**
 * Autenticación por correo y contraseña
 */
export async function loginWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseEnabled) {
    const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password });
    // Si sale bien, onAuthStateChange carga el usuario y cierra el modal
    return error ? { success: false, error: translateAuthError(error.message) } : { success: true };
  }

  const targetEmail = email.toLowerCase().trim();
  const user = registeredUsers.value.find((u) => u.email.toLowerCase() === targetEmail);

  if (!user) {
    return { success: false, error: 'No existe una cuenta con este correo electrónico.' };
  }

  const inputHash = await hashPassword(password);
  if (user.passwordHash !== inputHash) {
    return { success: false, error: 'La contraseña ingresada es incorrecta.' };
  }

  currentUser.value = user;
  isAuthModalOpen.value = false;
  return { success: true };
}

/**
 * Registro de nueva cuenta (Siempre se crea con rol 'customer' por seguridad)
 */
export async function registerWithEmail(
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; info?: string }> {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase!.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } } // el trigger de la base lo copia al perfil
    });
    if (error) return { success: false, error: translateAuthError(error.message) };
    // Con "Confirm email" activado en Supabase no hay sesión hasta que la persona confirma su correo
    if (!data.session) return { success: true, info: 'Te enviamos un correo para confirmar tu cuenta. Confirmala y después iniciá sesión.' };
    return { success: true };
  }

  const targetEmail = email.toLowerCase().trim();
  if (registeredUsers.value.some((u) => u.email.toLowerCase() === targetEmail)) {
    return { success: false, error: 'Ya existe una cuenta registrada con este correo.' };
  }

  const passwordHash = await hashPassword(password);
  const newUser: User = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    email: targetEmail,
    role: 'customer', // Por defecto cliente
    passwordHash,
    createdAt: new Date().toISOString()
  };

  registeredUsers.value.push(newUser);
  currentUser.value = newUser;
  isAuthModalOpen.value = false;
  return { success: true };
}

/**
 * Inicio de sesión mediante Google Identity (GIS)
 * Diferencia autenticación de autorización: Google dice quién es la persona,
 * pero por Google solo se entra como cliente. Nunca como administrador.
 */
export function loginWithGoogleCredential(credentialToken: string): { success: boolean; error?: string } {
  const payload = parseJwt(credentialToken);
  if (!payload || !payload.email) {
    return { success: false, error: 'Token de Google inválido.' };
  }

  let user = registeredUsers.value.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());

  // Una cuenta de Google con el mismo mail que un admin no hereda ese rol.
  if (user?.role === 'admin') {
    return { success: false, error: 'Las cuentas de administrador no pueden ingresar con Google.' };
  }

  if (!user) {
    // Si no existía, se crea como cliente
    user = {
      id: `google-${payload.sub}`,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      avatarUrl: payload.picture,
      googleId: payload.sub,
      role: 'customer', // Siempre rol customer al ingresar con Google
      createdAt: new Date().toISOString()
    };
    registeredUsers.value.push(user);
  } else if (!user.avatarUrl && payload.picture) {
    user.avatarUrl = payload.picture;
  }

  currentUser.value = user;
  isAuthModalOpen.value = false;
  return { success: true };
}

/**
 * Inicio de sesión con Google a través de Supabase Auth: lleva a Google y vuelve a la web ya con la sesión.
 */
export async function loginWithGoogleOAuth(): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase no está configurado.' };
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  if (error) {
    const notEnabled = /provider is not enabled|unsupported provider/i.test(error.message);
    return { success: false, error: notEnabled ? 'El ingreso con Google todavía no está habilitado en Supabase.' : error.message };
  }
  return { success: true };
}

/**
 * Cierre de sesión
 */
export function logout() {
  currentUser.value = null;
  if (isSupabaseEnabled) void supabase!.auth.signOut();
}

/**
 * Acceso directo rápido como administrador de prueba
 */
export function loginAsTestAdmin() {
  if (isSupabaseEnabled) return; // con Supabase el administrador es una cuenta real, marcada en la base
  const admin = registeredUsers.value.find((u) => u.role === 'admin') || INITIAL_USERS[0];
  currentUser.value = { ...admin };
  isAuthModalOpen.value = false;
}

// ---------------------------------------------------------------------------------------------
// Supabase Auth: el usuario sale de la sesión de Supabase y su rol, de la tabla profiles.
// ---------------------------------------------------------------------------------------------
function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'El correo o la contraseña son incorrectos.';
  if (/email not confirmed/i.test(message)) return 'Todavía no confirmaste tu correo. Revisá tu bandeja de entrada.';
  if (/already registered|already been registered/i.test(message)) return 'Ya existe una cuenta registrada con este correo.';
  if (/rate limit/i.test(message)) return 'Hiciste muchos intentos seguidos. Esperá un rato e intentá de nuevo.';
  return message;
}

// Arma el usuario de la web a partir de la sesión de Supabase y de su perfil en la base
async function loadSupabaseUser(authUser: SupabaseUser | null): Promise<void> {
  if (!authUser) {
    currentUser.value = null;
    return;
  }
  const { data: profile } = await supabase!.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
  const next: User = {
    id: authUser.id,
    email: profile?.email ?? authUser.email ?? '',
    name: profile?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuario',
    role: profile?.role === 'admin' ? 'admin' : 'customer', // sin perfil, cliente
    avatarUrl: profile?.avatar_url ?? undefined,
    createdAt: profile?.created_at ?? authUser.created_at
  };
  const prev = currentUser.value;
  // Si no cambió nada no se reemplaza el usuario, para no volver a cargar pedidos y favoritos
  if (!prev || prev.id !== next.id || prev.role !== next.role || prev.name !== next.name || prev.avatarUrl !== next.avatarUrl) {
    currentUser.value = next;
  }
  isAuthModalOpen.value = false;
}

async function initSupabaseAuth(): Promise<void> {
  try {
    // Recupera la sesión guardada, o la que llega en la dirección al volver de Google
    const { data } = await supabase!.auth.getSession();
    await loadSupabaseUser(data.session?.user ?? null);
  } catch (e) {
    console.error('[Supabase] No se pudo recuperar la sesión:', e);
  }
  supabase!.auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;
    // Se difiere para no llamar a Supabase desde adentro de este aviso (puede trabarse)
    setTimeout(() => {
      void loadSupabaseUser(session?.user ?? null);
    }, 0);
  });
}

// El router espera a esta promesa: así recargar /admin/pedidos no te echa antes de saber quién sos
export const authReady: Promise<void> = isSupabaseEnabled ? initSupabaseAuth() : Promise.resolve();
