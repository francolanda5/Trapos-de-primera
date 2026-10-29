<script setup lang="ts">
import { ref } from 'vue';

const props = withDefaults(
  defineProps<{
    title: string;
    defaultOpen?: boolean;
    borderBottom?: boolean;
    customClasses?: string;
  }>(),
  {
    defaultOpen: true,
    borderBottom: true,
    customClasses: ''
  }
);

const isOpen = ref(props.defaultOpen);

function toggle() {
  isOpen.value = !isOpen.value;
}
</script>

<template>
  <div
    class="transition-all"
    :class="[
      borderBottom ? 'border-b border-gray-200 pb-4' : '',
      customClasses
    ]"
    data-purpose="filter-accordion"
  >
    <button
      type="button"
      @click="toggle"
      class="w-full flex items-center justify-between text-left font-bold text-sm text-[#0C2333] mb-2 select-none cursor-pointer focus:outline-none"
    >
      <slot name="header">
        <span class="font-bold text-xs sm:text-sm tracking-wide">{{ title }}</span>
      </slot>
      <svg
        class="w-4 h-4 transform transition-transform duration-200 text-slate-600"
        :class="isOpen ? 'rotate-180' : 'rotate-0'"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
      </svg>
    </button>

    <div v-show="isOpen" class="pt-1">
      <slot></slot>
    </div>
  </div>
</template>
