<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  filterState,
  filteredJerseys,
  availableTeams
} from '../store/useStore';
import ProductCard from '../components/ProductCard.vue';
import FilterAccordion from '../components/FilterAccordion.vue';

const route = useRoute();

// Paginación
const currentPage = ref(1);
const itemsPerPage = 9;

// Total de páginas computado
const totalPages = computed(() => {
  return Math.ceil(filteredJerseys.value.length / itemsPerPage) || 1;
});

// Camisetas en la página actual
const paginatedJerseys = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredJerseys.value.slice(start, start + itemsPerPage);
});

// Sincronizar parámetros de la URL al cargar
onMounted(() => {
  syncFromRoute();
});

// Sincronizar cuando cambia la ruta (p. ej. atrás/adelante en el navegador)
watch(
  () => route.query,
  () => {
    syncFromRoute();
  }
);

function syncFromRoute() {
  if (route.query.categoria) {
    const cat = String(route.query.categoria);
    if (cat === 'Ascenso') {
      filterState.categories = ['Primera Nacional', 'Primera B Metropolitana'];
    } else {
      filterState.categories = [cat];
    }
    filterState.era = 'Todas';
  } else {
    filterState.categories = [];
  }

  if (route.query.era) {
    filterState.era = route.query.era as 'Actual' | 'Retro';
  } else if (!route.query.categoria) {
    filterState.era = 'Todas';
  }

  if (route.query.decada) {
    filterState.decade = String(route.query.decada);
  }
  if (route.query.q) {
    filterState.search = String(route.query.q);
  }
}

// Si cambian los filtros, regresar a la página 1
watch(
  [
    () => filterState.search,
    () => filterState.teamSearch,
    () => filterState.categories,
    () => filterState.era,
    () => filterState.decade,
    () => filterState.selectedTeams,
    () => filterState.selectedSizes,
    () => filterState.maxPrice,
    () => filterState.sortBy
  ],
  () => {
    currentPage.value = 1;
  },
  { deep: true }
);

function selectEra(era: 'Todas' | 'Actual' | 'Retro') {
  filterState.era = era;
}

function selectDecade(dec: string) {
  filterState.decade = dec;
}

function toggleCategory(cat: string) {
  const idx = filterState.categories.indexOf(cat);
  if (idx > -1) {
    filterState.categories.splice(idx, 1);
  } else {
    filterState.categories.push(cat);
  }
}

function toggleTeam(team: string) {
  const idx = filterState.selectedTeams.indexOf(team);
  if (idx > -1) {
    filterState.selectedTeams.splice(idx, 1);
  } else {
    filterState.selectedTeams.push(team);
  }
}

function toggleSize(size: string) {
  const idx = filterState.selectedSizes.indexOf(size);
  if (idx > -1) {
    filterState.selectedSizes.splice(idx, 1);
  } else {
    filterState.selectedSizes.push(size);
  }
}

function clearAllFilters() {
  filterState.search = '';
  filterState.teamSearch = '';
  filterState.categories = [];
  filterState.era = 'Todas';
  filterState.decade = 'Todas las épocas';
  filterState.selectedTeams = [];
  filterState.selectedSizes = [];
  filterState.minPrice = 0;
  filterState.maxPrice = 300000;
  filterState.sortBy = 'price-asc';
  currentPage.value = 1;
}

function setPage(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    currentPage.value = p;
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }
}
</script>

