<script setup lang="ts">
withDefaults(
  defineProps<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }>(),
  {
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    danger: true
  }
);

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>

<template>
  <teleport to="body">
    <transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        @click.self="emit('cancel')"
      >
        <div
          class="bg-[#F7F4EA] border border-[#E2DEC9] rounded-xl max-w-md w-full p-6 shadow-2xl transform transition-all"
          role="dialog"
          aria-modal="true"
        >
          <div class="flex items-start gap-4">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              :class="danger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-[#48B0DA]'"
            >
              <svg v-if="danger" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
              </svg>
            </div>

            <div class="flex-1">
              <h3 class="text-lg font-condensed font-bold text-[#0C2333] uppercase tracking-wide">
                {{ title }}
              </h3>
              <p class="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                {{ message }}
              </p>
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
            <button
              @click="emit('cancel')"
              type="button"
              class="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-neutral-300 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {{ cancelText }}
            </button>
            <button
              @click="emit('confirm')"
              type="button"
              class="px-4 py-2 text-xs font-bold text-white rounded transition-colors shadow-sm cursor-pointer"
              :class="danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#48B0DA] hover:bg-[#3ca0c9]'"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>
