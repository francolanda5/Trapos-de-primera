<script setup lang="ts">
import { ref, reactive, watch, nextTick } from 'vue';
import {
  isAuthModalOpen,
  authModalMode,
  authModalMessage,
  loginWithEmail,
  registerWithEmail,
  loginAsTestAdmin,
  loginWithGoogleCredential,
  loginWithGoogleOAuth
} from '../store/useAuth';
import { isSupabaseEnabled } from '../services/supabaseClient';
import {
  GOOGLE_CLIENT_ID,
  loadGoogleIdentityScript
} from '../services/googleAuthService';

const googleLoadFailed = ref(false);
const googleButtonContainer = ref<HTMLElement | null>(null);
let googleInitialized = false;

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
});

const errors = reactive<{
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}>({});

const isSubmitting = ref(false);
const info = ref(''); // aviso en verde, por ejemplo "confirmá tu correo"

// Con Supabase, Google se maneja con Supabase Auth: lleva a Google y vuelve a la web con la sesión iniciada
async function handleGoogleOAuth() {
  resetErrors();
  const res = await loginWithGoogleOAuth();
  if (!res.success) errors.general = res.error;
}

function resetErrors() {
  info.value = '';
  errors.name = undefined;
  errors.email = undefined;
  errors.password = undefined;
  errors.confirmPassword = undefined;
  errors.general = undefined;
}

function switchMode(mode: 'login' | 'register') {
  authModalMode.value = mode;
  resetErrors();
}

async function handleSubmit() {
  resetErrors();
  let isValid = true;

  if (authModalMode.value === 'register') {
    if (!form.name.trim()) {
      errors.name = 'El nombre completo es obligatorio.';
      isValid = false;
    } else if (form.name.trim().length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres.';
      isValid = false;
    }
  }

  if (!form.email.trim()) {
    errors.email = 'El correo electrónico es obligatorio.';
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Ingresá un correo electrónico válido.';
    isValid = false;
  }

  if (!form.password) {
    errors.password = 'La contraseña es obligatoria.';
    isValid = false;
  } else if (form.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    isValid = false;
  }

  if (authModalMode.value === 'register') {
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden.';
      isValid = false;
    }
  }

  if (!isValid) return;

  isSubmitting.value = true;
  try {
    if (authModalMode.value === 'login') {
      const res = await loginWithEmail(form.email, form.password);
      if (!res.success) {
        errors.general = res.error || 'Credenciales inválidas.';
      }
    } else {
      const res = await registerWithEmail(form.name, form.email, form.password);
      if (!res.success) {
        errors.general = res.error || 'No se pudo completar el registro.';
      } else if (res.info) {
        info.value = res.info;
        form.password = '';
        form.confirmPassword = '';
      }
    }
  } finally {
    isSubmitting.value = false;
  }
}

// Dibuja el botón oficial de Google. Solo si hay Client ID: sin él no se carga nada de Google.
async function setupGoogleButton() {
  if (isSupabaseEnabled || !GOOGLE_CLIENT_ID) return; // con Supabase no se usa el botón de Google Identity

  const loaded = await loadGoogleIdentityScript();
  if (!loaded || !window.google?.accounts?.id) {
    googleLoadFailed.value = true;
    return;
  }

  googleLoadFailed.value = false;
  try {
    if (!googleInitialized) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          const res = loginWithGoogleCredential(response.credential);
          if (!res.success) errors.general = res.error;
        }
      });
      googleInitialized = true;
    }

    await nextTick();
    const container = googleButtonContainer.value;
    if (container) {
      container.innerHTML = '';
      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        // Google admite de 200 a 400 px: se ajusta al ancho disponible del modal
        width: Math.max(200, Math.min(container.clientWidth, 320))
      });
    }
  } catch (e) {
    console.warn('Error al inicializar Google Sign-In:', e);
    googleLoadFailed.value = true;
  }
}

// El contenido del modal está en un v-if: el contenedor del botón solo existe con el modal abierto.
// Por eso el botón se dibuja cada vez que se abre, y no en onMounted.
watch(
  isAuthModalOpen,
  (isOpen) => {
    resetErrors();
    if (isOpen) {
      setupGoogleButton();
    } else {
      authModalMessage.value = '';
    }
  },
  { immediate: true }
);
</script>

