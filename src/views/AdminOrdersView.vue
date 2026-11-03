<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { orders, updateOrdersStatus, unreadMessagesCount, type BulkStatusResult } from '../store/useStore';
import type { Order, OrderStatus } from '../types';
import ConfirmModal from '../components/ConfirmModal.vue';

const selectedStatusFilter = ref<string>('todos');
const selectedOrder = ref<Order | null>(null);

// --- Selección y acciones masivas ---
const selectedIds = ref<string[]>([]);
const bulkTarget = ref<OrderStatus | null>(null); // estado elegido, pendiente de confirmar
const lastResult = ref<BulkStatusResult | null>(null);

const allVisibleSelected = computed(
  () => filteredOrders.value.length > 0 && filteredOrders.value.every((o) => selectedIds.value.includes(o.id))
);

function toggleSelected(id: string) {
  const idx = selectedIds.value.indexOf(id);
  if (idx > -1) {
    selectedIds.value.splice(idx, 1);
  } else {
    selectedIds.value.push(id);
  }
}

// "Seleccionar todos" alcanza solo a los pedidos visibles según el filtro
function toggleSelectAll() {
  selectedIds.value = allVisibleSelected.value ? [] : filteredOrders.value.map((o) => o.id);
}

function clearSelection() {
  selectedIds.value = [];
}

// Si cambia el filtro se limpia la selección, para no modificar pedidos que ya no se ven
watch(selectedStatusFilter, clearSelection);

const bulkMessage = computed(() => {
  const count = selectedIds.value.length;
  const base = `Vas a marcar ${count} ${count === 1 ? 'pedido' : 'pedidos'} como ${bulkTarget.value}.`;
  if (bulkTarget.value === 'Cancelado') return `${base} El stock de los pedidos activos vuelve a cada talle.`;
  return `${base} Los pedidos cancelados vuelven a descontar stock, y se omiten si no alcanza.`;
});

function onConfirmBulk() {
  if (bulkTarget.value) {
    lastResult.value = updateOrdersStatus(selectedIds.value, bulkTarget.value);
  }
  bulkTarget.value = null;
  clearSelection();
}

// Resumen del resultado, por ejemplo: "5 actualizados, 1 omitido por falta de stock"
const resultSummary = computed(() => {
  if (!lastResult.value) return '';
  const { updated, unchanged, skipped } = lastResult.value;
  const parts = [`${updated.length} ${updated.length === 1 ? 'actualizado' : 'actualizados'}`];
  if (skipped.length) parts.push(`${skipped.length} ${skipped.length === 1 ? 'omitido' : 'omitidos'} por falta de stock`);
  if (unchanged.length) parts.push(`${unchanged.length} ya ${unchanged.length === 1 ? 'estaba' : 'estaban'} en ese estado`);
  return parts.join(', ');
});

// Modal de confirmación para cancelar pedido
const showCancelConfirmModal = ref(false);
const orderToCancel = ref<Order | null>(null);

const filteredOrders = computed(() => {
  if (selectedStatusFilter.value === 'todos') {
    return orders.value;
  }
  return orders.value.filter((o) => o.status.toLowerCase() === selectedStatusFilter.value.toLowerCase());
});

function openOrderDetails(order: Order) {
  selectedOrder.value = order;
}

function handleStatusChange(order: Order, event: Event) {
  const select = event.target as HTMLSelectElement;
  const newStatus = select.value as OrderStatus;
  // El select vuelve al estado real: solo cambia si el pedido cambia de verdad
  select.value = order.status;

  if (newStatus === 'Cancelado') {
    orderToCancel.value = order;
    showCancelConfirmModal.value = true;
    return;
  }
  lastResult.value = updateOrdersStatus([order.id], newStatus);
}

