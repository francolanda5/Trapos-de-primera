<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  isAuthModalOpen,
  authModalMode,
  loginWithEmail,
  registerWithEmail,
  loginAsTestAdmin,
  loginWithGoogleCredential
} from '../store/useAuth';
import {
  GOOGLE_CLIENT_ID,
  loadGoogleIdentityScript
} from '../services/googleAuthService';

const isGoogleReady = ref(false);
const googleButtonContainer = ref<HTMLElement | null>(null);

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

function resetErrors() {
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
      }
    }
  } finally {
    isSubmitting.value = false;
  }
}

// Inicializar Google Identity Services
onMounted(async () => {
  const loaded = await loadGoogleIdentityScript();
  if (loaded && window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            loginWithGoogleCredential(response.credential);
          }
        }
      });
      isGoogleReady.value = true;
      if (googleButtonContainer.value) {
        window.google.accounts.id.renderButton(googleButtonContainer.value, {
          theme: 'outline',
          size: 'large',
          width: 320
        });
      }
    } catch (e) {
      console.warn('Error al inicializar Google Sign-In:', e);
    }
  }
});
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
          class="bg-[#F7F4EA] dark:bg-[#0C2333] border border-[#E2DEC9] dark:border-[#1E4663] rounded-xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-slate-800 dark:text-neutral-100"
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
              class="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xl cursor-pointer"
            >
              ✕
            </button>
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
              <label class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1">
                Nombre y Apellido *
              </label>
              <input
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
              <label class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1">
                Correo Electrónico *
              </label>
              <input
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
              <label class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1">
                Contraseña *
              </label>
              <input
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
              <label class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1">
                Confirmar Contraseña *
              </label>
              <input
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
            <div ref="googleButtonContainer" v-show="isGoogleReady"></div>

            <div v-if="!GOOGLE_CLIENT_ID" class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded text-[11px] text-amber-900 dark:text-amber-200 w-full text-center">
              <p class="font-bold mb-1">Google OAuth preparado</p>
              <p class="text-[10px] leading-relaxed">
                Para activar el botón oficial de Google en producción, configurá tu <code>VITE_GOOGLE_CLIENT_ID</code> en las variables de entorno. El flujo de rol y decodificación JWT ya está implementado.
              </p>
            </div>
          </div>

          <!-- Acceso Rápido Administrador de Prueba -->
          <div class="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700 text-center">
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