<template>
  <teleport to="body">
    <transition name="modal">
      <div
        v-if="isAuthModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        @click.self="isAuthModalOpen = false"
      >
        <div
          class="bg-[#F7F4EA] dark:bg-[#0C2333] border border-[#E2DEC9] dark:border-[#1E4663] rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl text-slate-800 dark:text-neutral-100"
          role="dialog"
          aria-modal="true"
        >
          <!-- Header Modal -->
          <div class="flex items-center justify-between mb-6 border-b border-neutral-200 dark:border-neutral-700 pb-3">
            <div class="flex items-center gap-3">
              <button
                type="button"
                @click="switchMode('login')"
                class="font-condensed text-lg uppercase tracking-wide transition-colors cursor-pointer"
                :class="authModalMode === 'login' ? 'text-[#48B0DA] font-extrabold border-b-2 border-[#48B0DA]' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'"
              >
                Iniciar Sesión
              </button>
              <span class="text-slate-300 dark:text-slate-600">|</span>
              <button
                type="button"
                @click="switchMode('register')"
                class="font-condensed text-lg uppercase tracking-wide transition-colors cursor-pointer"
                :class="authModalMode === 'register' ? 'text-[#48B0DA] font-extrabold border-b-2 border-[#48B0DA]' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'"
              >
                Crear Cuenta
              </button>
            </div>
            <button
              type="button"
              @click="isAuthModalOpen = false"
              aria-label="Cerrar"
              class="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xl cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Motivo por el que se pide iniciar sesión (favoritos, checkout, rutas protegidas) -->
          <div
            v-if="authModalMessage"
            role="status"
            class="mb-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs rounded font-medium"
          >
            {{ authModalMessage }}
          </div>

          <!-- Aviso de éxito (por ejemplo, confirmar el correo) -->
          <div
            v-if="info"
            role="status"
            class="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs rounded font-medium"
          >
            {{ info }}
          </div>

          <!-- Alerta de error general -->
          <div
            v-if="errors.general"
            class="mb-4 p-3 bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded font-medium"
          >
            {{ errors.general }}
          </div>

          <!-- Formulario -->
          <form @submit.prevent="handleSubmit" class="space-y-4" novalidate>
            <!-- Campo Nombre (solo registro) -->
            <div v-if="authModalMode === 'register'">
              <label for="auth-name" class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1">
                Nombre y Apellido *
              </label>
              <input
                id="auth-name"
              v-model="form.name"
                type="text"
                placeholder="Ej: Franco Rossi"
                class="w-full text-xs bg-white dark:bg-[#112C3F] border border-neutral-300 dark:border-neutral-600 rounded px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
              />
              <p v-if="errors.name" class="text-[11px] text-red-500 mt-1 font-semibold">
                {{ errors.name }}
              </p>
            </div>

            <!-- Campo Email -->
            <div>
              <label for="auth-email" class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1">
                Correo Electrónico *
              </label>
              <input
                id="auth-email"
              v-model="form.email"
                type="email"
                placeholder="tu@email.com"
                class="w-full text-xs bg-white dark:bg-[#112C3F] border border-neutral-300 dark:border-neutral-600 rounded px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
              />
              <p v-if="errors.email" class="text-[11px] text-red-500 mt-1 font-semibold">
                {{ errors.email }}
              </p>
            </div>

            <!-- Campo Contraseña -->
            <div>
              <label for="auth-password" class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1">
                Contraseña *
              </label>
              <input
                id="auth-password"
              v-model="form.password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                class="w-full text-xs bg-white dark:bg-[#112C3F] border border-neutral-300 dark:border-neutral-600 rounded px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
              />
              <p v-if="errors.password" class="text-[11px] text-red-500 mt-1 font-semibold">
                {{ errors.password }}
              </p>
            </div>

            <!-- Campo Confirmar Contraseña (solo registro) -->
            <div v-if="authModalMode === 'register'">
              <label for="auth-confirm" class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1">
                Confirmar Contraseña *
              </label>
              <input
                id="auth-confirm"
              v-model="form.confirmPassword"
                type="password"
                placeholder="Repetí la contraseña"
                class="w-full text-xs bg-white dark:bg-[#112C3F] border border-neutral-300 dark:border-neutral-600 rounded px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
              />
              <p v-if="errors.confirmPassword" class="text-[11px] text-red-500 mt-1 font-semibold">
                {{ errors.confirmPassword }}
              </p>
            </div>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full bg-[#48B0DA] hover:bg-[#3ca0c9] text-white font-bold py-2.5 rounded text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{{ authModalMode === 'login' ? 'Ingresar a mi cuenta' : 'Registrarme' }}</span>
              <span>→</span>
            </button>
          </form>

          <!-- Separador Google -->
          <div class="my-5 flex items-center gap-3">
            <div class="h-[1px] bg-neutral-300 dark:bg-neutral-700 flex-1"></div>
            <span class="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              O con Google
            </span>
            <div class="h-[1px] bg-neutral-300 dark:bg-neutral-700 flex-1"></div>
          </div>

          <!-- Contenedor Google Identity Services -->
          <div class="flex flex-col items-center justify-center">
            <!-- Con Supabase: Google por Supabase Auth -->
            <button
              v-if="isSupabaseEnabled"
              type="button"
              @click="handleGoogleOAuth"
              class="w-full min-h-11 flex items-center justify-center gap-3 bg-white hover:bg-neutral-50 text-slate-700 border border-neutral-300 rounded text-sm font-semibold transition-colors cursor-pointer"
            >
              <svg class="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/>
                <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/>
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
              </svg>
              <span>Continuar con Google</span>
            </button>

            <div v-else-if="GOOGLE_CLIENT_ID && !googleLoadFailed" ref="googleButtonContainer" class="w-full flex justify-center min-h-11"></div>

            <div v-else class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded text-[11px] text-amber-900 dark:text-amber-200 w-full text-center">
              <p class="font-bold mb-1">{{ GOOGLE_CLIENT_ID ? 'No se pudo cargar Google' : 'Google no configurado' }}</p>
              <p class="leading-relaxed">
                {{ GOOGLE_CLIENT_ID ? 'Revisá tu conexión e intentá de nuevo.' : 'El ingreso con Google no está disponible en esta instalación. Usá tu correo y contraseña.' }}
              </p>
            </div>
          </div>

          <!-- Acceso Rápido Administrador de Prueba -->
          <div v-if="!isSupabaseEnabled" class="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700 text-center">
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              ¿Querés probar las funciones de gestión y pedidos?
            </p>
            <button
              type="button"
              @click="loginAsTestAdmin"
              class="text-xs font-bold text-[#0C2333] dark:text-[#48B0DA] hover:underline cursor-pointer"
            >
              ⚡ Ingresar como Administrador (admin@traposdeprimera.com)
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>
