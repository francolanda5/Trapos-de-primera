<script setup lang="ts">
import { ref } from 'vue';
import type { Jersey } from '../types';
import { isFavorite, toggleFavorite, addToCart } from '../store/useStore';

const props = withDefaults(
  defineProps<{
    jersey: Jersey;
    horizontal?: boolean;
    showBadge?: boolean;
    showAdminActions?: boolean;
  }>(),
  {
    horizontal: false,
    showBadge: false,
    showAdminActions: false
  }
);

// La tarjeta no decide qué hacer al editar o eliminar: le avisa al padre con un emit.
const emit = defineEmits<{
  (e: 'edit', jersey: Jersey): void;
  (e: 'delete', jersey: Jersey): void;
}>();

const addedFeedback = ref<string | null>(null);

function handleQuickAdd(size: string) {
  const available = props.jersey.sizeStock[size] || 0;
  if (available <= 0) {
    addedFeedback.value = `Talle ${size} agotado`;
    setTimeout(() => {
      addedFeedback.value = null;
    }, 1500);
    return;
  }

  const res = addToCart(props.jersey, size, 1);
  if (res.success) {
    addedFeedback.value = `✓ ¡Agregada en talle ${size}!`;
  } else {
    addedFeedback.value = res.error || 'Stock insuficiente';
  }
  setTimeout(() => {
    addedFeedback.value = null;
  }, 1800);
}

function formatPrice(val: number): string {
  return val.toLocaleString('es-AR');
}
</script>

