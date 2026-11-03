<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  favoriteJerseys,
  favoritesCount,
  isFavoritesOpen,
  toggleFavorite
} from '../store/useStore';

const router = useRouter();

function formatPrice(val: number): string {
  return val.toLocaleString('es-AR');
}

function goToProduct(id: string) {
  isFavoritesOpen.value = false;
  router.push(`/camiseta/${id}`);
}

function goToCatalog() {
  isFavoritesOpen.value = false;
  router.push('/catalogo');
}
</script>

<template>
  <teleport to="body">
    <!-- Backdrop -->
    <transition name="modal">
      <div
        v-if="isFavoritesOpen"
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity"
        @click="isFavoritesOpen = false"
      ></div>
    </transition>

    <!-- Slide Drawer -->
    <transition name="slide">
      <aside
        v-if="isFavoritesOpen"
        class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#F7F4EA] dark:bg-[#0C2333] shadow-2xl flex flex-col border-l border-neutral-300 dark:border-neutral-700 text-slate-800 dark:text-neutral-100"
        role="dialog"
        aria-label="Tus favoritos guardados"
      >
        <!-- Drawer Header -->
        <div class="p-4 sm:p-5 bg-[#0C2333] dark:bg-[#081722] text-white flex items-center justify-between border-b border-neutral-800">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-red-500 fill-red-500" viewBox="0 0 24 24">
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"></path>
            </svg>
            <h2 class="font-condensed text-xl font-bold uppercase tracking-wide">
              Tus Favoritos ({{ favoritesCount }})
            </h2>
          </div>
          <button
            @click="isFavoritesOpen = false"
            class="text-neutral-400 hover:text-white p-1 text-xl cursor-pointer"
            aria-label="Cerrar favoritos"
          >
            ✕
          </button>
        </div>

        <!-- Favorites List with transition-group -->
        <div v-if="favoriteJerseys.length > 0" class="flex-1 overflow-y-auto p-4 space-y-3">
          <transition-group name="list" tag="div" class="space-y-3">
            <div
              v-for="jersey in favoriteJerseys"
              :key="jersey.id"
              class="bg-white dark:bg-[#112C3F] rounded-lg p-3 border border-neutral-200 dark:border-neutral-700 shadow-xs flex items-center gap-3 relative group"
            >
              <button
                @click="goToProduct(jersey.id)"
                class="w-16 h-16 object-contain bg-[#F7F4EA] dark:bg-[#081722] rounded p-1 shrink-0 cursor-pointer flex items-center justify-center overflow-hidden"
              >
                <img :src="jersey.image" :alt="jersey.name" class="w-full h-full object-contain" loading="lazy" />
              </button>

              <div class="flex-1 min-w-0">
                <button
                  @click="goToProduct(jersey.id)"
                  class="text-left font-bold text-xs text-[#0C2333] dark:text-white hover:text-[#48B0DA] transition-colors truncate block w-full cursor-pointer"
                >
                  {{ jersey.name }}
                </button>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">
                  {{ jersey.team }} · {{ jersey.season }}
                </p>
                <p class="text-xs font-bold text-[#0C2333] dark:text-[#48B0DA] mt-1 tabular-nums">
                  $ {{ formatPrice(jersey.price) }}
                </p>
              </div>

              <div class="flex flex-col items-end gap-2">
                <button
                  @click="goToProduct(jersey.id)"
                  class="text-xs font-semibold text-[#48B0DA] hover:underline cursor-pointer"
                >
                  Ver trapo →
                </button>
                <button
                  @click="toggleFavorite(jersey.id)"
                  class="text-[11px] text-red-500 hover:text-red-700 transition-colors p-1 cursor-pointer"
                  title="Quitar de favoritos"
                >
                  Quitar
                </button>
              </div>
            </div>
          </transition-group>
        </div>

        <!-- Empty State -->
        <div v-else class="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <svg class="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
          </svg>
          <h3 class="font-condensed text-xl font-bold uppercase text-[#0C2333] dark:text-white">
            No tenés favoritos guardados
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6 max-w-xs">
            Hacé clic en el corazón de cualquier camiseta para guardarla en tu colección personal.
          </p>
          <button
            @click="goToCatalog"
            class="px-5 py-2.5 bg-[#48B0DA] hover:bg-[#3ca0c9] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-xs cursor-pointer"
          >
            Explorar camisetas →
          </button>
        </div>
      </aside>
    </transition>
  </teleport>
</template>
