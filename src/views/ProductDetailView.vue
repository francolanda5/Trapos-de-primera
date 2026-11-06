<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  getJerseyById,
  jerseys,
  jerseysReady,
  addToCart,
  toggleFavorite,
  isFavorite
} from '../store/useStore';
import { isAdmin } from '../store/useAuth';
import { SIZE_GUIDE } from '../data/sizeGuide';
import type { Jersey } from '../types';

const route = useRoute();
const router = useRouter();

const jersey = ref<Jersey | null>(null);
const activeImageIndex = ref<number>(0);
const selectedSize = ref<string>('M');
const quantity = ref<number>(1);
const addedToCartSuccess = ref<string | null>(null);

async function loadProduct() {
  const id = String(route.params.id);
  let found = getJerseyById(id);
  if (!found) {
    // Con Supabase, una camiseta creada en otro dispositivo llega recién cuando termina de cargar el catálogo
    await jerseysReady;
    found = getJerseyById(id);
  }
  if (found) {
    jersey.value = found;
    activeImageIndex.value = 0;
    // Seleccionar por defecto el primer talle que tenga stock si es posible
    const inStockSize = found.sizes.find((s) => (found.sizeStock[s] || 0) > 0) || found.sizes[0] || 'M';
    selectedSize.value = inStockSize;
    quantity.value = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    router.replace('/catalogo');
  }
}

onMounted(() => {
  loadProduct();
});

watch(
  () => route.params.id,
  () => {
    loadProduct();
  }
);

// Stock del talle actualmente seleccionado
const currentSizeStock = computed(() => {
  if (!jersey.value) return 0;
  return jersey.value.sizeStock[selectedSize.value] ?? 0;
});

const isCurrentSizeOutOfStock = computed(() => currentSizeStock.value <= 0);

// Ajustar cantidad si excede el stock del nuevo talle seleccionado
watch(selectedSize, () => {
  if (quantity.value > currentSizeStock.value && currentSizeStock.value > 0) {
    quantity.value = currentSizeStock.value;
  } else if (quantity.value < 1 && currentSizeStock.value > 0) {
    quantity.value = 1;
  }
});

// Galería: la primera vista siempre es `image`, así una camiseta creada a mano funciona con una
// sola imagen y, si el administrador cambia la foto, la galería muestra la nueva.
const gallery = computed(() => {
  if (!jersey.value) return [];
  return [jersey.value.image, ...(jersey.value.galleryImages ?? []).slice(1)];
});

const currentImage = computed(() => gallery.value[activeImageIndex.value] ?? '');

function viewLabel(index: number): string {
  return ['Frente', 'Espalda', 'Detalle'][index] ?? `Vista ${index + 1}`;
}

// Pasa a otra vista. El módulo hace que después de la última se vuelva a la primera.
function showImage(index: number) {
  const total = gallery.value.length;
  if (total > 0) activeImageIndex.value = (index + total) % total;
}

// Deslizar en el celular: cuenta solo un gesto horizontal de al menos 40 px.
const SWIPE_MIN_PX = 40;
let touchStartX = 0;
let touchStartY = 0;

function onTouchStart(event: TouchEvent) {
  touchStartX = event.changedTouches[0].clientX;
  touchStartY = event.changedTouches[0].clientY;
}

function onTouchEnd(event: TouchEvent) {
  const deltaX = event.changedTouches[0].clientX - touchStartX;
  const deltaY = event.changedTouches[0].clientY - touchStartY;
  if (Math.abs(deltaX) < SWIPE_MIN_PX || Math.abs(deltaX) <= Math.abs(deltaY)) return;
  showImage(activeImageIndex.value + (deltaX < 0 ? 1 : -1));
}

function decreaseQuantity() {
  if (quantity.value > 1) {
    quantity.value--;
  }
}

function increaseQuantity() {
  if (jersey.value && quantity.value < currentSizeStock.value) {
    quantity.value++;
  }
}

function handleAddToCart() {
  if (!jersey.value || isCurrentSizeOutOfStock.value) return;
  const res = addToCart(jersey.value, selectedSize.value, quantity.value);
  if (res.success) {
    addedToCartSuccess.value = `✓ ¡Agregada en talle ${selectedSize.value}!`;
  } else {
    addedToCartSuccess.value = res.error || 'No se pudo agregar al carrito';
  }
  setTimeout(() => {
    addedToCartSuccess.value = null;
  }, 2200);
}

