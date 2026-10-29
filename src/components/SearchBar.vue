<script setup lang="ts">
defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'search', value: string): void;
}>();

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}

function onSubmit() {
  emit('search', '');
}
</script>

<template>
  <form @submit.prevent="onSubmit" class="relative w-full" data-purpose="search-bar-component">
    <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
      </svg>
    </span>
    <input
      :value="modelValue"
      @input="onInput"
      type="search"
      :placeholder="placeholder || 'Buscar camisetas, equipos, temporadas...'"
      class="w-full text-xs pl-9 pr-8 py-2 rounded-md border border-neutral-300 bg-white text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#48B0DA] focus:border-transparent transition-all shadow-xs"
    />
    <button
      v-if="modelValue"
      type="button"
      @click="emit('update:modelValue', '')"
      class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
      title="Limpiar búsqueda"
    >
      ✕
    </button>
  </form>
</template>
