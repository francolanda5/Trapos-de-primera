<script setup lang="ts">
import { resetToDefaultJerseys, theme, toggleTheme } from '../store/useStore';
import { isAdmin } from '../store/useAuth';

function handleReset() {
  if (confirm('¿Restaurar las 18 camisetas originales de Trapos de Primera? Esto reseteará las existencias y ediciones locales.')) {
    resetToDefaultJerseys();
    alert('Catálogo restablecido con éxito con inventario inicial por talle.');
  }
}
</script>

<template>
  <footer class="bg-[#0C2333] dark:bg-[#081722] text-white mt-16 pt-12 pb-8 border-t border-neutral-800 transition-colors" data-purpose="site-footer">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
        <!-- Logo Column -->
        <div class="md:col-span-4 flex flex-col items-start">
          <router-link to="/" class="inline-block hover:scale-[1.02] transition-transform mb-4">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjFRTRx09kAGXJm15Go6IuIftR__BQVgK3mlnnty2U1e84IDD7z1EphD9lros5-znJ6FCfnpZzgKYEOMCpQfTdi9V_r6VrBve-z0JNL6Cv24AYn--47SpF6k2AsReTf2wPH0Yjve3KscdpEywi51dgpy23jb6ak_wRHLdl2FnKSYWH7ZvgeREV6iLh3WSZojlYpBd8N2mCabEgRyt0CZsWdIb2xU8MTGACfVlKrVtTCsYag1mS-zAXF0awjECPHtjpg_o"
              alt="Trapos de Primera"
              class="h-14 w-auto object-contain"
            />
          </router-link>
          <p class="text-xs text-neutral-400 max-w-xs leading-relaxed mb-4">
            La pasión de las canchas argentinas reunida en un solo lugar. Camisetas oficiales, reediciones de época y joyas del ascenso.
          </p>
          <div class="flex items-center gap-3">
            <button
              @click="toggleTheme"
              class="text-xs px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
            >
              Modo: {{ theme === 'dark' ? '🌙 Oscuro' : '☀️ Claro' }}
            </button>
            <button
              @click="handleReset"
              class="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer underline"
            >
              Restaurar inventario inicial
            </button>
          </div>
        </div>

        <!-- Navigation Links Column -->
        <div class="md:col-span-3">
          <h4 class="font-condensed font-bold text-sm tracking-wider uppercase text-white mb-3">
            NAVEGACIÓN
          </h4>
          <div class="grid grid-cols-2 gap-2 text-xs text-neutral-300">
            <ul class="space-y-2">
              <li><router-link to="/" class="hover:text-[#48B0DA] transition-colors">Inicio</router-link></li>
              <li><router-link to="/catalogo" class="hover:text-[#48B0DA] transition-colors">Catálogo</router-link></li>
              <li><router-link to="/acerca-de" class="hover:text-[#48B0DA] transition-colors">Acerca de</router-link></li>
              <li><router-link to="/mis-pedidos" class="hover:text-[#48B0DA] transition-colors">Mis Pedidos</router-link></li>
              <li><router-link to="/guia-de-talles" class="hover:text-[#48B0DA] transition-colors">Guía de talles</router-link></li>
            </ul>
            <ul class="space-y-2">
              <li><router-link :to="{ path: '/catalogo', query: { era: 'Retro' } }" class="hover:text-[#48B0DA] transition-colors">Retro</router-link></li>
              <li><router-link :to="{ path: '/catalogo', query: { era: 'Actual' } }" class="hover:text-[#48B0DA] transition-colors">Actuales</router-link></li>
              <li><router-link :to="{ path: '/catalogo', query: { categoria: 'Selección Argentina' } }" class="hover:text-[#48B0DA] transition-colors">Selección</router-link></li>
              <li><router-link :to="{ path: '/catalogo', query: { categoria: 'Ascenso' } }" class="hover:text-[#48B0DA] transition-colors">Ascenso</router-link></li>
            </ul>
          </div>
        </div>

        <!-- Administration Column -->
        <div class="md:col-span-2">
          <h4 class="font-condensed font-bold text-sm tracking-wider uppercase text-white mb-3">
            ADMINISTRACIÓN
          </h4>
          <ul class="space-y-2 text-xs text-neutral-300">
            <li>
              <router-link to="/admin/camisetas" class="text-[#48B0DA] font-semibold hover:underline">
                Gestionar Camisetas
              </router-link>
            </li>
            <li>
              <router-link to="/admin/pedidos" class="hover:text-[#48B0DA] transition-colors">
                Administrar Pedidos
              </router-link>
            </li>
            <!-- El stock se edita desde el catálogo, que solo muestra esas acciones al admin -->
            <li v-if="isAdmin">
              <router-link to="/catalogo" class="hover:text-[#48B0DA] transition-colors">
                Control de Stock
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Contact Column -->
        <div class="md:col-span-3">
          <h4 class="font-condensed font-bold text-sm tracking-wider uppercase text-white mb-3">
            CONTACTO
          </h4>
          <ul class="space-y-2.5 text-xs text-neutral-300">
            <li class="flex items-center gap-2">
              <svg class="w-4 h-4 text-[#48B0DA] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
              </svg>
              <span>hola@traposdeprimera.com</span>
            </li>
            <li class="flex items-center gap-2">
              <svg class="w-4 h-4 text-[#48B0DA] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
              </svg>
              <span>+54 11 1234-5678</span>
            </li>
            <li class="flex items-center gap-2">
              <svg class="w-4 h-4 text-[#48B0DA] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect height="20" rx="5" ry="5" stroke-width="2" width="20" x="2" y="2"></rect>
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01" stroke-width="2"></path>
              </svg>
              <span>@traposdeprimera</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Copyright Notice -->
      <div class="border-t border-neutral-800 pt-6 text-center text-[11px] text-neutral-400">
        <p>© 2026 Trapos de Primera. Todos los derechos reservados. Examen Práctica Profesionalizante ISEC.</p>
      </div>
    </div>
  </footer>
</template>
