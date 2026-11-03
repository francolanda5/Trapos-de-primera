<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { jerseys, filterState } from '../store/useStore';
import ProductCard from '../components/ProductCard.vue';
import { CATEGORY_COVERS } from '../data/categoryCovers';

const router = useRouter();

// Tarjetas de "Elegí tu cancha": el texto va en dos líneas
const categoryCards = [
  { category: 'Primera División', lines: ['PRIMERA', 'DIVISIÓN'] },
  { category: 'Primera Nacional', lines: ['PRIMERA', 'NACIONAL'] },
  { category: 'Primera B Metropolitana', lines: ['PRIMERA B', 'METROPOLITANA'] },
  { category: 'Selección Argentina', lines: ['SELECCIÓN', 'ARGENTINA'] }
];

// Recién llegadas (4 camisetas)
const recentArrivals = computed(() => {
  const tagged = jerseys.value.filter((j) => j.newArrival);
  if (tagged.length >= 4) return tagged.slice(0, 4);
  return jerseys.value.slice(1, 5);
});

// Más buscadas (3 camisetas)
const mostSearched = computed(() => {
  const tagged = jerseys.value.filter((j) => j.mostSearched);
  if (tagged.length >= 3) return tagged.slice(0, 3);
  return jerseys.value.slice(5, 8);
});

// Los filtros viajan en la URL: al montarse, CatalogView los lee de route.query.
function navigateCategory(cat: string) {
  filterState.search = '';
  router.push({ path: '/catalogo', query: { categoria: cat } });
}

function navigateEra(era: 'Actual' | 'Retro') {
  filterState.search = '';
  router.push({ path: '/catalogo', query: { era } });
}

function navigateDecade(dec: string) {
  filterState.search = '';
  router.push({ path: '/catalogo', query: { era: 'Retro', decada: dec } });
}
</script>

