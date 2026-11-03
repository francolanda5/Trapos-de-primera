<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  cartCount,
  favoritesCount,
  isCartOpen,
  isFavoritesOpen,
  liveAnnouncement,
  filterState,
  dolarStatus,
  theme,
  toggleTheme
} from '../store/useStore';
import {
  currentUser,
  isAuthenticated,
  isAdmin,
  isAuthModalOpen,
  authModalMode,
  logout
} from '../store/useAuth';
import SearchBar from './SearchBar.vue';

const router = useRouter();
const route = useRoute();
const localSearch = ref('');
const isUserMenuOpen = ref(false);

function onSearch() {
  if (localSearch.value.trim()) {
    filterState.search = localSearch.value.trim();
    router.push({ path: '/catalogo', query: { q: localSearch.value.trim() } });
  } else {
    filterState.search = '';
    router.push('/catalogo');
  }
}

// Al elegir una sección se limpia la búsqueda. Los demás filtros viajan en la URL
// y los aplica CatalogView al leer route.query.
function clearSearch() {
  localSearch.value = '';
  filterState.search = '';
}

// Detección activa de sección
const isHomeActive = computed(() => route.path === '/' && Object.keys(route.query).length === 0);
const isPrimeraActive = computed(() => route.query.categoria === 'Primera División');
const isAscensoActive = computed(() => route.query.categoria === 'Ascenso');
const isSeleccionActive = computed(() => route.query.categoria === 'Selección Argentina');
const isRetroActive = computed(() => route.query.era === 'Retro');
const isActualesActive = computed(() => route.query.era === 'Actual');
const isAboutActive = computed(() => route.path === '/acerca-de');

function openAuth(mode: 'login' | 'register') {
  authModalMode.value = mode;
  isAuthModalOpen.value = true;
  isUserMenuOpen.value = false;
}

function handleLogout() {
  logout();
  isUserMenuOpen.value = false;
  router.push('/');
}
</script>