<template>
  <!-- Card Horizontal (para la sección "Más buscadas") -->
  <article
    v-if="horizontal"
    class="bg-white dark:bg-[#112C3F] rounded-xl p-4 shadow-xs border border-neutral-200/80 dark:border-neutral-700/80 flex items-center gap-4 relative group hover:shadow-md transition-all text-slate-800 dark:text-neutral-100"
  >
    <button
      @click.stop="toggleFavorite(jersey.id)"
      :aria-label="isFavorite(jersey.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'"
      class="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors z-10 cursor-pointer"
    >
      <svg
        class="w-5 h-5 stroke-current"
        :class="isFavorite(jersey.id) ? 'fill-red-500 text-red-500' : 'fill-none'"
        stroke-width="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    </button>

    <router-link
      :to="`/camiseta/${jersey.id}`"
      class="jersey-frame w-28 flex-shrink-0 bg-[#F7F4EA] dark:bg-[#081722] rounded-md p-1"
    >
      <img
        :src="jersey.image"
        :alt="jersey.name"
        class="jersey-image group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
    </router-link>

    <div class="flex-1 min-w-0">
      <router-link :to="`/camiseta/${jersey.id}`" class="block">
        <h3 class="font-bold text-slate-900 dark:text-white text-sm hover:text-[#48B0DA] transition-colors truncate">
          {{ jersey.name }}
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">
          {{ jersey.type }} {{ jersey.season }}
        </p>
        <p class="font-bold text-slate-900 dark:text-[#48B0DA] text-sm sm:text-base mb-2 tabular-nums">
          $ {{ formatPrice(jersey.price) }}
        </p>
      </router-link>

      <!-- Selector de Talles con deshabilitado de agotados -->
      <div class="flex items-center gap-1 flex-wrap">
        <button
          v-for="s in jersey.sizes"
          :key="s"
          @click="handleQuickAdd(s)"
          :disabled="(jersey.sizeStock[s] || 0) <= 0"
          class="text-[10px] border rounded px-1.5 py-0.5 font-semibold transition-colors cursor-pointer"
          :class="[
            (jersey.sizeStock[s] || 0) > 0
              ? 'border-neutral-300 dark:border-neutral-600 text-slate-700 dark:text-neutral-200 hover:bg-[#48B0DA] hover:text-white hover:border-[#48B0DA]'
              : 'border-dashed border-neutral-300 dark:border-neutral-700 text-slate-400 dark:text-neutral-500 line-through cursor-not-allowed bg-neutral-100 dark:bg-neutral-800'
          ]"
          :title="(jersey.sizeStock[s] || 0) > 0 ? `Talle ${s}: ${jersey.sizeStock[s]} disponibles` : `Talle ${s}: Agotado`"
        >
          {{ s }}
        </button>
      </div>

      <p v-if="addedFeedback" class="text-[10px] font-bold mt-1" :class="addedFeedback.includes('✓') ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'">
        {{ addedFeedback }}
      </p>
    </div>
  </article>

  <!-- Card Vertical Estándar (para Catálogo y Recién Llegadas) -->
  <article
    v-else
    class="bg-white dark:bg-[#112C3F] rounded-xl p-3 sm:p-4 shadow-xs border border-neutral-200/80 dark:border-neutral-700/80 flex flex-col justify-between relative group hover:shadow-md transition-all h-full text-slate-800 dark:text-neutral-100"
  >
    <!-- Botón Favorito -->
    <button
      @click.stop="toggleFavorite(jersey.id)"
      :aria-label="isFavorite(jersey.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'"
      class="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors z-10 p-1 cursor-pointer"
    >
      <svg
        class="w-5 h-5 stroke-current"
        :class="isFavorite(jersey.id) ? 'fill-red-500 text-red-500' : 'fill-none'"
        stroke-width="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    </button>

    <!-- Contenedor Imagen -->
    <router-link
      :to="`/camiseta/${jersey.id}`"
      class="jersey-frame w-full mb-3 bg-[#F7F4EA]/60 dark:bg-[#081722]/80 rounded-lg p-2 relative"
    >
      <img
        :src="jersey.image"
        :alt="`${jersey.name} ${jersey.season}`"
        class="jersey-image group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />

      <!-- Badge Opcional (Actual / Retro) -->
      <span
        v-if="showBadge"
        class="absolute bottom-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs"
        :class="jersey.era === 'Retro' ? 'bg-[#DEAC4C] text-white' : 'bg-[#48B0DA] text-white'"
      >
        {{ jersey.era }}
      </span>

      <span
        v-if="jersey.stock === 0"
        class="absolute top-2.5 left-2.5 bg-red-600 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded"
      >
        Agotado
      </span>
    </router-link>

    <!-- Información de Producto -->
    <div class="flex flex-col justify-between flex-1">
      <router-link :to="`/camiseta/${jersey.id}`" class="block">
        <h3 class="font-bold text-slate-900 dark:text-white text-sm hover:text-[#48B0DA] transition-colors leading-snug">
          {{ jersey.name }}
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">
          {{ jersey.type }} {{ jersey.season }}
        </p>
        <p class="font-bold text-slate-900 dark:text-[#48B0DA] text-sm sm:text-base mb-2 tabular-nums">
          $ {{ formatPrice(jersey.price) }}
        </p>
      </router-link>

      <!-- Selector de Talles / Botones rápidos con stock independiente -->
      <div class="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-1">
        <div class="flex items-center gap-1 flex-wrap">
          <button
            v-for="s in jersey.sizes"
            :key="s"
            @click="handleQuickAdd(s)"
            :disabled="(jersey.sizeStock[s] || 0) <= 0"
            class="text-[10px] border rounded px-1.5 py-0.5 font-semibold transition-colors cursor-pointer"
            :class="[
              (jersey.sizeStock[s] || 0) > 0
                ? 'border-neutral-300 dark:border-neutral-600 text-slate-600 dark:text-neutral-200 hover:border-[#48B0DA] hover:text-[#48B0DA] hover:bg-slate-50 dark:hover:bg-neutral-800'
                : 'border-dashed border-neutral-300 dark:border-neutral-700 text-slate-400 dark:text-neutral-500 line-through cursor-not-allowed bg-neutral-100 dark:bg-neutral-800/60'
            ]"
            :title="(jersey.sizeStock[s] || 0) > 0 ? `Talle ${s}: ${jersey.sizeStock[s]} disponibles` : `Talle ${s}: Agotado`"
          >
            {{ s }}
          </button>
        </div>

        <router-link
          :to="`/camiseta/${jersey.id}`"
          class="text-xs font-semibold text-[#48B0DA] hover:underline whitespace-nowrap pl-1"
        >
          Ver →
        </router-link>
      </div>

      <!-- Feedback de adición rápida -->
      <p v-if="addedFeedback" class="text-[10px] font-bold mt-1 text-center" :class="addedFeedback.includes('✓') ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'">
        {{ addedFeedback }}
      </p>

      <!-- Acciones de administrador (CRUD desde el listado) -->
      <div v-if="showAdminActions" class="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 gap-2">
        <button
          type="button"
          @click="emit('edit', jersey)"
          class="py-1 text-[11px] font-bold rounded border border-[#0C2333] dark:border-neutral-500 text-[#0C2333] dark:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          Editar
        </button>
        <button
          type="button"
          @click="emit('delete', jersey)"
          class="py-1 text-[11px] font-bold rounded border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
        >
          Eliminar
        </button>
      </div>
    </div>
  </article>
</template>
