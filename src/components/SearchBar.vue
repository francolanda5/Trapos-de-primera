<script setup lang="ts">
// Buscador reutilizable: se usa en TDPNavbar y en CatalogView.
// Soporta v-model: recibe el texto por la prop modelValue y avisa los cambios con
// el emit update:modelValue. Al apretar Enter emite search.
defineProps<{
  modelValue: string;
  placeholder?: string;
  label?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'search'): void;
}>();

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <form @submit.prevent="emit('search')" class="relative w-full" role="search" data-purpose="search-bar-component">
    <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
      </svg>
    </span>
    <input
      :value="modelValue"
      @input="onInput"
      type="text"
      :aria-label="label || 'Buscar camisetas'"
      :placeholder="placeholder || 'Buscar camisetas, equipos, temporadas...'"
      class="w-full text-xs sm:text-sm pl-9 pr-8 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-[#112C3F] text-slate-800 dark:text-neutral-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#48B0DA] focus:border-transparent transition-all shadow-xs"
    />
    <button
      v-if="modelValue"
      type="button"
      @click="emit('update:modelValue', '')"
      class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
      title="Limpiar búsqueda"
      aria-label="Limpiar búsqueda"
    >
      ✕
    </button>
  </form>
</template>
