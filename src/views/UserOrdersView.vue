<script setup lang="ts">
import { computed } from 'vue';
import { orders } from '../store/useStore';
import { currentUser } from '../store/useAuth';

// Cada cuenta ve solo sus pedidos. Se filtra por userId y no por el email del comprador,
// que es un dato que se puede escribir a mano en el checkout.
const userOrders = computed(() => {
  if (!currentUser.value) return [];
  return orders.value.filter((o) => o.userId === currentUser.value?.id);
});

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return iso;
  }
}

function formatPrice(val: number): string {
  return val.toLocaleString('es-AR');
}
</script>

<template>
  <main class="max-w-4xl mx-auto px-4 sm:px-6 py-8" data-purpose="user-orders-page">
    <!-- Breadcrumbs -->
    <nav class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6">
      <router-link to="/" class="text-[#48B0DA] hover:underline">Inicio</router-link>
      <span>/</span>
      <span class="text-[#0C2333] dark:text-white font-semibold">Mis Pedidos</span>
    </nav>

    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3">
        <h1 class="font-condensed font-black text-2xl sm:text-3xl uppercase tracking-wider text-[#0C2333] dark:text-white">
          MIS PEDIDOS
        </h1>
        <div class="h-[2px] bg-[#D8B15E] flex-1"></div>
      </div>
      <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
        Seguí el estado de tus compras de camisetas en Trapos de Primera.
      </p>
    </div>

    <!-- Sin pedidos (a esta ruta solo se llega con sesión iniciada: ver el guard del router) -->
    <div
      v-if="userOrders.length === 0"
      class="bg-white dark:bg-[#112C3F] border border-neutral-200 dark:border-neutral-700 rounded-xl p-8 text-center shadow-xs"
    >
      <div class="text-4xl mb-3">📦</div>
      <h2 class="font-condensed text-xl font-bold uppercase text-[#0C2333] dark:text-white">
        Aún no realizaste ningún pedido
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
        Elegí tu camiseta favorita de Primera o del Ascenso y sumala a tu colección.
      </p>
      <router-link
        to="/catalogo"
        class="px-5 py-2.5 bg-[#48B0DA] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-xs"
      >
        Explorar catálogo de camisetas →
      </router-link>
    </div>

    <!-- Listado de Pedidos del Usuario -->
    <div v-else class="space-y-4">
      <div
        v-for="order in userOrders"
        :key="order.id"
        class="bg-white dark:bg-[#112C3F] border border-neutral-200 dark:border-neutral-700 rounded-xl p-5 shadow-xs text-xs space-y-3"
      >
        <!-- Header Pedido -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-3">
          <div>
            <span class="font-bold text-sm text-[#0C2333] dark:text-[#48B0DA] font-mono">{{ order.id }}</span>
            <span class="text-slate-500 dark:text-slate-400 ml-2">({{ formatDate(order.createdAt) }})</span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-slate-500">Estado:</span>
            <span
              class="px-2.5 py-0.5 rounded font-bold text-xs"
              :class="[
                order.status === 'Pagado' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                order.status === 'Cancelado' ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' :
                'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              ]"
            >
              {{ order.status }}
            </span>
          </div>
        </div>

        <!-- Items -->
        <div class="space-y-2">
          <div
            v-for="(item, idx) in order.items"
            :key="idx"
            class="flex items-center gap-3 p-2 bg-[#F7F4EA] dark:bg-[#081722] rounded border border-neutral-200 dark:border-neutral-800"
          >
            <img :src="item.image" :alt="item.name" class="w-12 h-12 object-contain" loading="lazy" />
            <div class="flex-1 min-w-0">
              <p class="font-bold text-slate-800 dark:text-white truncate">{{ item.name }}</p>
              <p class="text-slate-500 dark:text-slate-400">
                Talle: <strong>{{ item.size }}</strong> · Cantidad: <strong>{{ item.quantity }}</strong>
              </p>
            </div>
            <p class="font-bold tabular-nums">$ {{ formatPrice(item.unitPrice * item.quantity) }}</p>
          </div>
        </div>

        <!-- Footer Pedido -->
        <div class="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-slate-600 dark:text-slate-300 gap-2 border-t border-neutral-200 dark:border-neutral-700">
          <div>
            <p><strong>Entrega:</strong> {{ order.deliveryMethod === 'shipping' ? `Envío a domicilio (${order.buyer.address})` : 'Retiro en sucursal' }}</p>
            <p><strong>Pago:</strong> <span class="uppercase">{{ order.paymentMethod }}</span></p>
          </div>
          <div class="text-right">
            <span class="text-xs">Total abonado:</span>
            <span class="block text-base font-bold text-[#0C2333] dark:text-[#48B0DA] tabular-nums">$ {{ formatPrice(order.total) }}</span>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