function onConfirmCancel() {
  if (orderToCancel.value) {
    lastResult.value = updateOrdersStatus([orderToCancel.value.id], 'Cancelado');
    showCancelConfirmModal.value = false;
    orderToCancel.value = null;
  }
}

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
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-purpose="admin-orders-page">
    <!-- Breadcrumbs -->
    <nav class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6">
      <router-link to="/" class="text-[#48B0DA] hover:underline">Inicio</router-link>
      <span>/</span>
      <router-link to="/admin/camisetas" class="text-slate-600 dark:text-slate-300 hover:underline">Administración</router-link>
      <span>/</span>
      <span class="text-[#0C2333] dark:text-white font-semibold">Pedidos</span>
    </nav>

    <!-- Header & Action Toolbar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="font-condensed font-black text-2xl sm:text-3xl uppercase tracking-wider text-[#0C2333] dark:text-white">
            ADMINISTRACIÓN DE PEDIDOS
          </h1>
          <div class="h-[2px] bg-[#D8B15E] w-12 hidden sm:block"></div>
        </div>
        <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
          Consultá los pedidos, revisá comprobantes adjuntos y gestioná estados con trazabilidad de stock.
        </p>
      </div>

      <!-- Links to other admin sections -->
      <div class="flex items-center gap-2">
        <router-link
          to="/admin/camisetas"
          class="px-3.5 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-[#112C3F] text-xs font-bold text-slate-700 dark:text-neutral-200 hover:border-[#48B0DA] transition-colors"
        >
          👕 Gestionar Camisetas
        </router-link>
        <router-link
          to="/admin/mensajes"
          class="px-3.5 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-[#112C3F] text-xs font-bold text-slate-700 dark:text-neutral-200 hover:border-[#48B0DA] transition-colors"
        >
          ✉️ Mensajes<span v-if="unreadMessagesCount > 0"> ({{ unreadMessagesCount }})</span>
        </router-link>
      </div>
    </div>

    <!-- Filter Pills by Status -->
    <div class="flex flex-wrap items-center gap-2 mb-6 pb-2">
      <span class="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Filtrar por:</span>
      <button
        @click="selectedStatusFilter = 'todos'"
        class="px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer"
        :class="selectedStatusFilter === 'todos' ? 'bg-[#48B0DA] text-white' : 'bg-white dark:bg-[#112C3F] border border-neutral-300 dark:border-neutral-600 text-slate-700 dark:text-slate-300'"
      >
        Todos ({{ orders.length }})
      </button>
      <button
        @click="selectedStatusFilter = 'pendiente'"
        class="px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer"
        :class="selectedStatusFilter === 'pendiente' ? 'bg-[#48B0DA] text-white' : 'bg-white dark:bg-[#112C3F] border border-neutral-300 dark:border-neutral-600 text-slate-700 dark:text-slate-300'"
      >
        Pendientes ({{ orders.filter(o => o.status === 'Pendiente').length }})
      </button>
      <button
        @click="selectedStatusFilter = 'pagado'"
        class="px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer"
        :class="selectedStatusFilter === 'pagado' ? 'bg-[#48B0DA] text-white' : 'bg-white dark:bg-[#112C3F] border border-neutral-300 dark:border-neutral-600 text-slate-700 dark:text-slate-300'"
      >
        Pagados ({{ orders.filter(o => o.status === 'Pagado').length }})
      </button>
      <button
        @click="selectedStatusFilter = 'cancelado'"
        class="px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer"
        :class="selectedStatusFilter === 'cancelado' ? 'bg-[#48B0DA] text-white' : 'bg-white dark:bg-[#112C3F] border border-neutral-300 dark:border-neutral-600 text-slate-700 dark:text-slate-300'"
      >
        Cancelados ({{ orders.filter(o => o.status === 'Cancelado').length }})
      </button>
    </div>

    <!-- Resumen de la última acción: se ve aunque cambie el filtro -->
    <div
      v-if="lastResult"
      role="status"
      class="mb-4 p-3 rounded-lg border text-xs"
      :class="lastResult.skipped.length ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200' : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'"
    >
      <div class="flex items-start justify-between gap-2">
        <p class="font-bold" data-purpose="bulk-result">{{ resultSummary }}</p>
        <button type="button" @click="lastResult = null" aria-label="Cerrar resumen" class="px-1 cursor-pointer">✕</button>
      </div>
      <ul v-if="lastResult.skipped.length" class="mt-1 list-disc pl-4 space-y-0.5">
        <li v-for="item in lastResult.skipped" :key="item.id">
          <span class="font-mono font-bold">{{ item.id }}</span>: {{ item.reason }}
        </li>
      </ul>
    </div>

    <!-- Orders Table: en celular se ocultan columnas y sus datos pasan a la primera celda -->
    <div class="bg-white dark:bg-[#112C3F] rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#F7F4EA] dark:bg-[#081722] text-[#0C2333] dark:text-white uppercase font-bold text-[11px] border-b border-neutral-200 dark:border-neutral-700 tracking-wider">
            <tr>
              <th class="pl-2 w-11">
                <label class="flex items-center justify-center min-w-11 min-h-11 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="allVisibleSelected"
                    :disabled="filteredOrders.length === 0"
                    @change="toggleSelectAll"
                    aria-label="Seleccionar todos los pedidos visibles"
                    class="w-4 h-4 cursor-pointer"
                  />
                </label>
              </th>
              <th class="px-2 md:px-4 py-3">Número y Fecha</th>
              <th class="hidden md:table-cell px-4 py-3">Comprador</th>
              <th class="hidden md:table-cell px-4 py-3">Importe Total</th>
              <th class="hidden md:table-cell px-4 py-3">Método de Pago</th>
              <th class="px-2 md:px-4 py-3">Estado</th>
              <th class="hidden md:table-cell px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700 text-slate-700 dark:text-slate-200">
            <tr v-if="filteredOrders.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-slate-500">
                No hay pedidos con el estado seleccionado.
              </td>
            </tr>

            <tr
              v-for="order in filteredOrders"
              :key="order.id"
              class="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
              :class="selectedIds.includes(order.id) ? 'bg-blue-50/60 dark:bg-blue-950/30' : ''"
            >
              <!-- Selección -->
              <td class="pl-2 w-11">
                <label class="flex items-center justify-center min-w-11 min-h-11 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(order.id)"
                    @change="toggleSelected(order.id)"
                    :aria-label="`Seleccionar pedido ${order.id}`"
                    class="w-4 h-4 cursor-pointer"
                  />
                </label>
              </td>

              <!-- Número y Fecha (en celular suma comprador e importe) -->
              <td class="px-2 md:px-4 py-3.5">
                <span class="font-bold text-[#0C2333] dark:text-[#48B0DA] font-mono text-xs whitespace-nowrap">{{ order.id }}</span>
                <span class="block text-[11px] text-slate-500 dark:text-slate-400">{{ formatDate(order.createdAt) }}</span>
                <span class="md:hidden block font-bold mt-1 break-words">{{ order.buyer.name }} {{ order.buyer.lastName }}</span>
                <span class="md:hidden block font-bold tabular-nums">$ {{ formatPrice(order.total) }}</span>
              </td>

              <!-- Comprador -->
              <td class="hidden md:table-cell px-4 py-3.5">
                <div class="font-bold truncate max-w-[160px]">{{ order.buyer.name }} {{ order.buyer.lastName }}</div>
                <div class="text-[11px] text-slate-500 truncate max-w-[160px]">{{ order.buyer.email }}</div>
              </td>

              <!-- Importe Total -->
              <td class="hidden md:table-cell px-4 py-3.5 font-bold tabular-nums whitespace-nowrap">
                $ {{ formatPrice(order.total) }}
                <span class="block text-[10px] text-slate-500 font-normal">({{ order.items.length }} camisetas)</span>
              </td>

              <!-- Método de Pago & Comprobante -->
              <td class="hidden md:table-cell px-4 py-3.5 whitespace-nowrap">
                <span class="capitalize font-semibold">{{ order.paymentMethod }}</span>
                <span
                  v-if="order.receiptImage"
                  class="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold"
                  title="Comprobante disponible"
                >
                  📎 Comprobante
                </span>
              </td>

              <!-- Estado (en celular suma el botón de detalle) -->
              <td class="px-2 md:px-4 py-3.5">
                <select
                  :value="order.status"
                  :aria-label="`Estado del pedido ${order.id}`"
                  @change="handleStatusChange(order, $event)"
                  class="text-xs font-bold rounded px-2.5 py-1 border transition-colors cursor-pointer"
                  :class="[
                    order.status === 'Pagado' ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300' :
                    order.status === 'Cancelado' ? 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950/60 dark:text-red-300' :
                    'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                  ]"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
                <button
                  @click="openOrderDetails(order)"
                  class="md:hidden block mt-2 px-3 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold cursor-pointer"
                >
                  Ver detalle
                </button>
              </td>

              <!-- Acciones -->
              <td class="hidden md:table-cell px-4 py-3.5 text-right whitespace-nowrap">
                <button
                  @click="openOrderDetails(order)"
                  class="px-3 py-1 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-[#48B0DA] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Ver detalle
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Barra de acciones masivas: aparece al seleccionar y queda visible al bajar -->
    <transition name="fade">
      <div
        v-if="selectedIds.length > 0"
        role="region"
        aria-label="Acciones sobre los pedidos seleccionados"
        class="sticky bottom-20 z-30 mt-4 p-3 rounded-xl bg-[#0C2333] dark:bg-[#081722] border border-[#1E4663] text-white shadow-xl flex flex-wrap items-center gap-2"
      >
        <span class="text-xs font-bold w-full sm:w-auto sm:mr-2" data-purpose="bulk-count">
          {{ selectedIds.length }} {{ selectedIds.length === 1 ? 'seleccionado' : 'seleccionados' }}
        </span>
        <button type="button" @click="bulkTarget = 'Pagado'" class="flex-1 sm:flex-none min-h-11 px-3 rounded bg-emerald-600 hover:bg-emerald-700 text-xs font-bold cursor-pointer">
          Marcar Pagado
        </button>
        <button type="button" @click="bulkTarget = 'Pendiente'" class="flex-1 sm:flex-none min-h-11 px-3 rounded bg-amber-600 hover:bg-amber-700 text-xs font-bold cursor-pointer">
          Marcar Pendiente
        </button>
        <button type="button" @click="bulkTarget = 'Cancelado'" class="flex-1 sm:flex-none min-h-11 px-3 rounded bg-red-600 hover:bg-red-700 text-xs font-bold cursor-pointer">
          Marcar Cancelado
        </button>
        <button type="button" @click="clearSelection" class="flex-1 sm:flex-none min-h-11 px-3 rounded border border-white/60 hover:bg-white/10 text-xs font-bold cursor-pointer">
          Limpiar selección
        </button>
      </div>
    </transition>

    <!-- Confirmación de la acción masiva -->
    <ConfirmModal
      :is-open="bulkTarget !== null"
      title="¿Aplicar a los pedidos seleccionados?"
      :message="bulkMessage"
      :confirm-text="`Sí, marcar ${bulkTarget ?? ''}`"
      cancel-text="Volver"
      :danger="bulkTarget === 'Cancelado'"
      @confirm="onConfirmBulk"
      @cancel="bulkTarget = null"
    />

    <!-- Modal de Detalle de Pedido -->
    <teleport to="body">
      <transition name="modal">
        <div
          v-if="selectedOrder"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          @click.self="selectedOrder = null"
        >
          <div class="bg-[#F7F4EA] dark:bg-[#0C2333] border border-[#E2DEC9] dark:border-[#1E4663] rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-800 dark:text-neutral-100">
            <!-- Modal Header -->
            <div class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-3 mb-4">
              <div>
                <h3 class="font-condensed text-xl font-bold uppercase text-[#0C2333] dark:text-white">
                  Detalle del Pedido {{ selectedOrder.id }}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Registrado el {{ formatDate(selectedOrder.createdAt) }}
                </p>
              </div>
              <button @click="selectedOrder = null" class="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xl cursor-pointer">
                ✕
              </button>
            </div>

            <!-- Datos Comprador & Entrega -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-white dark:bg-[#112C3F] p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 mb-4">
              <div>
                <h4 class="font-bold text-[#0C2333] dark:text-[#48B0DA] uppercase mb-1">Comprador</h4>
                <p><strong>Nombre:</strong> {{ selectedOrder.buyer.name }} {{ selectedOrder.buyer.lastName }}</p>
                <p><strong>Email:</strong> {{ selectedOrder.buyer.email }}</p>
                <p><strong>Teléfono:</strong> {{ selectedOrder.buyer.phone }}</p>
              </div>
              <div>
                <h4 class="font-bold text-[#0C2333] dark:text-[#48B0DA] uppercase mb-1">Entrega & Estado</h4>
                <p><strong>Modalidad:</strong> {{ selectedOrder.deliveryMethod === 'shipping' ? `Envío (${selectedOrder.buyer.address}, ${selectedOrder.buyer.city})` : 'Retiro en local' }}</p>
                <p><strong>Método de pago:</strong> <span class="uppercase">{{ selectedOrder.paymentMethod }}</span></p>
                <p><strong>Estado:</strong> <span class="font-bold">{{ selectedOrder.status }}</span> (Stock descontado: {{ selectedOrder.stockDeducted ? 'Sí' : 'Revertido/No' }})</p>
              </div>
            </div>

            <!-- Camisetas Incluidas -->
            <div class="mb-4">
              <h4 class="font-bold text-xs uppercase text-[#0C2333] dark:text-white mb-2">Camisetas Solicitadas</h4>
              <div class="space-y-2">
                <div
                  v-for="(item, idx) in selectedOrder.items"
                  :key="idx"
                  class="flex items-center gap-3 p-2 bg-white dark:bg-[#112C3F] rounded border border-neutral-200 dark:border-neutral-700 text-xs"
                >
                  <img :src="item.image" :alt="item.name" class="w-12 h-12 object-contain" loading="lazy" />
                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-slate-800 dark:text-white truncate">{{ item.name }}</p>
                    <p class="text-slate-500 dark:text-slate-400">
                      Talle: <strong>{{ item.size }}</strong> · Cantidad: <strong>{{ item.quantity }}</strong>
                    </p>
                  </div>
                  <div class="font-bold tabular-nums">
                    $ {{ formatPrice(item.unitPrice * item.quantity) }}
                  </div>
                </div>
              </div>

              <div class="flex justify-between items-center text-sm font-bold pt-3 mt-2 border-t border-neutral-200 dark:border-neutral-700">
                <span>TOTAL:</span>
                <span class="text-base text-[#48B0DA] tabular-nums">$ {{ formatPrice(selectedOrder.total) }}</span>
              </div>
            </div>

            <!-- Comprobante Adjunto (si existe) -->
            <div v-if="selectedOrder.receiptImage" class="mb-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
              <h4 class="font-bold text-xs uppercase text-[#0C2333] dark:text-white mb-2">Comprobante de Pago Adjunto</h4>
              <div class="p-3 bg-white dark:bg-[#112C3F] rounded-lg border border-neutral-200 dark:border-neutral-700 flex flex-col items-center">
                <img
                  :src="selectedOrder.receiptImage"
                  alt="Comprobante de pago"
                  class="max-h-64 object-contain rounded mb-2 shadow-xs"
                />
                <p class="text-[11px] text-slate-500">
                  Comprobante adjuntado por el comprador. Podés cambiar el estado del pedido a "Pagado" arriba si la transferencia es correcta.
                </p>
              </div>
            </div>

            <!-- Footer Modal -->
            <div class="flex justify-end pt-3 border-t border-neutral-200 dark:border-neutral-700">
              <button
                @click="selectedOrder = null"
                class="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 font-bold text-xs rounded hover:bg-neutral-300 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- Modal de Confirmación antes de Cancelar Pedido (reversión de stock) -->
    <ConfirmModal
      :is-open="showCancelConfirmModal"
      title="¿Confirmar Cancelación de Pedido?"
      :message="orderToCancel ? `¿Deseás cancelar el pedido '${orderToCancel.id}'? Las ${orderToCancel.items.reduce((a, b) => a + b.quantity, 0)} unidades compradas se reintegrarán automáticamente a sus talles respectivos.` : 'Confirmar cancelación'"
      confirm-text="Sí, cancelar pedido y devolver stock"
      cancel-text="Volver"
      :danger="true"
      @confirm="onConfirmCancel"
      @cancel="showCancelConfirmModal = false"
    />
  </main>
</template>
