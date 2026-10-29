<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  cart,
  cartCount,
  cartTotal,
  isCartOpen,
  updateCartQuantity,
  removeFromCart,
  clearCart
} from '../store/useStore';

const router = useRouter();

function formatPrice(val: number): string {
  return val.toLocaleString('es-AR');
}

function handleStartCheckout() {
  isCartOpen.value = false;
  router.push('/checkout');
}

function goToCatalog() {
  isCartOpen.value = false;
  router.push('/catalogo');
}
</script>

<template>
  <teleport to="body">
    <!-- Backdrop -->
    <transition name="modal">
      <div
        v-if="isCartOpen"
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity"
        @click="isCartOpen = false"
      ></div>
    </transition>

    <!-- Slide Drawer -->
    <transition name="slide">
      <aside
        v-if="isCartOpen"
        class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#F7F4EA] dark:bg-[#0C2333] shadow-2xl flex flex-col border-l border-neutral-300 dark:border-neutral-700 text-slate-800 dark:text-neutral-100"
        role="dialog"
        aria-label="Carrito de compras"
      >
        <!-- Drawer Header -->
        <div class="p-4 sm:p-5 bg-[#0C2333] dark:bg-[#081722] text-white flex items-center justify-between border-b border-neutral-800">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-[#48B0DA]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            <h2 class="font-condensed text-xl font-bold uppercase tracking-wide">
              Tu Carrito ({{ cartCount }})
            </h2>
          </div>
          <button
            @click="isCartOpen = false"
            class="text-neutral-400 hover:text-white p-1 text-xl cursor-pointer"
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        <!-- Cart Items List (Using transition-group for animations) -->
        <div v-if="cart.length > 0" class="flex-1 overflow-y-auto p-4 space-y-3">
          <div class="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs px-3 py-2 rounded border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <span>🎉 ¡Tenés <strong>envío gratis</strong> a todo el país!</span>
            <span class="font-bold">3 cuotas s/interés</span>
          </div>

          <transition-group name="list" tag="div" class="space-y-3">
            <div
              v-for="item in cart"
              :key="item.id"
              class="bg-white dark:bg-[#112C3F] rounded-lg p-3 border border-neutral-200 dark:border-neutral-700 shadow-xs flex items-center gap-3 relative"
            >
              <img
                :src="item.jersey.image"
                :alt="item.jersey.name"
                class="w-16 h-16 object-contain bg-[#F7F4EA] dark:bg-[#081722] rounded p-1 shrink-0"
              />

              <div class="flex-1 min-w-0">
                <h4 class="text-xs font-bold text-[#0C2333] dark:text-white truncate">
                  {{ item.jersey.name }}
                </h4>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">
                  Talle: <strong class="text-[#0C2333] dark:text-[#48B0DA]">{{ item.size }}</strong> · {{ item.jersey.type }}
                </p>
                <p class="text-xs font-bold text-[#0C2333] dark:text-white mt-1 tabular-nums">
                  $ {{ formatPrice(item.jersey.price) }}
                </p>

                <!-- Stepper -->
                <div class="flex items-center gap-2 mt-2">
                  <div class="inline-flex items-center border border-neutral-300 dark:border-neutral-600 rounded overflow-hidden">
                    <button
                      @click="updateCartQuantity(item.id, -1)"
                      class="px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                      title="Restar 1"
                    >
                      -
                    </button>
                    <span class="px-2.5 py-0.5 text-xs font-bold text-[#0C2333] dark:text-white border-x border-neutral-300 dark:border-neutral-600">
                      {{ item.quantity }}
                    </span>
                    <button
                      @click="updateCartQuantity(item.id, 1)"
                      class="px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                      title="Sumar 1"
                    >
                      +
                    </button>
                  </div>

                  <button
                    @click="removeFromCart(item.id)"
                    class="text-[11px] text-red-500 hover:underline ml-auto cursor-pointer"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </transition-group>
        </div>

        <!-- Empty State -->
        <div v-else class="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <svg class="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
          </svg>
          <h3 class="font-condensed text-xl font-bold uppercase text-[#0C2333] dark:text-white">
            El carrito está vacío
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6 max-w-xs">
            Elegí tu camiseta favorita de Primera o del Ascenso y sumala a tu colección.
          </p>
          <button
            @click="goToCatalog"
            class="px-5 py-2.5 bg-[#48B0DA] hover:bg-[#3ca0c9] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-xs cursor-pointer"
          >
            Explorar catálogo →
          </button>
        </div>

        <!-- Drawer Footer -->
        <div v-if="cart.length > 0" class="p-4 sm:p-5 bg-white dark:bg-[#081722] border-t border-neutral-300 dark:border-neutral-700 space-y-3">
          <div class="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>Subtotal</span>
            <span class="font-bold tabular-nums text-slate-800 dark:text-white">$ {{ formatPrice(cartTotal) }}</span>
          </div>
          <div class="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>Envíos</span>
            <span class="text-emerald-600 dark:text-emerald-400 font-bold uppercase">Gratis</span>
          </div>
          <div class="flex items-center justify-between text-base font-bold text-[#0C2333] dark:text-white pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <span>Total</span>
            <span class="text-xl tabular-nums text-[#0C2333] dark:text-[#48B0DA]">$ {{ formatPrice(cartTotal) }}</span>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 text-center">
            Hasta 3 cuotas fijas de <strong>$ {{ formatPrice(Math.round(cartTotal / 3)) }}</strong>
          </p>

          <button
            @click="handleStartCheckout"
            class="w-full bg-[#0C2333] dark:bg-[#48B0DA] hover:bg-[#13354d] dark:hover:bg-[#3ca0c9] text-white dark:text-[#0C2333] font-bold py-3 px-4 rounded text-xs sm:text-sm uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Iniciar compra</span>
            <span>→</span>
          </button>

          <button
            @click="clearCart"
            class="w-full text-center text-[11px] text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            Vaciar todo el carrito
          </button>
        </div>
      </aside>
    </transition>
  </teleport>
</template>
