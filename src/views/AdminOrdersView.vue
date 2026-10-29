<script setup lang="ts">
import { ref, computed } from 'vue';
import { orders, updateOrderStatus, getJerseyById } from '../store/useStore';
import { isAdmin, currentUser, loginAsTestAdmin } from '../store/useAuth';
import type { Order, OrderStatus } from '../types';
import ConfirmModal from '../components/ConfirmModal.vue';

const selectedStatusFilter = ref<string>('todos');
const selectedOrder = ref<Order | null>(null);

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

function handleStatusChange(order: Order, newStatus: OrderStatus) {
  if (newStatus === 'Cancelado') {
    orderToCancel.value = order;
    showCancelConfirmModal.value = true;
    return;
  }
  updateOrderStatus(order.id, newStatus);
}

function onConfirmCancel() {
  if (orderToCancel.value) {
    updateOrderStatus(orderToCancel.value.id, 'Cancelado');
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

    <!-- Role Restriction Notice (if not admin) -->
    <div
      v-if="!isAdmin"
      class="mb-8 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 p-5 rounded-xl text-amber-900 dark:text-amber-200"
    >
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 class="font-bold text-sm">Acceso Restringido para Administradores</h3>
          <p class="text-xs mt-1">
            Actualmente estás navegando con rol <strong>{{ currentUser ? currentUser.role : 'Invitado' }}</strong>. Para modificar pedidos, estados y existencias, debés ser administrador.
          </p>
        </div>
        <button
          @click="loginAsTestAdmin"
          class="px-4 py-2 bg-[#0C2333] dark:bg-[#48B0DA] text-white dark:text-[#0C2333] font-bold text-xs rounded transition-opacity hover:opacity-90 cursor-pointer"
        >
          ⚡ Ingresar como Admin de Prueba
        </button>
      </div>
    </div>

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
      </div>
    </div>

    <!-- Filter Pills by Status -->
    <div class="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
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

    <!-- Orders Table -->
    <div class="bg-white dark:bg-[#112C3F] rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#F7F4EA] dark:bg-[#081722] text-[#0C2333] dark:text-white uppercase font-bold text-[11px] border-b border-neutral-200 dark:border-neutral-700 tracking-wider">
            <tr>
              <th class="px-4 py-3">Número y Fecha</th>
              <th class="px-4 py-3">Comprador</th>
              <th class="px-4 py-3">Importe Total</th>
              <th class="px-4 py-3">Método de Pago</th>
              <th class="px-4 py-3">Estado</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700 text-slate-700 dark:text-slate-200">
            <tr v-if="filteredOrders.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-slate-500">
                No hay pedidos con el estado seleccionado.
              </td>
            </tr>

            <tr
              v-for="order in filteredOrders"
              :key="order.id"
              class="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
            >
              <!-- Número y Fecha -->
              <td class="px-4 py-3.5 whitespace-nowrap">
                <span class="font-bold text-[#0C2333] dark:text-[#48B0DA] font-mono text-xs">{{ order.id }}</span>
                <span class="block text-[11px] text-slate-500 dark:text-slate-400">{{ formatDate(order.createdAt) }}</span>
              </td>

              <!-- Comprador -->
              <td class="px-4 py-3.5">
                <div class="font-bold truncate max-w-[160px]">{{ order.buyer.name }} {{ order.buyer.lastName }}</div>
                <div class="text-[11px] text-slate-500 truncate max-w-[160px]">{{ order.buyer.email }}</div>
              </td>

              <!-- Importe Total -->
              <td class="px-4 py-3.5 font-bold tabular-nums whitespace-nowrap">
                $ {{ formatPrice(order.total) }}
                <span class="block text-[10px] text-slate-500 font-normal">({{ order.items.length }} camisetas)</span>
              </td>

              <!-- Método de Pago & Comprobante -->
              <td class="px-4 py-3.5 whitespace-nowrap">
                <span class="capitalize font-semibold">{{ order.paymentMethod }}</span>
                <span
                  v-if="order.receiptImage"
                  class="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold"
                  title="Comprobante disponible"
                >
                  📎 Comprobante
                </span>
              </td>

              <!-- Estado -->
              <td class="px-4 py-3.5 whitespace-nowrap">
                <select
                  :value="order.status"
                  :disabled="!isAdmin"
                  @change="(e) => handleStatusChange(order, (e.target as HTMLSelectElement).value as OrderStatus)"
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
              </td>

              <!-- Acciones -->
              <td class="px-4 py-3.5 text-right whitespace-nowrap">
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
                  <img :src="item.image" :alt="item.name" class="w-12 h-12 object-contain" />
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