<template>
  <!-- Fijo arriba solo desde tablet: en celular ocuparía demasiada pantalla -->
  <header class="w-full sm:sticky sm:top-0 z-40 bg-[#F7F4EA] dark:bg-[#0C2333] transition-colors" data-purpose="site-header">
    <!-- Top Notification Bar -->
    <div class="bg-[#0C2333] dark:bg-[#081722] text-white text-[11px] sm:text-xs py-2 px-4 border-b border-[#13354d] dark:border-neutral-800">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-6 font-medium tracking-wide flex-wrap">
        <!-- Live Announcement -->
        <div class="flex items-center gap-1.5 text-white/90 mx-auto sm:mx-0">
          <svg class="w-4 h-4 text-[#48B0DA] flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
          <span class="truncate max-w-xs sm:max-w-none">{{ liveAnnouncement }}</span>
        </div>

        <!-- Right Side: API Status, Theme Toggle -->
        <div class="flex items-center gap-3 sm:gap-4 text-white/80 text-[11px] mx-auto sm:mx-0">
          <!-- Estado real del fetch a DolarAPI -->
          <span class="hidden md:flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full" :class="dolarStatus === 'ok' ? 'bg-emerald-400' : 'bg-amber-400'"></span>
            <span>Cotización: {{ dolarStatus === 'ok' ? 'en vivo' : dolarStatus === 'error' ? 'no disponible' : 'cargando...' }}</span>
          </span>

          <span class="hidden md:inline text-white/30">|</span>

          <!-- Theme Toggle Button -->
          <button
            type="button"
            @click="toggleTheme"
            class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            :title="`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`"
          >
            <span>{{ theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Header -->
    <div class="border-b border-neutral-300/60 dark:border-neutral-800 bg-[#F7F4EA] dark:bg-[#0C2333]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div class="flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-4 gap-y-2">
          <!-- TDP Logo (Moderadamente aumentado, proporcional y optimizado para móvil) -->
          <router-link to="/" class="flex items-center hover:scale-[1.02] transition-transform py-1 shrink-0" title="Trapos de Primera">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjFRTRx09kAGXJm15Go6IuIftR__BQVgK3mlnnty2U1e84IDD7z1EphD9lros5-znJ6FCfnpZzgKYEOMCpQfTdi9V_r6VrBve-z0JNL6Cv24AYn--47SpF6k2AsReTf2wPH0Yjve3KscdpEywi51dgpy23jb6ak_wRHLdl2FnKSYWH7ZvgeREV6iLh3WSZojlYpBd8N2mCabEgRyt0CZsWdIb2xU8MTGACfVlKrVtTCsYag1mS-zAXF0awjECPHtjpg_o"
              alt="Trapos de Primera"
              class="h-12 sm:h-16 w-auto object-contain drop-shadow-xs"
            />
          </router-link>

          <!-- Search Bar: en celular ocupa una fila propia debajo del logo y los íconos -->
          <div class="order-last sm:order-none w-full sm:w-auto sm:flex-1 max-w-xl sm:mx-6">
            <SearchBar v-model="localSearch" @search="onSearch" />
          </div>

          <!-- Action Icons (Auth, Favorites, Cart) -->
          <div class="flex items-center space-x-2 sm:space-x-4 text-slate-700 dark:text-neutral-200">
            <!-- Login / Register Buttons (When not logged in) -->
            <div v-if="!isAuthenticated" class="hidden sm:flex items-center gap-1.5 text-xs font-semibold">
              <button
                @click="openAuth('login')"
                class="px-2.5 py-1.5 rounded hover:text-[#48B0DA] transition-colors cursor-pointer"
              >
                Iniciar sesión
              </button>
              <span class="text-slate-300 dark:text-slate-600">|</span>
              <button
                @click="openAuth('register')"
                class="px-2.5 py-1.5 rounded bg-[#0C2333] dark:bg-[#48B0DA] text-white dark:text-[#0C2333] hover:opacity-90 transition-opacity font-bold cursor-pointer"
              >
                Crear cuenta
              </button>
            </div>

            <!-- User Avatar & Dropdown (When logged in) -->
            <div v-else class="relative">
              <button
                @click="isUserMenuOpen = !isUserMenuOpen"
                :aria-expanded="isUserMenuOpen"
                aria-label="Menú de usuario"
                class="flex items-center gap-2 px-2.5 py-1 rounded bg-white/60 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:border-[#48B0DA] transition-all cursor-pointer"
              >
                <div class="w-6 h-6 rounded-full bg-[#48B0DA] text-white text-xs font-bold flex items-center justify-center overflow-hidden">
                  <img v-if="currentUser?.avatarUrl" :src="currentUser.avatarUrl" :alt="currentUser.name" class="w-full h-full object-cover" />
                  <span v-else>{{ currentUser?.name.charAt(0).toUpperCase() }}</span>
                </div>
                <span class="hidden sm:inline text-xs font-bold text-[#0C2333] dark:text-white truncate max-w-[120px]">
                  {{ currentUser?.name.split(' ')[0] }}
                </span>
                <span class="hidden sm:inline text-[9px] px-1 py-0.2 rounded font-mono font-bold uppercase" :class="isAdmin ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'">
                  {{ currentUser?.role }}
                </span>
              </button>

              <!-- Dropdown Menu -->
              <div
                v-if="isUserMenuOpen"
                class="absolute right-0 mt-2 w-48 bg-white dark:bg-[#112C3F] border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl py-2 z-50 text-xs text-slate-800 dark:text-neutral-100"
              >
                <div class="px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-700 mb-1">
                  <p class="font-bold truncate">{{ currentUser?.name }}</p>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">{{ currentUser?.email }}</p>
                </div>

                <router-link
                  to="/mis-pedidos"
                  @click="isUserMenuOpen = false"
                  class="block px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  📦 Mis Pedidos
                </router-link>

                <router-link
                  v-if="isAdmin"
                  to="/admin/pedidos"
                  @click="isUserMenuOpen = false"
                  class="block px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold text-[#48B0DA] transition-colors"
                >
                  📋 Administrar Pedidos
                </router-link>

                <router-link
                  v-if="isAdmin"
                  to="/admin/camisetas"
                  @click="isUserMenuOpen = false"
                  class="block px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold text-[#48B0DA] transition-colors"
                >
                  👕 Gestionar Camisetas
                </router-link>

                <div class="border-t border-neutral-200 dark:border-neutral-700 my-1"></div>

                <button
                  type="button"
                  @click="handleLogout"
                  class="w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>

            <!-- Mobile Auth Icon (when screen < sm) -->
            <button
              v-if="!isAuthenticated"
              @click="openAuth('login')"
              class="sm:hidden p-1 hover:text-[#48B0DA] transition-colors cursor-pointer"
              title="Cuenta"
              aria-label="Iniciar sesión"
            >
              <svg class="w-6 h-6 stroke-current fill-none" stroke-width="1.8" viewBox="0 0 24 24">
                <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </button>

            <!-- Favoritos: solo con sesión iniciada -->
            <button
              v-if="isAuthenticated"
              @click="isFavoritesOpen = true"
              aria-label="Ver favoritos"
              class="hover:text-[#48B0DA] transition-colors relative p-1 cursor-pointer"
              title="Favoritos guardados"
            >
              <svg
                class="w-6 h-6 stroke-current"
                :class="favoritesCount > 0 ? 'fill-red-500 text-red-500' : 'fill-none'"
                stroke-width="1.8"
                viewBox="0 0 24 24"
              >
                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              <span
                v-if="favoritesCount > 0"
                class="absolute -top-1 -right-1.5 bg-[#D8B15E] text-[#0C2333] font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center"
              >
                {{ favoritesCount }}
              </span>
            </button>

            <!-- Carrito de Compras Button (Opens Drawer) -->
            <button
              @click="isCartOpen = true"
              aria-label="Carrito de compras"
              class="hover:text-[#48B0DA] transition-colors relative flex items-center p-1 cursor-pointer"
              title="Carrito de compras"
            >
              <svg class="w-6 h-6 stroke-current fill-none" stroke-width="1.8" viewBox="0 0 24 24">
                <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              <span class="absolute -top-1.5 -right-2 bg-[#48B0DA] text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {{ cartCount }}
              </span>
            </button>
          </div>
        </div>

        <!-- Navigation Bar with dynamic category query highlight -->
        <nav class="mt-3 sm:mt-4 flex items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold tracking-wide text-slate-700 dark:text-neutral-300 flex-wrap">
          <!-- Inicio -->
          <router-link
            to="/"
            class="transition-colors hover:text-[#48B0DA]"
            :class="isHomeActive ? 'text-[#48B0DA] border-b-2 border-[#48B0DA] pb-0.5' : ''"
          >
            Inicio
          </router-link>
          <span class="text-slate-300 dark:text-slate-600">|</span>

          <!-- Primera -->
          <router-link
            :to="{ path: '/catalogo', query: { categoria: 'Primera División' } }"
            @click="clearSearch"
            class="transition-colors hover:text-[#48B0DA]"
            :class="isPrimeraActive ? 'text-[#48B0DA] border-b-2 border-[#48B0DA] pb-0.5' : ''"
          >
            Primera
          </router-link>
          <span class="text-slate-300 dark:text-slate-600">|</span>

          <!-- Ascenso -->
          <router-link
            :to="{ path: '/catalogo', query: { categoria: 'Ascenso' } }"
            @click="clearSearch"
            class="transition-colors hover:text-[#48B0DA]"
            :class="isAscensoActive ? 'text-[#48B0DA] border-b-2 border-[#48B0DA] pb-0.5' : ''"
          >
            Ascenso
          </router-link>
          <span class="text-slate-300 dark:text-slate-600">|</span>

          <!-- Selección -->
          <router-link
            :to="{ path: '/catalogo', query: { categoria: 'Selección Argentina' } }"
            @click="clearSearch"
            class="transition-colors hover:text-[#48B0DA]"
            :class="isSeleccionActive ? 'text-[#48B0DA] border-b-2 border-[#48B0DA] pb-0.5' : ''"
          >
            Selección
          </router-link>
          <span class="text-slate-300 dark:text-slate-600">|</span>

          <!-- Retro -->
          <router-link
            :to="{ path: '/catalogo', query: { era: 'Retro' } }"
            @click="clearSearch"
            class="transition-colors hover:text-[#48B0DA]"
            :class="isRetroActive ? 'text-[#48B0DA] border-b-2 border-[#48B0DA] pb-0.5' : ''"
          >
            Retro
          </router-link>
          <span class="text-slate-300 dark:text-slate-600">|</span>

          <!-- Actuales -->
          <router-link
            :to="{ path: '/catalogo', query: { era: 'Actual' } }"
            @click="clearSearch"
            class="transition-colors hover:text-[#48B0DA]"
            :class="isActualesActive ? 'text-[#48B0DA] border-b-2 border-[#48B0DA] pb-0.5' : ''"
          >
            Actuales
          </router-link>
          <span class="text-slate-300 dark:text-slate-600">|</span>

          <!-- Acerca de -->
          <router-link
            to="/acerca-de"
            class="transition-colors hover:text-[#48B0DA]"
            :class="isAboutActive ? 'text-[#48B0DA] border-b-2 border-[#48B0DA] pb-0.5' : ''"
          >
            Acerca de
          </router-link>
        </nav>
      </div>
    </div>
  </header>
</template>