<template>
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12 sm:space-y-16" data-purpose="home-page">
    <!-- BEGIN: HeroSection -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-2 pb-6" data-purpose="hero-section">
      <!-- Hero Copy Column -->
      <div class="lg:col-span-5 flex flex-col items-start justify-center">
        <!-- En celular el tamaño depende del ancho de pantalla (vw) para ocupar toda la fila -->
        <h1 class="font-condensed whitespace-nowrap text-[clamp(2.5rem,17.8vw,6rem)] sm:text-5xl lg:text-6xl uppercase font-extrabold text-[#0C2333] dark:text-[#F7F4EA] leading-[0.95] tracking-tight mb-4">
          EL FÚTBOL<br />
          ARGENTINO<br />
          SE VISTE DE<br />
          <span class="text-[#48B0DA]">HISTORIA</span>
        </h1>
        <p class="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium mb-6">
          Actuales y retro. De Primera al Ascenso.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <router-link
            to="/catalogo"
            class="inline-flex items-center justify-center bg-[#48B0DA] hover:bg-[#3ca0c9] text-white px-6 py-2.5 rounded text-sm font-bold shadow-xs transition-colors text-center"
          >
            Explorar camisetas &nbsp;→
          </router-link>
          <button
            @click="navigateEra('Retro')"
            class="inline-flex items-center justify-center bg-transparent hover:bg-neutral-200/50 dark:hover:bg-slate-800 text-[#0C2333] dark:text-slate-100 border border-[#0C2333] dark:border-slate-400 px-6 py-2.5 rounded text-sm font-bold transition-colors text-center cursor-pointer"
          >
            Ver colección retro
          </button>
        </div>
      </div>

      <!-- Hero Visual Column -->
      <div class="lg:col-span-7 flex justify-center lg:justify-end">
        <div class="relative w-full rounded-xl overflow-hidden shadow-xl bg-white/40 dark:bg-slate-800/40">
          <img
            alt="Camisetas de Boca, Argentina y Chacarita colgadas en perchas sobre una pared de ladrillos"
            class="w-full h-auto object-cover max-h-[440px] transform hover:scale-105 transition-transform duration-500"
            src="/assets/portada.webp" width="1400" height="788"
          />
        </div>
      </div>
    </section>
    <!-- END: HeroSection -->

    <!-- BEGIN: SectionElegiTuCancha -->
    <section data-purpose="categories-grid">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-condensed text-2xl sm:text-3xl uppercase font-bold text-[#0C2333] dark:text-[#F7F4EA]">
          ELEGÍ TU CANCHA
        </h2>
        <router-link to="/catalogo" class="text-[#48B0DA] font-semibold text-xs sm:text-sm hover:underline flex items-center gap-1">
          TODAS LAS CATEGORÍAS →
        </router-link>
      </div>

      <!-- Category Cards Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <!-- Las alturas llevan "!" porque la regla táctil de index.css (min-height: 44px) le gana a Tailwind -->
        <button
          v-for="card in categoryCards"
          :key="card.category"
          @click="navigateCategory(card.category)"
          :aria-label="`Ver camisetas de ${card.category}`"
          class="group relative overflow-hidden bg-[#0C2333] dark:bg-[#102d42] dark:border dark:border-slate-700 hover:bg-[#13354d] dark:hover:bg-[#183e5a] rounded-lg p-5 flex flex-col justify-between min-h-[140px]! sm:min-h-[180px]! lg:min-h-[200px]! transition-all transform hover:-translate-y-1 shadow-md text-left cursor-pointer"
        >
          <!-- La foto es decorativa y va de fondo: si falla o tarda, queda el azul marino de la tarjeta -->
          <span
            aria-hidden="true"
            class="absolute inset-0 bg-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
            :style="{ backgroundImage: `url('${CATEGORY_COVERS[card.category].url}')`, backgroundPosition: CATEGORY_COVERS[card.category].position }"
          ></span>
          <!-- Degradé más fuerte a la izquierda y abajo, para que el texto se lea siempre -->
          <span aria-hidden="true" class="absolute inset-0 bg-gradient-to-r from-[#0C2333]/90 via-[#0C2333]/45 to-transparent"></span>
          <span aria-hidden="true" class="absolute inset-0 bg-gradient-to-t from-[#0C2333]/90 via-[#0C2333]/20 to-transparent"></span>

          <span class="relative font-condensed font-bold text-white text-base sm:text-lg leading-tight uppercase">
            {{ card.lines[0] }}<br />{{ card.lines[1] }}
          </span>
          <span class="relative text-[#D8B15E] font-bold text-lg self-end">→</span>
        </button>
      </div>
    </section>
    <!-- END: SectionElegiTuCancha -->

    <!-- BEGIN: BannersActualesRetro -->
    <section class="grid grid-cols-1 md:grid-cols-2 gap-4" data-purpose="highlighted-banners">
      <!-- Actuales Banner -->
      <div class="relative bg-neutral-900 rounded-xl overflow-hidden min-h-[220px] flex items-center p-6 sm:p-8 text-white shadow-lg group">
        <div
          class="absolute inset-0 bg-cover bg-center opacity-60 group-hover:scale-105 transition-transform duration-500"
          style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuB92um5QTShk307eZOa9j1zGnpqsnBz7T0sEbyY4t7QYqN5RWFVVOcHcuTYOARQaqGshV9t2llikRu_7h7Mmb-htcvinKGu3qj67d4YbRkzDVPmFOEaYxHtIsc-Kz17D8kLLITjkO_KC8zAV1VB5oUK0-0sFJF10Va0SI5Hx9l1p7efRgwC-ActdzaULsHrrvTk50T8c16hJ1r5IVZCHozGKbD-wfQtVYLKuwNiZ_PZ2srMZ_LDxt9Lfg');"
        ></div>
        <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
        <div class="relative z-10 max-w-xs">
          <h3 class="font-condensed text-3xl sm:text-4xl uppercase font-bold tracking-tight mb-1">ACTUALES</h3>
          <p class="text-xs sm:text-sm text-neutral-300 font-medium mb-4 leading-snug">
            LAS CAMISETAS DE HOY.<br />LA PASIÓN DE SIEMPRE.
          </p>
          <button
            @click="navigateEra('Actual')"
            class="inline-flex items-center text-xs font-bold uppercase tracking-wider text-white border border-white/80 rounded px-4 py-2 hover:bg-white hover:text-black transition-colors cursor-pointer"
          >
            Ver actuales →
          </button>
        </div>
      </div>

      <!-- Retro Banner -->
      <div class="relative bg-neutral-900 rounded-xl overflow-hidden min-h-[220px] flex items-center p-6 sm:p-8 text-white shadow-lg group">
        <div
          class="absolute inset-0 bg-cover bg-center opacity-60 group-hover:scale-105 transition-transform duration-500"
          style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuC1S-EVXHoLF9kMT_I42NpZBpfTldfSTCsdrF7Unl-_PbzIGGmDBxVffOg5YsiKtjbVxdYn9EmL-_lyqVVYrbYlHWeQUi2-40ULmLavnSvr0hAkPJcogTXIYf44XFw5sezZECHQxwDPFvarnMfN0QpMBQxq0U4pcCkvCoh9Ec5iZ_LdcOoEj2vcEZPLfwMjgtm3fHZj4R3Tm-Kt3V7RsRNoSOppoEMv010CxDh2hPIc08YihB_DHcmTOQ');"
        ></div>
        <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
        <div class="relative z-10 max-w-xs">
          <h3 class="font-condensed text-3xl sm:text-4xl uppercase font-bold tracking-tight mb-1">RETRO</h3>
          <p class="text-xs sm:text-sm text-neutral-300 font-medium mb-4 leading-snug">
            CLÁSICOS QUE NUNCA<br />PASAN DE MODA.
          </p>
          <button
            @click="navigateEra('Retro')"
            class="inline-flex items-center text-xs font-bold uppercase tracking-wider text-white border border-white/80 rounded px-4 py-2 hover:bg-white hover:text-black transition-colors cursor-pointer"
          >
            Ver retro →
          </button>
        </div>
      </div>
    </section>
    <!-- END: BannersActualesRetro -->

    <!-- BEGIN: SectionRecienLlegadas -->
    <section data-purpose="new-arrivals">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-condensed text-2xl sm:text-3xl uppercase font-bold text-[#0C2333] dark:text-[#F7F4EA]">
          RECIÉN LLEGADAS
        </h2>
        <router-link to="/catalogo" class="text-[#48B0DA] font-semibold text-xs sm:text-sm hover:underline flex items-center gap-1">
          VER TODAS →
        </router-link>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ProductCard
          v-for="jersey in recentArrivals"
          :key="jersey.id"
          :jersey="jersey"
          :show-badge="false"
        />
      </div>
    </section>
    <!-- END: SectionRecienLlegadas -->

    <!-- BEGIN: BannerAquelAno -->
    <section class="bg-white/80 dark:bg-[#0C2333]/90 rounded-2xl overflow-hidden border border-neutral-200/80 dark:border-slate-800 shadow-md" data-purpose="banner-retro-feature">
      <div class="grid grid-cols-1 md:grid-cols-12 items-center">
        <!-- Detail Photo Argentina 1986 -->
        <div class="md:col-span-6 h-60 md:h-72 w-full overflow-hidden">
          <img
            alt="Detalle bordado de escudo de la Selección Argentina retro"
            class="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRx7_U5HCX0WjlqvGgbNVAtFWR1W2Ajtmf6O8GmRt-wWBzCCJEttK6cvDFUTcRBHxSy5qGx0qZ2oFrFR1mxNB4pcTNLxMlvwajBz2JaJkdDPXmqKuWrd2N89FDJhnn644o5zYTq8PSVGUePaFaTUug_1qSfq7iBIQbf6P98LbsgMiVWLliZsBB-rmU-mDJP9mzI56BefxBxu670bfhM7_htp-zLGCIPK2Pol0D2APF5V83yu7oLTZkPg"
          />
        </div>

        <!-- Decades Selector Content -->
        <div class="md:col-span-6 p-6 sm:p-8">
          <h2 class="font-condensed text-3xl sm:text-4xl uppercase font-bold text-[#0C2333] dark:text-[#F7F4EA] mb-3 leading-tight">
            LA CAMISETA DE AQUEL AÑO
          </h2>
          <p class="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium mb-6 leading-relaxed">
            Hay camisetas que cuentan más que un partido. Reviví las épocas, los ídolos y los momentos que nos hicieron sentir argentinos.
          </p>

          <div class="flex items-center gap-2 flex-wrap mb-4">
            <!-- Botón 80 -->
            <button
              @click="navigateDecade('80')"
              class="w-10 h-8 sm:w-12 sm:h-9 rounded bg-[#48B0DA] text-white text-xs sm:text-sm font-bold flex items-center justify-center shadow-xs cursor-pointer hover:bg-[#3ca0c9] transition-colors"
            >
              80
            </button>
            <!-- Botón 90 -->
            <button
              @click="navigateDecade('90')"
              class="w-10 h-8 sm:w-12 sm:h-9 rounded bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-[#48B0DA] text-xs sm:text-sm font-bold flex items-center justify-center transition-colors cursor-pointer"
            >
              90
            </button>
            <!-- Botón 00 -->
            <button
              @click="navigateDecade('00')"
              class="w-10 h-8 sm:w-12 sm:h-9 rounded bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-[#48B0DA] text-xs sm:text-sm font-bold flex items-center justify-center transition-colors cursor-pointer"
            >
              00
            </button>
            <!-- Botón 10 -->
            <button
              @click="navigateDecade('10')"
              class="w-10 h-8 sm:w-12 sm:h-9 rounded bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-[#48B0DA] text-xs sm:text-sm font-bold flex items-center justify-center transition-colors cursor-pointer"
            >
              10
            </button>

            <!-- CTA Decade Button -->
            <router-link
              to="/catalogo"
              class="ml-auto inline-flex items-center text-xs font-bold text-[#0C2333] dark:text-white border border-[#0C2333] dark:border-slate-400 rounded px-4 py-2 hover:bg-[#0C2333] hover:text-white dark:hover:bg-slate-800 transition-colors"
            >
              Explorar por década →
            </router-link>
          </div>
        </div>
      </div>
    </section>
    <!-- END: BannerAquelAno -->

    <!-- BEGIN: BannerAscenso -->
    <section class="bg-[#0C2333] dark:bg-[#081824] border border-transparent dark:border-slate-800 rounded-xl p-6 sm:p-8 text-white shadow-lg" data-purpose="banner-ascenso">
      <div class="flex flex-col lg:flex-row items-center justify-between gap-6">
        <!-- Left Emblem Icon & Headline -->
        <div class="flex items-center gap-4">
          <div class="w-12 h-10 flex flex-col justify-between py-1 px-1 bg-transparent">
            <div class="h-2 bg-[#48B0DA] rounded-xs"></div>
            <div class="h-2 bg-white rounded-xs"></div>
            <div class="h-2 bg-[#48B0DA] rounded-xs"></div>
          </div>
          <div>
            <h2 class="font-condensed text-2xl sm:text-3xl font-extrabold tracking-tight uppercase leading-none">
              EL ASCENSO<br />TIENE SU LUGAR
            </h2>
          </div>
        </div>

        <!-- Description -->
        <p class="text-xs sm:text-sm text-neutral-300 max-w-md text-center lg:text-left font-medium">
          Misma pasión, más historias. Camisetas de la Primera Nacional y la Primera B Metropolitana.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <button
            @click="navigateCategory('Primera Nacional')"
            class="inline-flex items-center justify-center border border-white/70 hover:bg-white hover:text-[#0C2333] text-white text-xs font-bold px-4 py-2 rounded transition-colors text-center cursor-pointer"
          >
            Primera Nacional →
          </button>
          <button
            @click="navigateCategory('Primera B Metropolitana')"
            class="inline-flex items-center justify-center border border-white/70 hover:bg-white hover:text-[#0C2333] text-white text-xs font-bold px-4 py-2 rounded transition-colors text-center cursor-pointer"
          >
            Primera B Metropolitana →
          </button>
        </div>
      </div>
    </section>
    <!-- END: BannerAscenso -->

    <!-- BEGIN: SectionMasBuscadas -->
    <section data-purpose="most-searched">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-condensed text-2xl sm:text-3xl uppercase font-bold text-[#0C2333] dark:text-[#F7F4EA]">
          MÁS BUSCADAS
        </h2>
        <router-link to="/catalogo" class="text-[#48B0DA] font-semibold text-xs sm:text-sm hover:underline flex items-center gap-1">
          VER TODAS →
        </router-link>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProductCard
          v-for="jersey in mostSearched"
          :key="jersey.id"
          :jersey="jersey"
          :horizontal="true"
        />
      </div>
    </section>
    <!-- END: SectionMasBuscadas -->
  </main>
</template>
