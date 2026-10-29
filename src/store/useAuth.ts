import { ref, computed, watch } from 'vue';
import type { User } from '../types';
import { parseJwt, type GoogleUserPayload } from '../services/googleAuthService';

const STORAGE_KEYS = {
  CURRENT_USER: 'tdp_current_user_v1',
  USERS: 'tdp_users_v1'
};

/**
 * Función criptográfica para hash de contraseñas (SHA-256 con salt)
 * Evita almacenar contraseñas en texto plano en LocalStorage
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
    passwordHash: 'e69888d30e3dd82c3c1788734267ca629393a653bb9640498b3f27b9a5c888d2', // admin123
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-customer',
    name: 'Franco Fusco (Cliente)',
    email: 'franco@gmail.com',
    role: 'customer',
    passwordHash: '8cb2237d0679ca88db6464eac60da963455139649b864e6b6694602bb166b2ef', // cliente123
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

function loadStoredSession(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error al leer sesión de LocalStorage:', e);
  }
  return null;
}

export const registeredUsers = ref<User[]>(loadStoredUsers());
export const currentUser = ref<User | null>(loadStoredSession());
export const isAuthModalOpen = ref<boolean>(false);
export const authModalMode = ref<'login' | 'register'>('login');

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
export async function registerWithEmail(name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
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
 * Diferencia autenticación de autorización: el usuario de Google recibe rol 'customer'
 */
export function loginWithGoogleCredential(credentialToken: string): { success: boolean; error?: string } {
  const payload = parseJwt(credentialToken);
  if (!payload || !payload.email) {
    return { success: false, error: 'Token de Google inválido.' };
  }

  let user = registeredUsers.value.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());

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
 * Cierre de sesión
 */
export function logout() {
  currentUser.value = null;
}

/**
 * Selector rápido de rol (para pruebas de la consigna entre Administrador y Cliente)
 */
export function toggleUserRole() {
  if (!currentUser.value) return;
  currentUser.value.role = currentUser.value.role === 'admin' ? 'customer' : 'admin';
}

/**
 * Acceso directo rápido como administrador de prueba
 */
export function loginAsTestAdmin() {
  const admin = registeredUsers.value.find((u) => u.role === 'admin') || INITIAL_USERS[0];
  currentUser.value = { ...admin };
  isAuthModalOpen.value = false;
}
