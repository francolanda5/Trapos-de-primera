<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  cart,
  cartTotal,
  createOrder,
  updateCartQuantity,
  removeFromCart
} from '../store/useStore';
import { currentUser } from '../store/useAuth';
import type { DeliveryMethod, PaymentMethod, BuyerInfo, Order } from '../types';

const router = useRouter();

// Step indicator (1 to 5)
const currentStep = ref<number>(1);
const isSubmitting = ref<boolean>(false);
const confirmedOrder = ref<Order | null>(null);

// Form state
const buyer = reactive<BuyerInfo>({
  name: currentUser.value ? currentUser.value.name.split(' ')[0] : '',
  lastName: currentUser.value ? currentUser.value.name.split(' ').slice(1).join(' ') : '',
  email: currentUser.value ? currentUser.value.email : '',
  phone: '',
  address: '',
  city: 'CABA',
  postalCode: '1000',
  notes: ''
});

const deliveryMethod = ref<DeliveryMethod>('shipping');
const paymentMethod = ref<PaymentMethod>('mercadopago');
const receiptImage = ref<string>('');
const receiptFileName = ref<string>('');

const errors = reactive<{
  buyerName?: string;
  buyerLastName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  stockError?: string;
}>({});

function resetErrors() {
  errors.buyerName = undefined;
  errors.buyerLastName = undefined;
  errors.buyerEmail = undefined;
  errors.buyerPhone = undefined;
  errors.address = undefined;
  errors.city = undefined;
  errors.postalCode = undefined;
  errors.stockError = undefined;
}

function handleReceiptUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    receiptFileName.value = file.name;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        receiptImage.value = String(uploadEvent.target.result);
      }
    };
    reader.readAsDataURL(file);
  }
}

function validateStep2(): boolean {
  resetErrors();
  let valid = true;

  if (!buyer.name.trim()) {
    errors.buyerName = 'El nombre es obligatorio.';
    valid = false;
  }
  if (!buyer.lastName.trim()) {
    errors.buyerLastName = 'El apellido es obligatorio.';
    valid = false;
  }
  if (!buyer.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email)) {
    errors.buyerEmail = 'Ingresá un correo electrónico válido.';
    valid = false;
  }
  // Formato: opcional + al inicio, y al menos 8 caracteres entre dígitos, espacios, guiones o paréntesis
  if (!/^\+?[\d\s()-]{8,}$/.test(buyer.phone.trim())) {
    errors.buyerPhone = 'Ingresá un teléfono válido (solo números, mínimo 8 dígitos).';
    valid = false;
  }

  return valid;
}

function validateStep3(): boolean {
  resetErrors();
  let valid = true;

  if (deliveryMethod.value === 'shipping') {
    if (!buyer.address?.trim()) {
      errors.address = 'La calle y altura son obligatorias para el envío.';
      valid = false;
    }
    if (!buyer.city?.trim()) {
      errors.city = 'La localidad/ciudad es obligatoria.';
      valid = false;
    }
    if (!buyer.postalCode?.trim()) {
      errors.postalCode = 'El código postal es obligatorio.';
      valid = false;
    }
  }

  return valid;
}

