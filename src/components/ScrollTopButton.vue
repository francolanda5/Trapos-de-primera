<script lang="ts">
// Botón flotante "volver arriba": aparece al bajar más de "threshold" píxeles.
// Está escrito con Options API porque usa los hooks created() y mounted(), que pide la consigna.
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ScrollTopButton',
  props: {
    threshold: { type: Number, default: 400 },
    label: { type: String, default: 'Volver arriba' }
  },
  data() {
    return {
      isVisible: false,
      reduceMotion: false
    };
  },
  // created(): ya existen data y methods, pero todavía no hay DOM. Alcanza para leer una preferencia.
  created() {
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  // mounted(): el botón ya está en la página. Empieza a escuchar el scroll y calcula el estado inicial.
  mounted() {
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.onScroll();
  },
  unmounted() {
    window.removeEventListener('scroll', this.onScroll);
  },
  methods: {
    onScroll() {
      this.isVisible = window.scrollY > this.threshold;
    },
    scrollToTop() {
      // Quien pidió reducir el movimiento en su sistema va arriba sin animación
      window.scrollTo({ top: 0, behavior: this.reduceMotion ? 'auto' : 'smooth' });
    }
  }
});
</script>

<template>
  <transition name="scroll-top">
    <!-- z-30: queda por debajo de la barra superior, los drawers y los modales -->
    <button
      v-if="isVisible"
      type="button"
      @click="scrollToTop"
      :aria-label="label"
      :title="label"
      class="fixed right-4 bottom-4 z-30 w-12 h-12 rounded-full bg-[#0C2333] dark:bg-[#48B0DA] text-white dark:text-[#0C2333] shadow-lg flex items-center justify-center hover:opacity-90 cursor-pointer"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 15l7-7 7 7" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    </button>
  </transition>
</template>