<template>
  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-slate-800 dark:text-neutral-100" data-purpose="catalog-page">
    <!-- Breadcrumb -->
    <nav class="text-xs text-gray-500 dark:text-gray-400 mb-4" data-purpose="breadcrumb">
      <router-link to="/" class="text-[#48B0DA] hover:underline">Inicio</router-link>
      <span class="mx-1">/</span>
      <span class="text-gray-600 dark:text-neutral-300 font-medium">Catálogo</span>
    </nav>

    <!-- Page Title & Decorative Bar -->
    <div class="mb-7" data-purpose="page-title">
      <div class="flex items-center gap-4">
        <h1 class="font-condensed font-extrabold text-3xl sm:text-4xl uppercase tracking-wider text-[#0C2333] dark:text-white">
          ENCONTRÁ TU PRÓXIMO TRAPO
        </h1>
        <div class="h-0.5 bg-[#D8B15E] flex-1 max-w-sm hidden sm:block"></div>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
        Camisetas de Primera División, Primera Nacional, Primera B Metropolitana y la Selección Argentina.
      </p>
    </div>

    <!-- Top Filter Pill Controls & Quick Selects -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6" data-purpose="top-filter-bar">
      <!-- Quick Filter Buttons -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Status Switch: Todas / Actuales / Retro -->
        <div class="inline-flex rounded-md border border-[#48B0DA]/50 p-0.5 bg-transparent overflow-hidden">
          <button
            @click="selectEra('Todas')"
            class="px-4 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer"
            :class="filterState.era === 'Todas' ? 'bg-[#48B0DA] text-white shadow-xs' : 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'"
          >
            Todas
          </button>
          <button
            @click="selectEra('Actual')"
            class="px-4 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer"
            :class="filterState.era === 'Actual' ? 'bg-[#48B0DA] text-white shadow-xs' : 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'"
          >
            Actuales
          </button>
          <div class="w-[1px] bg-gray-300 dark:bg-neutral-700 my-1"></div>
          <button
            @click="selectEra('Retro')"
            class="px-4 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer"
            :class="filterState.era === 'Retro' ? 'bg-[#48B0DA] text-white shadow-xs' : 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'"
          >
            Retro
          </button>
        </div>

        <div class="h-6 w-[2px] bg-gray-400 dark:bg-neutral-700 hidden sm:block mx-1"></div>

        <!-- Era Filter Switch -->
        <div class="inline-flex flex-wrap gap-1.5">
          <button
            @click="selectDecade('Todas las épocas')"
            class="px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer"
            :class="filterState.decade === 'Todas las épocas' ? 'bg-[#48B0DA] text-white' : 'border border-[#48B0DA] text-gray-700 dark:text-gray-200 bg-white dark:bg-[#112C3F] hover:bg-gray-50 dark:hover:bg-neutral-800'"
          >
            Todas las épocas
          </button>
          <button
            v-for="dec in ['80', '90', '00', '10']"
            :key="dec"
            @click="selectDecade(dec)"
            class="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer"
            :class="filterState.decade === dec ? 'bg-[#48B0DA] text-white' : 'border border-[#48B0DA] text-gray-700 dark:text-gray-200 bg-white dark:bg-[#112C3F] hover:bg-gray-50 dark:hover:bg-neutral-800'"
          >
            {{ dec }}
          </button>
        </div>
      </div>

      <!-- Item Counter & Sort Dropdown -->
      <div class="flex items-center gap-3 self-end lg:self-auto">
        <span class="text-sm font-bold text-[#0C2333] dark:text-[#48B0DA] underline decoration-[#0C2333] dark:decoration-[#48B0DA] decoration-1 underline-offset-4">
          {{ filteredJerseys.length }} camisetas
        </span>

        <div class="flex items-center text-xs text-gray-600 dark:text-gray-300 gap-1.5">
          <span>Ordenar por precio</span>
          <select
            v-model="filterState.sortBy"
            class="text-xs font-semibold text-[#0C2333] dark:text-white bg-white dark:bg-[#112C3F] border border-[#0C2333]/40 dark:border-neutral-600 rounded-md py-1.5 pl-2.5 pr-8 focus:ring-[#48B0DA] focus:border-[#48B0DA] cursor-pointer"
          >
            <option value="price-asc">Menor a mayor</option>
            <option value="price-desc">Mayor a menor</option>
            <option value="recent">Más recientes</option>
            <option value="name">Alfabético</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Main Grid: Sidebar + Products -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- BEGIN: SidebarFilters -->
      <aside class="lg:col-span-1 space-y-5 text-sm" data-purpose="sidebar-filters">
        <!-- Search Team Input -->
        <div class="relative">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
            </svg>
          </span>
          <input
            v-model="filterState.teamSearch"
            class="w-full text-xs pl-9 pr-3 py-2 rounded-md border border-gray-300 dark:border-neutral-600 bg-[#F4F5F0] dark:bg-[#112C3F] text-slate-800 dark:text-white focus:bg-white dark:focus:bg-[#081722] focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
            placeholder="Buscar equipo..."
            type="text"
          />
        </div>

        <!-- Accordion: Categoría -->
        <FilterAccordion title="Categoría" :default-open="true">
          <div class="space-y-2 text-xs text-gray-700 dark:text-gray-300">
            <label
              v-for="cat in ['Primera División', 'Primera Nacional', 'Primera B Metropolitana', 'Selección Argentina']"
              :key="cat"
              class="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                :checked="filterState.categories.includes(cat)"
                @change="toggleCategory(cat)"
                class="rounded border-gray-300 text-[#48B0DA] focus:ring-[#48B0DA] cursor-pointer"
              />
              <span>{{ cat }}</span>
            </label>
          </div>
        </FilterAccordion>

        <!-- Accordion: Época -->
        <FilterAccordion title="Época" :default-open="true">
          <div class="space-y-2 text-xs text-gray-700 dark:text-gray-300">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="epoca-sidebar"
                value="Todas las épocas"
                :checked="filterState.decade === 'Todas las épocas'"
                @change="selectDecade('Todas las épocas')"
                class="text-[#48B0DA] focus:ring-[#48B0DA] cursor-pointer"
              />
              <span>Todas las épocas</span>
            </label>
            <label
              v-for="dec in ['80', '90', '00', '10']"
              :key="dec"
              class="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="epoca-sidebar"
                :value="dec"
                :checked="filterState.decade === dec"
                @change="selectDecade(dec)"
                class="text-[#48B0DA] focus:ring-[#48B0DA] cursor-pointer"
              />
              <span>Década de {{ dec }}</span>
            </label>
          </div>
        </FilterAccordion>

        <!-- Accordion: Equipo -->
        <FilterAccordion title="Equipo" :default-open="true">
          <div class="space-y-2 text-xs text-gray-700 dark:text-gray-300 max-h-48 overflow-y-auto pr-1">
            <label
              v-for="team in availableTeams"
              :key="team"
              class="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                :checked="filterState.selectedTeams.includes(team)"
                @change="toggleTeam(team)"
                class="rounded border-gray-300 text-[#48B0DA] focus:ring-[#48B0DA] cursor-pointer"
              />
              <span>{{ team }}</span>
            </label>
          </div>
        </FilterAccordion>

        <!-- Accordion: Talle -->
        <FilterAccordion title="Talle (con stock disponible)" :default-open="true">
          <div class="flex gap-1.5 flex-wrap">
            <button
              v-for="s in ['S', 'M', 'L', 'XL', 'XXL']"
              :key="s"
              type="button"
              @click="toggleSize(s)"
              class="flex-1 min-w-[36px] py-1.5 border rounded text-xs font-semibold transition-colors cursor-pointer"
              :class="filterState.selectedSizes.includes(s) ? 'bg-[#48B0DA] text-white border-[#48B0DA]' : 'border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#112C3F] text-slate-700 dark:text-slate-200 hover:border-[#48B0DA] hover:text-[#48B0DA]'"
            >
              {{ s }}
            </button>
          </div>
        </FilterAccordion>

        <!-- Accordion: Precio -->
        <FilterAccordion title="Precio" :default-open="true">
          <div class="px-1">
            <input
              type="range"
              min="50000"
              max="300000"
              step="5000"
              v-model.number="filterState.maxPrice"
              class="w-full accent-[#48B0DA] cursor-pointer"
            />
            <div class="flex justify-between text-[11px] font-medium text-gray-700 dark:text-gray-300 mt-2">
              <span>ARS 0</span>
              <span class="font-bold text-[#0C2333] dark:text-[#48B0DA]">Hasta ARS {{ filterState.maxPrice.toLocaleString('es-AR') }}</span>
            </div>
          </div>
        </FilterAccordion>

        <!-- Button: Limpiar filtros -->
        <button
          @click="clearAllFilters"
          type="button"
          class="w-full py-2 px-4 border border-[#0C2333] dark:border-neutral-400 rounded-md font-bold text-xs text-[#0C2333] dark:text-white hover:bg-[#0C2333] dark:hover:bg-neutral-800 hover:text-white transition-colors duration-200 cursor-pointer"
        >
          Limpiar filtros
        </button>
      </aside>
      <!-- END: SidebarFilters -->

      <!-- BEGIN: ProductGrid -->
      <section class="lg:col-span-3" data-purpose="product-list">
        <!-- Empty State if no match -->
        <div v-if="filteredJerseys.length === 0" class="bg-white dark:bg-[#112C3F] rounded-xl p-10 text-center border border-neutral-200 dark:border-neutral-700">
          <div class="text-4xl mb-3">🔍</div>
          <h3 class="font-condensed text-xl font-bold uppercase text-[#0C2333] dark:text-white">
            No encontramos camisetas con esos filtros
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            Probá ajustando el precio, quitando algunos equipos o cambiando la época.
          </p>
          <button
            @click="clearAllFilters"
            class="px-4 py-2 bg-[#48B0DA] text-white text-xs font-bold rounded hover:bg-[#3ca0c9] cursor-pointer"
          >
            Ver todas las camisetas
          </button>
        </div>

        <!-- Animated Grid using transition-group -->
        <transition-group
          v-else
          name="list"
          tag="div"
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5"
        >
          <div v-for="jersey in paginatedJerseys" :key="jersey.id" class="h-full">
            <ProductCard :jersey="jersey" :show-badge="true" />
          </div>
        </transition-group>

        <!-- BEGIN: Pagination -->
        <nav
          v-if="totalPages > 1"
          class="flex items-center justify-center gap-1.5 mt-10 mb-8"
          data-purpose="pagination"
        >
          <button
            @click="setPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="w-8 h-8 rounded border border-gray-300 dark:border-neutral-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            &lt;
          </button>

          <button
            v-for="p in totalPages"
            :key="p"
            @click="setPage(p)"
            class="w-8 h-8 rounded font-bold flex items-center justify-center text-xs shadow-xs transition-colors cursor-pointer"
            :class="p === currentPage ? 'bg-[#48B0DA] text-white' : 'border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'"
          >
            {{ p }}
          </button>

          <button
            @click="setPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="w-8 h-8 rounded border border-gray-300 dark:border-neutral-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            &gt;
          </button>
        </nav>
      </section>
    </div>
  </main>
</template>