// Productos relacionados
const relatedJerseys = computed(() => {
  if (!jersey.value) return [];
  return jerseys.value
    .filter((j) => j.id !== jersey.value?.id && (j.team === jersey.value?.team || j.category === jersey.value?.category))
    .slice(0, 3);
});

function formatPrice(val: number): string {
  return val.toLocaleString('es-AR');
}
</script>

<template>
  <main v-if="jersey" class="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-slate-800 dark:text-neutral-100" data-purpose="product-detail-page">
    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb" class="text-xs text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
      <router-link to="/" class="hover:underline text-[#48B0DA]">Inicio</router-link>
      <span>/</span>
      <router-link :to="{ path: '/catalogo', query: { categoria: jersey.category } }" class="hover:underline text-[#48B0DA]">
        {{ jersey.category }}
      </router-link>
      <span>/</span>
      <span class="text-[#0C2333] dark:text-white font-semibold">{{ jersey.name }}</span>
    </nav>

    <!-- BEGIN: ProductSection -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start pb-8">
      <!-- Columna Izquierda: Galería de Producto -->
      <div class="lg:col-span-6 flex flex-col lg:flex-row-reverse lg:items-start gap-3">
        <!-- Imagen Principal -->
        <div
          class="relative w-full lg:flex-1 lg:min-w-0 bg-[#EFECE1] dark:bg-[#112C3F] border border-[#E2DEC6] dark:border-neutral-700 rounded-md shadow-xs jersey-frame touch-pan-y"
          data-purpose="gallery-main"
          @touchstart.passive="onTouchStart"
          @touchend.passive="onTouchEnd"
        >
          <!-- La key hace que Vue vea una imagen nueva y aplique el fundido entre las dos -->
          <transition name="gallery-fade">
            <img
              :key="currentImage"
              :src="currentImage"
              :alt="`${jersey.name}: ${viewLabel(activeImageIndex).toLowerCase()}`"
              class="jersey-image absolute inset-0"
            />
          </transition>
        </div>

        <!-- Miniaturas: debajo en celular y al costado en escritorio. Con una sola imagen no hacen falta -->
        <div v-if="gallery.length > 1" class="grid grid-cols-3 gap-2.5 max-w-xs lg:grid-cols-1 lg:w-20 lg:shrink-0" role="group" aria-label="Vistas de la camiseta" data-purpose="gallery-thumbs">
          <button
            v-for="(image, index) in gallery"
            :key="index"
            type="button"
            :aria-label="`Ver ${viewLabel(index).toLowerCase()}`"
            :aria-pressed="index === activeImageIndex"
            class="jersey-frame bg-[#EFECE1] dark:bg-[#112C3F] rounded transition-all cursor-pointer"
            :class="index === activeImageIndex ? 'ring-2 ring-[#48B0DA] shadow-xs' : 'ring-1 ring-[#DCD6C0] dark:ring-neutral-700 hover:ring-gray-400'"
            @click="showImage(index)"
          >
            <img :src="image" alt="" class="jersey-image" />
          </button>
        </div>
      </div>

      <!-- Columna Derecha: Información y Compra -->
      <div class="lg:col-span-6 flex flex-col justify-start">
        <!-- Header de producto: Badge RETRO / ACTUAL y barra dorada -->
        <div class="flex items-center gap-3 mb-1">
          <span
            class="font-sport font-bold tracking-wider text-sm uppercase"
            :class="jersey.era === 'Retro' ? 'text-[#D8B15E]' : 'text-[#48B0DA]'"
          >
            {{ jersey.era }}
          </span>
          <div class="h-[1.5px] bg-[#D8B15E] flex-1"></div>
          <router-link
            v-if="isAdmin"
            :to="`/admin/editar/${jersey.id}`"
            class="text-[11px] font-bold text-[#0C2333] dark:text-[#48B0DA] hover:underline flex items-center gap-1 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-0.5"
            title="Editar existencias y datos de este producto"
          >
            ✏️ Editar stock
          </router-link>
        </div>

        <!-- Nombre del Producto -->
        <h1 class="text-3xl sm:text-4xl font-extrabold text-[#0C2333] dark:text-white font-display uppercase tracking-wide leading-tight">
          {{ jersey.name }}
        </h1>

        <!-- Subtítulo -->
        <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium mt-0.5">
          Camiseta {{ jersey.type.toLowerCase() }} · {{ jersey.garmentType }}
        </p>

        <!-- Precio -->
        <div class="mt-4 flex items-baseline">
          <span class="text-3xl sm:text-4xl font-bold font-sport text-[#0C2333] dark:text-[#48B0DA] tracking-tight tabular-nums">
            $ {{ formatPrice(jersey.price) }}
          </span>
        </div>

        <!-- Disponibilidad dinámica por talle -->
        <div class="flex items-center gap-2 mt-2 text-xs font-semibold">
          <span
            class="w-2.5 h-2.5 rounded-full inline-block"
            :class="!isCurrentSizeOutOfStock ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'"
          ></span>
          <span v-if="!isCurrentSizeOutOfStock" class="text-slate-800 dark:text-slate-200">
            Stock en talle <strong>{{ selectedSize }}</strong>: {{ currentSizeStock }} unidades disponibles (Total: {{ jersey.stock }})
          </span>
          <span v-else class="text-red-600 dark:text-red-400 font-bold">
            Agotado en talle {{ selectedSize }}
          </span>
        </div>

        <!-- Descripción corta -->
        <p class="text-xs sm:text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed mt-4 font-normal">
          {{ jersey.description }}
        </p>

        <!-- Selector de Talle con estados de stock independiente -->
        <div class="mt-5">
          <div class="flex items-center justify-between text-xs font-bold mb-2">
            <span class="text-[#0C2333] dark:text-white uppercase">Elegí tu talle</span>
            <router-link to="/guia-de-talles" class="text-[#48B0DA] flex items-center gap-1 font-semibold hover:underline">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
              </svg>
              Guía de talles
            </router-link>
          </div>

          <div class="flex items-center gap-2 flex-wrap" role="group">
            <button
              v-for="s in jersey.sizes"
              :key="s"
              type="button"
              @click="selectedSize = s"
              class="w-12 h-11 text-xs font-bold rounded flex flex-col items-center justify-center transition-all cursor-pointer relative"
              :class="[
                selectedSize === s
                  ? 'border-2 border-[#48B0DA] bg-[#48B0DA] text-white shadow-xs'
                  : (jersey.sizeStock[s] || 0) > 0
                  ? 'border border-[#C5BFAB] dark:border-neutral-700 bg-[#F7F4EA] dark:bg-[#112C3F] text-[#0C2333] dark:text-neutral-200 hover:bg-[#EFECE1]'
                  : 'border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800/60 text-slate-400 dark:text-neutral-500 line-through'
              ]"
              :title="(jersey.sizeStock[s] || 0) > 0 ? `Talle ${s}: ${jersey.sizeStock[s]} unidades` : `Talle ${s}: Agotado`"
            >
              <span>{{ s }}</span>
              <span class="text-[9px] font-mono leading-none font-normal" :class="selectedSize === s ? 'text-white/80' : 'text-slate-400'">
                {{ (jersey.sizeStock[s] || 0) > 0 ? `${jersey.sizeStock[s]}u` : '0' }}
              </span>
            </button>
          </div>
        </div>

        <!-- Cantidad (con límite en stock de talle) -->
        <div class="mt-4">
          <label class="block text-xs font-bold uppercase text-[#0C2333] dark:text-white mb-2">Cantidad</label>
          <div class="inline-flex items-center border border-[#C5BFAB] dark:border-neutral-700 rounded bg-[#F7F4EA] dark:bg-[#112C3F] overflow-hidden">
            <button
              @click="decreaseQuantity"
              :disabled="quantity <= 1 || isCurrentSizeOutOfStock"
              type="button"
              class="px-3.5 py-1.5 text-base font-bold text-[#0C2333] dark:text-white hover:bg-[#EFECE1] dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors cursor-pointer"
            >
              -
            </button>
            <span class="px-4 py-1.5 text-xs font-bold text-[#0C2333] dark:text-white min-w-[32px] text-center border-x border-[#C5BFAB] dark:border-neutral-700">
              {{ isCurrentSizeOutOfStock ? 0 : quantity }}
            </span>
            <button
              @click="increaseQuantity"
              :disabled="quantity >= currentSizeStock || isCurrentSizeOutOfStock"
              type="button"
              class="px-3.5 py-1.5 text-base font-bold text-[#0C2333] dark:text-white hover:bg-[#EFECE1] dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors cursor-pointer"
            >
              +
            </button>
          </div>
          <span v-if="currentSizeStock > 0" class="text-[11px] text-slate-500 dark:text-slate-400 ml-3">
            Máximo: {{ currentSizeStock }} unidades
          </span>
        </div>

        <!-- Botones de Acción -->
        <div class="mt-5 space-y-2.5">
          <button
            @click="handleAddToCart"
            :disabled="isCurrentSizeOutOfStock"
            type="button"
            class="w-full font-bold py-3 px-4 rounded text-xs sm:text-sm tracking-wide uppercase flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            :class="[
              !isCurrentSizeOutOfStock
                ? 'bg-[#48B0DA] hover:bg-[#3ca0c9] text-white'
                : 'bg-neutral-300 dark:bg-neutral-800 text-slate-500 cursor-not-allowed'
            ]"
          >
            <svg class="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            <span>{{ isCurrentSizeOutOfStock ? `Talle ${selectedSize} Agotado` : (addedToCartSuccess || 'Agregar al carrito') }}</span>
          </button>

          <button
            @click="toggleFavorite(jersey.id)"
            type="button"
            class="w-full bg-transparent hover:bg-[#EFECE1] dark:hover:bg-[#112C3F] border border-[#0C2333] dark:border-neutral-600 text-[#0C2333] dark:text-white font-bold py-2.5 px-4 rounded text-xs sm:text-sm tracking-wide uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <svg
              class="w-4 h-4 stroke-[2]"
              :class="isFavorite(jersey.id) ? 'fill-red-500 text-red-500' : 'fill-none'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            <span>{{ isFavorite(jersey.id) ? 'En tus favoritos' : 'Guardar en favoritos' }}</span>
          </button>
        </div>

        <!-- Mini Ficha Técnica en Línea -->
        <div class="mt-6 border-t border-[#E2DEC6] dark:border-neutral-700 pt-4 space-y-2 text-xs">
          <div class="flex items-center justify-between py-1 border-b border-[#EAE6D2] dark:border-neutral-800">
            <span class="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-medium">
              Temporada:
            </span>
            <span class="font-bold text-[#0C2333] dark:text-white">{{ jersey.season }}</span>
          </div>

          <div class="flex items-center justify-between py-1 border-b border-[#EAE6D2] dark:border-neutral-800">
            <span class="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-medium">
              Tipo de prenda:
            </span>
            <span class="font-bold text-[#0C2333] dark:text-white">{{ jersey.garmentType }}</span>
          </div>

          <div class="flex items-center justify-between py-1">
            <span class="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-medium">
              Categoría:
            </span>
            <span class="font-bold text-[#0C2333] dark:text-white">{{ jersey.category }}</span>
          </div>
        </div>
      </div>
    </section>
    <!-- END: ProductSection -->

    <!-- BEGIN: HistoricalBanner (Si tiene datos históricos) -->
    <section v-if="jersey.historyNote" class="my-8 border-y-2 border-[#E2DEC6] dark:border-neutral-700 py-6" data-purpose="history-block">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <!-- Año Grande -->
        <div class="md:col-span-3 flex items-center justify-between md:justify-center pr-0 md:pr-4 md:border-r-2 border-[#D8B15E]">
          <span class="text-7xl sm:text-8xl font-black font-year-big text-[#0C2333] dark:text-[#48B0DA] tracking-tighter">
            {{ jersey.historyNote.year }}
          </span>
        </div>

        <!-- Texto Histórico -->
        <div class="md:col-span-5 px-1">
          <h2 class="text-xl sm:text-2xl font-bold font-display text-[#0C2333] dark:text-white uppercase tracking-wide">
            {{ jersey.historyNote.title }}
          </h2>
          <p class="text-xs sm:text-[13px] font-semibold text-[#0C2333] dark:text-neutral-200 mt-1 mb-2">
            {{ jersey.historyNote.subtitle }}
          </p>
          <p class="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-normal">
            {{ jersey.historyNote.text }}
          </p>
        </div>

        <!-- Foto histórica -->
        <div class="md:col-span-4 overflow-hidden rounded shadow-xs border border-[#DCD6C0] dark:border-neutral-700">
          <img
            :src="jersey.historyNote.photo"
            :alt="jersey.historyNote.title"
            class="w-full h-44 object-cover"
          />
        </div>
      </div>
    </section>
    <!-- END: HistoricalBanner -->

    <!-- BEGIN: AccordionSection -->
    <section class="space-y-3 mb-12" data-purpose="accordion-tabs">
      <details class="group bg-[#EFECE1] dark:bg-[#112C3F] border border-[#E2DEC6] dark:border-neutral-700 rounded overflow-hidden" open>
        <summary class="flex items-center justify-between p-3.5 cursor-pointer list-none select-none font-bold text-xs uppercase tracking-wider text-[#0C2333] dark:text-white">
          <span>DETALLES DE CONFECCIÓN</span>
          <span class="text-base font-bold transition group-open:rotate-45 text-[#0C2333] dark:text-white">+</span>
        </summary>
        <div class="px-5 pb-4 text-xs text-gray-700 dark:text-gray-300 leading-relaxed border-t border-[#E2DEC6]/60 dark:border-neutral-700/60 pt-3">
          Camiseta confeccionada en pique de poliéster de alto gramaje con cuello redondo elástizado. Logotipo de época flocado y escudo bordado en hilo premium con terminaciones de calidad histórica de colección.
        </div>
      </details>

      <details class="group bg-[#EFECE1] dark:bg-[#112C3F] border border-[#E2DEC6] dark:border-neutral-700 rounded overflow-hidden" open>
        <summary class="flex items-center justify-between p-3.5 cursor-pointer list-none select-none font-bold text-xs uppercase tracking-wider text-[#0C2333] dark:text-white">
          <span>TALLES Y MEDIDAS (GUÍA OFICIAL)</span>
          <span class="text-base font-bold transition group-open:rotate-45 text-[#0C2333] dark:text-white">+</span>
        </summary>
        <div class="px-5 pb-4 text-xs text-gray-700 dark:text-gray-300 leading-relaxed border-t border-[#E2DEC6]/60 dark:border-neutral-700/60 pt-3">
          <ul class="space-y-1 font-mono">
            <li v-for="row in SIZE_GUIDE" :key="row.size">
              <strong>{{ row.size }}:</strong> {{ row.chestCm }} cm de axila a axila x {{ row.lengthCm }} cm de largo ({{ jersey.sizeStock[row.size] ?? 0 }} disponibles)
            </li>
          </ul>
        </div>
      </details>
    </section>

    <!-- BEGIN: RelatedProductsSection -->
    <section v-if="relatedJerseys.length > 0" class="mb-14" data-purpose="related-products">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3 flex-1">
          <h2 class="text-xl sm:text-2xl font-bold font-display text-[#0C2333] dark:text-white uppercase tracking-wide lg:whitespace-nowrap">
            OTROS TRAPOS PARA TU COLECCIÓN
          </h2>
          <div class="h-[1.5px] bg-[#D8B15E] hidden sm:block flex-1 ml-2"></div>
        </div>
        <router-link
          to="/catalogo"
          class="text-xs font-bold text-[#48B0DA] hover:underline flex items-center gap-1 uppercase tracking-wider pl-4"
        >
          VER TODOS →
        </router-link>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <article
          v-for="rel in relatedJerseys"
          :key="rel.id"
          class="bg-[#EFECE1] dark:bg-[#112C3F] border border-[#E2DEC6] dark:border-neutral-700 rounded-md overflow-hidden flex flex-col justify-between group shadow-xs hover:shadow-md transition-shadow"
        >
          <router-link
            :to="`/camiseta/${rel.id}`"
            class="jersey-frame relative p-5 pb-3 bg-[#EBE7D8] dark:bg-[#081722]"
          >
            <img
              :src="rel.image"
              :alt="rel.name"
              class="jersey-image mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </router-link>

          <div class="p-4 flex-1 flex flex-col justify-between">
            <div>
              <router-link :to="`/camiseta/${rel.id}`">
                <h3 class="font-bold text-sm text-[#0C2333] dark:text-white uppercase tracking-wide hover:text-[#48B0DA]">
                  {{ rel.name }}
                </h3>
              </router-link>
              <p class="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                Camiseta {{ rel.type.toLowerCase() }} · {{ rel.garmentType }}
              </p>
            </div>
            <div class="mt-3 flex items-center justify-between">
              <span class="text-base font-bold font-sport text-[#0C2333] dark:text-[#48B0DA] tabular-nums">
                $ {{ formatPrice(rel.price) }}
              </span>
              <router-link :to="`/camiseta/${rel.id}`" class="text-xs font-bold text-[#48B0DA] hover:underline">
                Ver trapo →
              </router-link>
            </div>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