function nextStep() {
  if (currentStep.value === 1) {
    if (cart.value.length === 0) return;
    currentStep.value = 2;
  } else if (currentStep.value === 2) {
    if (validateStep2()) currentStep.value = 3;
  } else if (currentStep.value === 3) {
    if (validateStep3()) currentStep.value = 4;
  } else if (currentStep.value === 4) {
    currentStep.value = 5;
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

async function handleConfirmOrder() {
  if (isSubmitting.value) return; // Prevent double click
  isSubmitting.value = true;
  errors.stockError = undefined;

  try {
    const res = createOrder({
      buyer,
      deliveryMethod: deliveryMethod.value,
      paymentMethod: paymentMethod.value,
      receiptImage: receiptImage.value || undefined
    });

    if (res.success && res.order) {
      confirmedOrder.value = res.order;
      currentStep.value = 5; // Success screen
    } else {
      errors.stockError = res.error || 'Error al procesar el pedido.';
    }
  } finally {
    isSubmitting.value = false;
  }
}

function formatPrice(val: number): string {
  return val.toLocaleString('es-AR');
}
</script>

<template>
  <main class="max-w-4xl mx-auto px-4 sm:px-6 py-8" data-purpose="checkout-flow">
    <!-- Breadcrumbs -->
    <nav class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6">
      <router-link to="/" class="text-[#48B0DA] hover:underline">Inicio</router-link>
      <span>/</span>
      <router-link to="/catalogo" class="text-[#48B0DA] hover:underline">Catálogo</router-link>
      <span>/</span>
      <span class="text-[#0C2333] dark:text-white font-semibold">Proceso de Compra</span>
    </nav>

    <!-- Page Title -->
    <div class="mb-6">
      <div class="flex items-center gap-3">
        <h1 class="font-condensed font-extrabold text-2xl sm:text-3xl uppercase tracking-wider text-[#0C2333] dark:text-white">
          FINALIZAR COMPRA
        </h1>
        <div class="h-[2px] bg-[#D8B15E] flex-1"></div>
      </div>
      <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
        Revisá tus trapos, ingresá tus datos de entrega y elegí tu forma de pago.
      </p>
    </div>

    <!-- Confirmation Success Screen -->
    <section v-if="confirmedOrder" class="bg-white dark:bg-[#112C3F] border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 sm:p-10 text-center shadow-lg">
      <div class="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl font-bold">
        ✓
      </div>
      <span class="text-xs uppercase tracking-widest font-bold text-[#D8B15E]">Pedido Registrado</span>
      <h2 class="font-condensed text-3xl sm:text-4xl font-black text-[#0C2333] dark:text-white uppercase mt-1 mb-2">
        ¡GRACIAS POR TU COMPRA!
      </h2>
      <p class="text-sm font-bold text-[#48B0DA] font-mono text-base mb-4">
        Número de Pedido: {{ confirmedOrder.id }}
      </p>

      <div class="max-w-md mx-auto text-xs text-slate-600 dark:text-slate-300 bg-[#F7F4EA] dark:bg-[#081722] p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 text-left space-y-2 mb-6">
        <p><strong>Comprador:</strong> {{ confirmedOrder.buyer.name }} {{ confirmedOrder.buyer.lastName }}</p>
        <p><strong>Correo:</strong> {{ confirmedOrder.buyer.email }}</p>
        <p><strong>Método de Pago:</strong> <span class="uppercase font-semibold">{{ confirmedOrder.paymentMethod }}</span></p>
        <p><strong>Estado:</strong> <span class="bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 px-2 py-0.5 rounded font-bold">Pendiente de revisión</span></p>
        <p><strong>Total:</strong> <span class="font-bold text-[#0C2333] dark:text-white tabular-nums">$ {{ formatPrice(confirmedOrder.total) }}</span></p>
      </div>

      <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
        Tu pedido ha sido guardado en el sistema con estado <strong>Pendiente</strong> y el stock de las camisetas ya fue descontado. Podés seguir el estado desde el panel de administración o tu perfil.
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <router-link
          to="/mis-pedidos"
          class="px-5 py-2.5 bg-[#48B0DA] hover:bg-[#3ca0c9] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-xs"
        >
          Ver en Mis Pedidos →
        </router-link>
        <router-link
          to="/catalogo"
          class="px-5 py-2.5 bg-transparent border border-[#0C2333] dark:border-white text-[#0C2333] dark:text-white font-bold text-xs uppercase tracking-wider rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          Volver a la tienda
        </router-link>
      </div>
    </section>

    <!-- 5-Step Checkout Container -->
    <div v-else>
      <!-- Stepper Header -->
      <div class="grid grid-cols-5 gap-1 sm:gap-2 mb-8 text-center text-[10px] sm:text-xs font-bold">
        <div
          class="py-2 border-b-2 transition-colors"
          :class="currentStep >= 1 ? 'border-[#48B0DA] text-[#48B0DA]' : 'border-neutral-300 text-slate-400'"
        >
          1. Revisión
        </div>
        <div
          class="py-2 border-b-2 transition-colors"
          :class="currentStep >= 2 ? 'border-[#48B0DA] text-[#48B0DA]' : 'border-neutral-300 text-slate-400'"
        >
          2. Comprador
        </div>
        <div
          class="py-2 border-b-2 transition-colors"
          :class="currentStep >= 3 ? 'border-[#48B0DA] text-[#48B0DA]' : 'border-neutral-300 text-slate-400'"
        >
          3. Entrega
        </div>
        <div
          class="py-2 border-b-2 transition-colors"
          :class="currentStep >= 4 ? 'border-[#48B0DA] text-[#48B0DA]' : 'border-neutral-300 text-slate-400'"
        >
          4. Pago
        </div>
        <div
          class="py-2 border-b-2 transition-colors"
          :class="currentStep >= 5 ? 'border-[#48B0DA] text-[#48B0DA]' : 'border-neutral-300 text-slate-400'"
        >
          5. Confirmar
        </div>
      </div>

      <!-- Stock Alert / Error Box -->
      <div v-if="errors.stockError" class="mb-6 p-4 rounded bg-red-100 dark:bg-red-950/60 border border-red-300 text-red-800 dark:text-red-200 text-xs font-bold">
        ⚠️ {{ errors.stockError }}
      </div>

      <!-- STEP 1: Revisión de Productos, Talles y Cantidades -->
      <section v-if="currentStep === 1" class="bg-white dark:bg-[#112C3F] border border-neutral-200 dark:border-neutral-700 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <h2 class="font-condensed text-xl font-bold uppercase text-[#0C2333] dark:text-white">
          Paso 1: Revisión de Productos
        </h2>

        <div v-if="cart.length === 0" class="text-center py-10">
          <p class="text-slate-500 mb-4">No tenés camisetas en el carrito.</p>
          <router-link to="/catalogo" class="px-4 py-2 bg-[#48B0DA] text-white text-xs font-bold rounded">
            Explorar catálogo →
          </router-link>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in cart"
            :key="item.id"
            class="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2 p-3 bg-[#F7F4EA] dark:bg-[#081722] rounded-lg border border-neutral-200 dark:border-neutral-700"
          >
            <img :src="item.jersey.image" :alt="item.jersey.name" class="w-16 h-16 object-contain rounded shrink-0" loading="lazy" />
            <!-- En celular el texto ocupa la fila junto a la imagen, y los controles bajan a la siguiente -->
            <div class="flex-1 min-w-[calc(100%-5rem)] sm:min-w-0">
              <h3 class="font-bold text-sm text-[#0C2333] dark:text-white truncate">{{ item.jersey.name }}</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Talle: <span class="font-bold text-[#0C2333] dark:text-[#48B0DA]">{{ item.size }}</span> · Stock disponible: {{ item.jersey.sizeStock[item.size] }}
              </p>
              <p class="text-xs font-bold text-[#0C2333] dark:text-white mt-1 tabular-nums">
                $ {{ formatPrice(item.jersey.price) }} x {{ item.quantity }} = $ {{ formatPrice(item.jersey.price * item.quantity) }}
              </p>
            </div>

            <!-- Stepper -->
            <div class="flex items-center gap-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-[#112C3F] overflow-hidden">
              <button
                @click="updateCartQuantity(item.id, -1)"
                aria-label="Restar una unidad"
                class="px-2 py-1 text-xs text-slate-600 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
              >
                -
              </button>
              <span class="px-2 text-xs font-bold">{{ item.quantity }}</span>
              <button
                @click="updateCartQuantity(item.id, 1)"
                aria-label="Sumar una unidad"
                class="px-2 py-1 text-xs text-slate-600 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
              >
                +
              </button>
            </div>

            <button
              @click="removeFromCart(item.id)"
              aria-label="Quitar del carrito"
              class="text-xs text-red-500 hover:underline p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div class="pt-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center text-sm font-bold">
            <span class="text-slate-600 dark:text-slate-300">Total parcial:</span>
            <span class="text-xl text-[#0C2333] dark:text-[#48B0DA] tabular-nums">$ {{ formatPrice(cartTotal) }}</span>
          </div>

          <div class="flex justify-end pt-2">
            <button
              @click="nextStep"
              class="px-6 py-2.5 bg-[#48B0DA] hover:bg-[#3ca0c9] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-xs cursor-pointer"
            >
              Continuar a Datos del Comprador →
            </button>
          </div>
        </div>
      </section>

      <!-- STEP 2: Datos del Comprador -->
      <section v-if="currentStep === 2" class="bg-white dark:bg-[#112C3F] border border-neutral-200 dark:border-neutral-700 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <h2 class="font-condensed text-xl font-bold uppercase text-[#0C2333] dark:text-white">
          Paso 2: Datos del Comprador
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="buyer-name" class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1">Nombre *</label>
            <input
              id="buyer-name"
              v-model="buyer.name"
              type="text"
              class="w-full text-xs bg-[#F7F4EA] dark:bg-[#081722] border rounded px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
              :class="errors.buyerName ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'"
            />
            <p v-if="errors.buyerName" class="text-[11px] text-red-500 font-semibold mt-1">{{ errors.buyerName }}</p>
          </div>

          <div>
            <label for="buyer-lastname" class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1">Apellido *</label>
            <input
              id="buyer-lastname"
              v-model="buyer.lastName"
              type="text"
              class="w-full text-xs bg-[#F7F4EA] dark:bg-[#081722] border rounded px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
              :class="errors.buyerLastName ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'"
            />
            <p v-if="errors.buyerLastName" class="text-[11px] text-red-500 font-semibold mt-1">{{ errors.buyerLastName }}</p>
          </div>

          <div>
            <label for="buyer-email" class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1">Correo Electrónico *</label>
            <input
              id="buyer-email"
              v-model="buyer.email"
              type="email"
              class="w-full text-xs bg-[#F7F4EA] dark:bg-[#081722] border rounded px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
              :class="errors.buyerEmail ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'"
            />
            <p v-if="errors.buyerEmail" class="text-[11px] text-red-500 font-semibold mt-1">{{ errors.buyerEmail }}</p>
          </div>

          <div>
            <label for="buyer-phone" class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1">Teléfono / WhatsApp *</label>
            <input
              id="buyer-phone"
              v-model="buyer.phone"
              type="tel"
              placeholder="+54 11 ..."
              class="w-full text-xs bg-[#F7F4EA] dark:bg-[#081722] border rounded px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
              :class="errors.buyerPhone ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'"
            />
            <p v-if="errors.buyerPhone" class="text-[11px] text-red-500 font-semibold mt-1">{{ errors.buyerPhone }}</p>
          </div>
        </div>

        <div class="flex justify-between items-center pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <button @click="prevStep" class="text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline">
            ← Volver a productos
          </button>
          <button
            @click="nextStep"
            class="px-6 py-2.5 bg-[#48B0DA] hover:bg-[#3ca0c9] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-xs cursor-pointer"
          >
            Continuar a Entrega →
          </button>
        </div>
      </section>

      <!-- STEP 3: Modalidad de Entrega y Dirección -->
      <section v-if="currentStep === 3" class="bg-white dark:bg-[#112C3F] border border-neutral-200 dark:border-neutral-700 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <h2 class="font-condensed text-xl font-bold uppercase text-[#0C2333] dark:text-white">
          Paso 3: Modalidad de Entrega
        </h2>

        <!-- Radio selector de entrega -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            class="p-4 rounded-lg border-2 cursor-pointer flex items-start gap-3 transition-colors"
            :class="deliveryMethod === 'shipping' ? 'border-[#48B0DA] bg-blue-50/30 dark:bg-blue-950/20' : 'border-neutral-300 dark:border-neutral-600'"
          >
            <input type="radio" v-model="deliveryMethod" value="shipping" class="mt-0.5 text-[#48B0DA]" />
            <div>
              <p class="font-bold text-xs text-[#0C2333] dark:text-white">Envío a domicilio</p>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">Correo Argentino / Andreani a todo el país.</p>
              <p class="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">¡GRATIS!</p>
            </div>
          </label>

          <label
            class="p-4 rounded-lg border-2 cursor-pointer flex items-start gap-3 transition-colors"
            :class="deliveryMethod === 'pickup' ? 'border-[#48B0DA] bg-blue-50/30 dark:bg-blue-950/20' : 'border-neutral-300 dark:border-neutral-600'"
          >
            <input type="radio" v-model="deliveryMethod" value="pickup" class="mt-0.5 text-[#48B0DA]" />
            <div>
              <p class="font-bold text-xs text-[#0C2333] dark:text-white">Retiro en local</p>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">Av. Corrientes 1234, CABA (Lu a Vi 10 a 19hs).</p>
              <p class="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">Sin costo</p>
            </div>
          </label>
        </div>

        <!-- Campos de dirección si es envío a domicilio -->
        <div v-if="deliveryMethod === 'shipping'" class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div class="sm:col-span-2">
            <label for="buyer-address" class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1">Calle y Altura *</label>
            <input
              id="buyer-address"
              v-model="buyer.address"
              type="text"
              placeholder="Ej: Av. San Martín 450, Piso 2"
              class="w-full text-xs bg-[#F7F4EA] dark:bg-[#081722] border rounded px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
              :class="errors.address ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'"
            />
            <p v-if="errors.address" class="text-[11px] text-red-500 font-semibold mt-1">{{ errors.address }}</p>
          </div>

          <div>
            <label for="buyer-postal" class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1">Código Postal *</label>
            <input
              id="buyer-postal"
              v-model="buyer.postalCode"
              type="text"
              class="w-full text-xs bg-[#F7F4EA] dark:bg-[#081722] border rounded px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
              :class="errors.postalCode ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'"
            />
            <p v-if="errors.postalCode" class="text-[11px] text-red-500 font-semibold mt-1">{{ errors.postalCode }}</p>
          </div>

          <div class="sm:col-span-3">
            <label for="buyer-city" class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1">Ciudad / Provincia *</label>
            <input
              id="buyer-city"
              v-model="buyer.city"
              type="text"
              class="w-full text-xs bg-[#F7F4EA] dark:bg-[#081722] border rounded px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
              :class="errors.city ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'"
            />
            <p v-if="errors.city" class="text-[11px] text-red-500 font-semibold mt-1">{{ errors.city }}</p>
          </div>
        </div>

        <div class="flex justify-between items-center pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <button @click="prevStep" class="text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline">
            ← Volver a datos
          </button>
          <button
            @click="nextStep"
            class="px-6 py-2.5 bg-[#48B0DA] hover:bg-[#3ca0c9] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-xs cursor-pointer"
          >
            Continuar a Método de Pago →
          </button>
        </div>
      </section>

      <!-- STEP 4: Elección del Método de Pago y Comprobante -->
      <section v-if="currentStep === 4" class="bg-white dark:bg-[#112C3F] border border-neutral-200 dark:border-neutral-700 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <h2 class="font-condensed text-xl font-bold uppercase text-[#0C2333] dark:text-white">
          Paso 4: Método de Pago
        </h2>

        <p class="text-xs text-slate-600 dark:text-slate-300">
          Seleccioná tu método de pago preferido. El pedido se registrará con estado <strong>Pendiente</strong> para revisión manual administrativa.
        </p>

        <!-- Payment options -->
        <div class="space-y-3">
          <!-- Mercado Pago -->
          <label
            class="p-4 rounded-lg border-2 cursor-pointer flex items-start gap-3 transition-colors block"
            :class="paymentMethod === 'mercadopago' ? 'border-[#48B0DA] bg-blue-50/30 dark:bg-blue-950/20' : 'border-neutral-300 dark:border-neutral-600'"
          >
            <input type="radio" v-model="paymentMethod" value="mercadopago" class="mt-0.5 text-[#48B0DA]" />
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-xs text-[#0C2333] dark:text-white">Mercado Pago (Transferencia / CVU)</span>
                <span class="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 px-2 py-0.5 rounded font-bold">Alias: trapos.primera.mp</span>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Transferí a nuestro alias y adjuntá tu comprobante para agilizar el despacho.
              </p>
            </div>
          </label>

          <!-- Tarjeta -->
          <label
            class="p-4 rounded-lg border-2 cursor-pointer flex items-start gap-3 transition-colors block"
            :class="paymentMethod === 'tarjeta' ? 'border-[#48B0DA] bg-blue-50/30 dark:bg-blue-950/20' : 'border-neutral-300 dark:border-neutral-600'"
          >
            <input type="radio" v-model="paymentMethod" value="tarjeta" class="mt-0.5 text-[#48B0DA]" />
            <div class="flex-1">
              <span class="font-bold text-xs text-[#0C2333] dark:text-white">Tarjeta de Débito / Crédito</span>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Hasta 3 cuotas fijas sin interés. Recibirás un enlace de pago seguro para abonar.
              </p>
            </div>
          </label>

          <!-- Efectivo -->
          <label
            class="p-4 rounded-lg border-2 cursor-pointer flex items-start gap-3 transition-colors block"
            :class="paymentMethod === 'efectivo' ? 'border-[#48B0DA] bg-blue-50/30 dark:bg-blue-950/20' : 'border-neutral-300 dark:border-neutral-600'"
          >
            <input type="radio" v-model="paymentMethod" value="efectivo" class="mt-0.5 text-[#48B0DA]" />
            <div class="flex-1">
              <span class="font-bold text-xs text-[#0C2333] dark:text-white">Efectivo contra entrega / Retiro</span>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Pagás al momento de retirar en local o recibir en CABA. No requiere comprobante previo.
              </p>
            </div>
          </label>
        </div>

        <!-- Carga de comprobante (opcional para Mercado Pago y Tarjeta) -->
        <div v-if="paymentMethod !== 'efectivo'" class="pt-3 border-t border-neutral-200 dark:border-neutral-700">
          <label class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1">
            Comprobante de Pago (Opcional)
          </label>
          <div class="flex items-center gap-3">
            <label class="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-[#F7F4EA] dark:bg-[#081722] text-xs font-semibold hover:border-[#48B0DA] cursor-pointer">
              <input type="file" accept="image/*,.pdf" @change="handleReceiptUpload" class="hidden" />
              📎 {{ receiptFileName ? 'Cambiar comprobante' : 'Adjuntar imagen o PDF' }}
            </label>
            <span v-if="receiptFileName" class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ {{ receiptFileName }}
            </span>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Se almacena en base64 para que el administrador pueda revisarlo en el panel de pedidos.
          </p>
        </div>

        <div class="flex justify-between items-center pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <button @click="prevStep" class="text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline">
            ← Volver a entrega
          </button>
          <button
            @click="nextStep"
            class="px-6 py-2.5 bg-[#48B0DA] hover:bg-[#3ca0c9] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-xs cursor-pointer"
          >
            Continuar a Resumen y Confirmación →
          </button>
        </div>
      </section>

      <!-- STEP 5: Resumen y Confirmación Final -->
      <section v-if="currentStep === 5 && !confirmedOrder" class="bg-white dark:bg-[#112C3F] border border-neutral-200 dark:border-neutral-700 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <h2 class="font-condensed text-xl font-bold uppercase text-[#0C2333] dark:text-white">
          Paso 5: Resumen y Confirmación
        </h2>

        <!-- Resumen de datos -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#F7F4EA] dark:bg-[#081722] p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div>
            <h3 class="font-bold text-[#0C2333] dark:text-[#48B0DA] uppercase mb-1">Comprador</h3>
            <p>{{ buyer.name }} {{ buyer.lastName }}</p>
            <p>{{ buyer.email }}</p>
            <p>{{ buyer.phone }}</p>
          </div>
          <div>
            <h3 class="font-bold text-[#0C2333] dark:text-[#48B0DA] uppercase mb-1">Entrega & Pago</h3>
            <p><strong>Modalidad:</strong> {{ deliveryMethod === 'shipping' ? `Envío a domicilio (${buyer.address}, ${buyer.city})` : 'Retiro en local' }}</p>
            <p><strong>Pago:</strong> <span class="uppercase">{{ paymentMethod }}</span> (Pendiente de revisión)</p>
            <p v-if="receiptFileName"><strong>Comprobante:</strong> Adjuntado ({{ receiptFileName }})</p>
          </div>
        </div>

        <!-- Lista de Items -->
        <div class="space-y-2">
          <h3 class="font-bold text-xs uppercase text-[#0C2333] dark:text-white">Detalle de Camisetas</h3>
          <div
            v-for="item in cart"
            :key="item.id"
            class="flex items-center justify-between text-xs py-1.5 border-b border-neutral-200 dark:border-neutral-700"
          >
            <span>{{ item.jersey.name }} (Talle {{ item.size }}) x {{ item.quantity }}</span>
            <span class="font-bold tabular-nums">$ {{ formatPrice(item.jersey.price * item.quantity) }}</span>
          </div>

          <div class="flex justify-between items-center text-sm font-extrabold text-[#0C2333] dark:text-white pt-2">
            <span>TOTAL A ABONAR:</span>
            <span class="text-xl text-[#48B0DA] tabular-nums">$ {{ formatPrice(cartTotal) }}</span>
          </div>
        </div>

        <div class="flex justify-between items-center pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <button @click="prevStep" class="text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline">
            ← Modificar forma de pago
          </button>
          <button
            @click="handleConfirmOrder"
            :disabled="isSubmitting"
            class="px-8 py-3 bg-[#0C2333] dark:bg-[#48B0DA] hover:bg-[#13354d] dark:hover:bg-[#3ca0c9] text-white dark:text-[#0C2333] font-black text-xs sm:text-sm uppercase tracking-wider rounded shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <span v-if="isSubmitting">Procesando pedido...</span>
            <span v-else>Confirmar Pedido Ahora →</span>
          </button>
        </div>
      </section>
    </div>
  </main>
</template>
