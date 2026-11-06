<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  createJersey,
  updateJersey,
  deleteJersey,
  getJerseyById,
  jerseysReady
} from '../store/useStore';
import type { Jersey } from '../types';
import ConfirmModal from '../components/ConfirmModal.vue';

const route = useRoute();
const router = useRouter();

const isEditing = computed(() => !!route.params.id);
const editingId = computed(() => String(route.params.id || ''));

interface JerseyForm {
  name: string;
  team: string;
  customTeam: string;
  category: Jersey['category'];
  era: 'Actual' | 'Retro';
  season: string;
  type: Jersey['type'];
  price: number | null;
  sizeStock: Record<string, number>;
  sizes: string[];
  garmentType: Jersey['garmentType'];
  image: string;
  description: string;
}

// Valores iniciales del alta: los campos obligatorios arrancan vacíos.
function emptyForm(): JerseyForm {
  return {
    name: '',
    team: 'Argentina',
    customTeam: '',
    category: 'Selección Argentina',
    era: 'Retro',
    season: '',
    type: 'Titular',
    price: null,
    sizeStock: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    garmentType: 'Reedición retro',
    image: '',
    description: ''
  };
}

// Estado del formulario, enlazado a los inputs con v-model
const form = reactive<JerseyForm>(emptyForm());

// Precio máximo: es el tope del filtro de precio del catálogo.
const MAX_PRICE = 300000;
// LocalStorage guarda unos 5 MB en total: limitamos las imágenes subidas desde archivo.
const MAX_IMAGE_BYTES = 1024 * 1024;

// Stock total acumulado computado en tiempo real
const totalStockComputed = computed(() => {
  return form.sizes.reduce((acc, s) => acc + Number(form.sizeStock[s] || 0), 0);
});

// Validación personalizada con mensajes de error visibles
const errors = reactive<{
  name?: string;
  team?: string;
  season?: string;
  price?: string;
  stock?: string;
  sizes?: string;
  image?: string;
  description?: string;
}>({});

const saveSuccess = ref(false);
const showDeleteConfirm = ref(false);

const predefinedTeams = [
  'Argentina',
  'Boca Juniors',
  'River Plate',
  'Racing Club',
  'Independiente',
  'San Lorenzo',
  'Estudiantes LP',
  'Vélez Sarsfield',
  'Chacarita Juniors',
  'Ferro Carril Oeste',
  'Atlanta',
  'Quilmes',
  'All Boys',
  'Almirante Brown',
  'Nueva Chicago',
  'Otro equipo...'
];

function clearErrors() {
  errors.name = undefined;
  errors.team = undefined;
  errors.season = undefined;
  errors.price = undefined;
  errors.stock = undefined;
  errors.sizes = undefined;
  errors.image = undefined;
  errors.description = undefined;
}

// Carga el formulario según la ruta: vacío en el alta, con datos en la edición.
function loadForm() {
  clearErrors();
  Object.assign(form, emptyForm());

  if (isEditing.value) {
    const existing = getJerseyById(editingId.value);
    if (existing) {
      form.name = existing.name;
      form.team = predefinedTeams.includes(existing.team) ? existing.team : 'Otro equipo...';
      form.customTeam = predefinedTeams.includes(existing.team) ? '' : existing.team;
      form.category = existing.category;
      form.era = existing.era;
      form.season = existing.season;
      form.type = existing.type;
      form.price = existing.price;
      form.sizes = [...existing.sizes];
      form.sizeStock = { ...existing.sizeStock };
      // Garantizar que todos los talles tengan clave numérica
      form.sizes.forEach((s) => {
        if (form.sizeStock[s] === undefined) form.sizeStock[s] = 0;
      });
      form.garmentType = existing.garmentType;
      form.image = existing.image;
      form.description = existing.description;
    } else {
      // Con Supabase puede ser una camiseta que todavía se está cargando
      jerseysReady.then(() => (getJerseyById(editingId.value) ? loadForm() : router.replace('/admin/camisetas')));
    }
  }
}

onMounted(loadForm);

// Alta y edición usan este mismo componente: Vue lo reutiliza al pasar de una ruta
// a la otra y no vuelve a correr onMounted, por eso se observa el id de la ruta.
watch(() => route.params.id, loadForm);

// Formato válido de imagen: dirección http(s), ruta local o archivo subido (data:image).
function isValidImage(value: string): boolean {
  if (value.startsWith('/') || value.startsWith('data:image/')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateForm(): boolean {
  let isValid = true;
  clearErrors();

  // 1. Nombre (Obligatorio y longitud mínima)
  if (!form.name || form.name.trim().length === 0) {
    errors.name = 'El nombre de la camiseta es obligatorio.';
    isValid = false;
  } else if (form.name.trim().length < 3) {
    errors.name = 'El nombre debe contener al menos 3 caracteres.';
    isValid = false;
  }

  // 2. Equipo
  const finalTeam = form.team === 'Otro equipo...' ? form.customTeam : form.team;
  if (!finalTeam || finalTeam.trim().length === 0) {
    errors.team = 'Debes especificar el equipo o selección.';
    isValid = false;
  } else if (finalTeam.trim().length < 3) {
    errors.team = 'El equipo debe tener al menos 3 caracteres.';
    isValid = false;
  }

  // 3. Temporada
  if (!form.season || form.season.trim().length === 0) {
    errors.season = 'La temporada es obligatoria.';
    isValid = false;
  } else if (!/^\d{4}(\/\d{2})?$/.test(form.season.trim())) {
    errors.season = 'Formato inválido. Ejemplo: 1986 o 2024/25.';
    isValid = false;
  }

  // 4. Precio (Obligatorio, numérico, > 0 y dentro del rango del catálogo)
  // v-model.number deja el valor como texto vacío si el input está vacío: por eso typeof.
  if (typeof form.price !== 'number' || isNaN(form.price) || form.price <= 0) {
    errors.price = 'El precio debe ser un número mayor a 0.';
    isValid = false;
  } else if (form.price > MAX_PRICE) {
    errors.price = `El precio no puede superar $ ${MAX_PRICE.toLocaleString('es-AR')}.`;
    isValid = false;
  }

  // 5. Talles
  if (!form.sizes || form.sizes.length === 0) {
    errors.sizes = 'Seleccioná al menos un talle habilitado.';
    isValid = false;
  }

  // 6. Stock por talle
  for (const s of form.sizes) {
    const qty = form.sizeStock[s];
    if (!Number.isInteger(qty) || qty < 0) {
      errors.stock = `El stock del talle ${s} debe ser un número entero mayor o igual a 0.`;
      isValid = false;
      break;
    }
  }

  // 7. Imagen (Obligatorio y formato válido)
  if (!form.image || form.image.trim().length === 0) {
    errors.image = 'La imagen es obligatoria.';
    isValid = false;
  } else if (!isValidImage(form.image.trim())) {
    errors.image = 'Ingresá una URL de imagen válida o subí un archivo.';
    isValid = false;
  }

  // 8. Descripción (Longitud mínima)
  if (!form.description || form.description.trim().length === 0) {
    errors.description = 'La descripción es obligatoria.';
    isValid = false;
  } else if (form.description.trim().length < 15) {
    errors.description = 'La descripción debe tener al menos 15 caracteres.';
    isValid = false;
  }

  return isValid;
}

function handleSave() {
  if (saveSuccess.value || !validateForm()) return; // saveSuccess evita guardar dos veces

  const finalTeam = form.team === 'Otro equipo...' ? form.customTeam.trim() : form.team;

  // Filtrar sizeStock para que solo conserve los talles marcados
  const cleanSizeStock: Record<string, number> = {};
  form.sizes.forEach((s) => {
    cleanSizeStock[s] = Number(form.sizeStock[s] || 0);
  });

  const jerseyData: Omit<Jersey, 'id' | 'stock'> = {
    name: form.name.trim(),
    team: finalTeam,
    category: form.category,
    era: form.era,
    decade: form.era === 'Retro' ? (form.season.startsWith('198') ? '80' : form.season.startsWith('199') ? '90' : form.season.startsWith('200') ? '00' : '10') : 'Actual',
    season: form.season.trim(),
    type: form.type,
    price: Number(form.price),
    sizeStock: cleanSizeStock,
    sizes: [...form.sizes],
    garmentType: form.garmentType,
    image: form.image.trim(),
    description: form.description.trim()
  };

  if (isEditing.value) {
    updateJersey(editingId.value, jerseyData);
  } else {
    createJersey(jerseyData);
  }

  saveSuccess.value = true;
  setTimeout(() => {
    saveSuccess.value = false;
    router.push('/catalogo');
  }, 1200);
}

function handleDelete() {
  if (isEditing.value) {
    showDeleteConfirm.value = true;
  }
}

function onConfirmDelete() {
  deleteJersey(editingId.value);
  showDeleteConfirm.value = false;
  router.push('/catalogo');
}

function toggleSizeOption(s: string) {
  const idx = form.sizes.indexOf(s);
  if (idx > -1) {
    form.sizes.splice(idx, 1);
  } else {
    form.sizes.push(s);
    if (form.sizeStock[s] === undefined) {
      form.sizeStock[s] = 2; // Cantidad sugerida inicial
    }
  }
}

function handleFileUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    if (file.size > MAX_IMAGE_BYTES) {
      errors.image = 'La imagen no puede pesar más de 1 MB. Probá con otra o pegá una URL.';
      return;
    }
    errors.image = undefined;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        form.image = String(uploadEvent.target.result);
      }
    };
    reader.readAsDataURL(file);
  }
}
</script>

<template>
  <main class="flex-1 max-w-[1340px] w-full mx-auto px-4 lg:px-6 py-6 text-slate-800 dark:text-neutral-100" data-purpose="admin-container">
    <!-- Breadcrumbs -->
    <nav class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4" data-purpose="breadcrumbs">
      <router-link to="/" class="text-[#48B0DA] font-medium hover:underline">Inicio</router-link>
      <span>/</span>
      <span class="text-slate-600 dark:text-slate-300 font-medium">Administración</span>
      <span>/</span>
      <span class="text-[#0C2333] dark:text-white font-bold">Camisetas</span>
    </nav>

    <!-- Page Title with decorative gold line -->
    <div class="mb-5" data-purpose="page-title-section">
      <div class="flex items-center gap-4">
        <h1 class="text-2xl md:text-3xl font-condensed font-extrabold text-[#0C2333] dark:text-white tracking-wide uppercase md:whitespace-nowrap">
          {{ isEditing ? 'EDITAR CAMISETA Y STOCK' : 'GESTIONAR CAMISETA' }}
        </h1>
        <div class="h-[2px] bg-[#D8B15E] flex-1 mt-1"></div>
      </div>
      <p class="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
        {{ isEditing ? 'Modificá existencias individuales por talle y datos de la camiseta.' : 'Agregá un nuevo producto con stock detallado por talle al catálogo.' }}
      </p>
    </div>

    <!-- Feedback Banner de Guardado Exitoso -->
    <div
      v-if="saveSuccess"
      class="mb-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center justify-between"
    >
      <span>✓ ¡Camiseta guardada exitosamente con inventario actualizado por talle!</span>
      <span class="text-xs text-emerald-600 dark:text-emerald-400">Redirigiendo al catálogo...</span>
    </div>

    <!-- Dual Column Grid Layout (Form & Live Preview) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- LEFT COLUMN: Form Container -->
      <section class="lg:col-span-8 bg-[#F7F4EA] dark:bg-[#112C3F] border border-[#E2DEC9] dark:border-neutral-700 rounded-xl p-5 md:p-6 shadow-xs" data-purpose="management-form-card">
        <div class="flex justify-end mb-4">
          <span class="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Completá los campos obligatorios (*).</span>
        </div>

        <form @submit.prevent="handleSave" class="space-y-4" novalidate>
          <!-- Row 1: Nombre & Equipo -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1" for="shirt-name">
                Nombre de la camiseta *
              </label>
              <input
                id="shirt-name"
                v-model="form.name"
                type="text"
                placeholder="Ej: Boca Juniors 2000"
                class="w-full text-xs font-normal bg-white dark:bg-[#081722] border rounded px-3 py-2 text-slate-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
                :class="errors.name ? 'border-red-500 bg-red-50/20' : 'border-[#C8C4B0] dark:border-neutral-600'"
              />
              <p v-if="errors.name" class="text-[11px] text-red-500 font-semibold mt-1">
                {{ errors.name }}
              </p>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1" for="shirt-team">
                Equipo o selección *
              </label>
              <select
                id="shirt-team"
                v-model="form.team"
                class="w-full text-xs font-normal bg-white dark:bg-[#081722] border rounded px-3 py-2 text-slate-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
                :class="errors.team ? 'border-red-500' : 'border-[#C8C4B0] dark:border-neutral-600'"
              >
                <option v-for="t in predefinedTeams" :key="t" :value="t">
                  {{ t }}
                </option>
              </select>

              <input
                v-if="form.team === 'Otro equipo...'"
                v-model="form.customTeam"
                aria-label="Nombre del club"
                type="text"
                placeholder="Escribí el nombre del club"
                class="w-full text-xs font-normal bg-white dark:bg-[#081722] border border-[#C8C4B0] dark:border-neutral-600 rounded px-3 py-1.5 mt-2 text-slate-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
              />
              <p v-if="errors.team" class="text-[11px] text-red-500 font-semibold mt-1">
                {{ errors.team }}
              </p>
            </div>
          </div>

          <!-- Row 2: Categoria, Época & Temporada -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <!-- Categoría (5 cols) -->
            <div class="md:col-span-5">
              <label class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1" for="shirt-category">
                Categoría *
              </label>
              <select
                id="shirt-category"
                v-model="form.category"
                class="w-full text-xs font-normal bg-white dark:bg-[#081722] border border-[#C8C4B0] dark:border-neutral-600 rounded px-3 py-2 text-slate-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
              >
                <option value="Selección Argentina">Selección Argentina</option>
                <option value="Primera División">Primera División</option>
                <option value="Primera Nacional">Primera Nacional</option>
                <option value="Primera B Metropolitana">Primera B Metropolitana</option>
              </select>
            </div>

            <!-- Época (4 cols) -->
            <div class="md:col-span-4">
              <span class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1">
                Época *
              </span>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  @click="form.era = 'Actual'"
                  class="w-full py-1.5 text-xs font-medium rounded transition-colors text-center cursor-pointer"
                  :class="form.era === 'Actual' ? 'font-bold text-white bg-[#48B0DA] border border-[#48B0DA] shadow-xs' : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-[#081722] border border-[#C8C4B0] dark:border-neutral-600'"
                >
                  Actual
                </button>
                <button
                  type="button"
                  @click="form.era = 'Retro'"
                  class="w-full py-1.5 text-xs font-medium rounded transition-colors text-center cursor-pointer"
                  :class="form.era === 'Retro' ? 'font-bold text-white bg-[#48B0DA] border border-[#48B0DA] shadow-xs' : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-[#081722] border border-[#C8C4B0] dark:border-neutral-600'"
                >
                  Retro
                </button>
              </div>
            </div>

            <!-- Temporada (3 cols) -->
            <div class="md:col-span-3">
              <label class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1" for="shirt-season">
                Temporada *
              </label>
              <input
                id="shirt-season"
                v-model="form.season"
                type="text"
                placeholder="Ej: 1986 o 2024"
                class="w-full text-xs font-normal bg-white dark:bg-[#081722] border rounded px-3 py-2 text-slate-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
                :class="errors.season ? 'border-red-500 bg-red-50/20' : 'border-[#C8C4B0] dark:border-neutral-600'"
              />
              <p v-if="errors.season" class="text-[11px] text-red-500 font-semibold mt-1">
                {{ errors.season }}
              </p>
            </div>
          </div>

          <!-- Row 3: Tipo & Precio -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1" for="shirt-type">
                Tipo *
              </label>
              <select
                id="shirt-type"
                v-model="form.type"
                class="w-full text-xs font-normal bg-white dark:bg-[#081722] border border-[#C8C4B0] dark:border-neutral-600 rounded px-3 py-2 text-slate-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
              >
                <option value="Titular">Titular</option>
                <option value="Suplente">Suplente</option>
                <option value="Tercera">Tercera</option>
                <option value="Arquero">Arquero</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1" for="shirt-price">
                Precio (ARS) *
              </label>
              <div class="relative flex items-center">
                <span class="absolute left-3 text-xs font-medium text-slate-600 dark:text-slate-400">$</span>
                <input
                  id="shirt-price"
                  v-model.number="form.price"
                  type="number"
                  min="1"
                  step="1000"
                  class="w-full text-xs font-normal bg-white dark:bg-[#081722] border rounded pl-8 pr-3 py-2 text-slate-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
                  :class="errors.price ? 'border-red-500 bg-red-50/20' : 'border-[#C8C4B0] dark:border-neutral-600'"
                />
              </div>
              <p v-if="errors.price" class="text-[11px] text-red-500 font-semibold mt-1">
                {{ errors.price }}
              </p>
            </div>
          </div>

          <!-- Row 4: GESTIÓN DE EXISTENCIAS INDEPENDIENTES POR TALLE -->
          <div class="p-4 bg-white dark:bg-[#081722] rounded-lg border border-[#C8C4B0] dark:border-neutral-700 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 class="text-xs font-bold text-[#0C2333] dark:text-white uppercase tracking-wider">
                  Existencias por Talle *
                </h3>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">
                  Definí el stock independiente de cada talle. El stock total se calcula automáticamente sumando las cantidades.
                </p>
              </div>
              <span class="px-2.5 py-1 bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-[#48B0DA] rounded text-xs font-bold">
                Stock Total: {{ totalStockComputed }} u.
              </span>
            </div>

            <!-- Talles habilitados -->
            <div class="flex flex-wrap items-center gap-3 text-xs font-medium">
              <span class="text-[11px] font-bold text-slate-600 dark:text-slate-300">Talles activos:</span>
              <label v-for="s in ['S', 'M', 'L', 'XL', 'XXL']" :key="s" class="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  :value="s"
                  :checked="form.sizes.includes(s)"
                  @change="toggleSizeOption(s)"
                  class="rounded text-[#48B0DA]"
                />
                <span>{{ s }}</span>
              </label>
            </div>

            <!-- Inputs independientes de cantidad por talle -->
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div v-for="s in form.sizes" :key="s" class="p-2 border border-neutral-200 dark:border-neutral-700 rounded bg-[#F7F4EA] dark:bg-[#112C3F]">
                <label :for="`stock-${s}`" class="block text-[11px] font-bold text-slate-700 dark:text-neutral-200 mb-1 text-center">
                  Talle {{ s }}
                </label>
                <input
                  :id="`stock-${s}`"
                  v-model.number="form.sizeStock[s]"
                  type="number"
                  min="0"
                  class="w-full text-center text-xs font-bold bg-white dark:bg-[#081722] border border-neutral-300 dark:border-neutral-600 rounded py-1 focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
                />
              </div>
            </div>

            <p v-if="errors.stock || errors.sizes" class="text-[11px] text-red-500 font-semibold mt-1">
              {{ errors.stock || errors.sizes }}
            </p>
          </div>

          <!-- Row 5: Tipo de Prenda & Upload Imagen -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              <label class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1" for="garment-type">
                Tipo de prenda *
              </label>
              <select
                id="garment-type"
                v-model="form.garmentType"
                class="w-full text-xs font-normal bg-white dark:bg-[#081722] border border-[#C8C4B0] dark:border-neutral-600 rounded px-3 py-2 text-slate-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
              >
                <option value="Reedición retro">Reedición retro</option>
                <option value="Original de época">Original de época</option>
                <option value="Versión jugador">Versión jugador</option>
                <option value="Versión hincha">Versión hincha</option>
              </select>
            </div>

            <div>
              <span class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1">
                Subir o cambiar imagen *
              </span>
              <!-- sr-only (y no hidden) para que el input se pueda usar con el teclado -->
              <label class="w-full border border-dashed border-neutral-400 dark:border-neutral-600 rounded py-2 px-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800 text-xs focus-within:outline-2 focus-within:outline-[#48B0DA]">
                <input type="file" accept="image/*" @change="handleFileUpload" class="sr-only" />
                <span>📷 Seleccionar archivo local (máx. 1 MB)</span>
              </label>
            </div>
          </div>

          <!-- URL Input Directa -->
          <div>
            <label class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1" for="shirt-image">
              O pegá la URL de la imagen
            </label>
            <input
              id="shirt-image"
              v-model="form.image"
              type="url"
              placeholder="https://... (URL directa de la imagen)"
              class="w-full text-xs font-normal bg-white dark:bg-[#081722] border rounded px-3 py-2 text-slate-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
              :class="errors.image ? 'border-red-500 bg-red-50/20' : 'border-[#C8C4B0] dark:border-neutral-600'"
            />
            <p v-if="errors.image" class="text-[11px] text-red-500 font-semibold mt-1">
              {{ errors.image }}
            </p>
          </div>

          <!-- Row 6: Descripción -->
          <div>
            <label class="block text-xs font-bold text-[#0C2333] dark:text-neutral-200 mb-1" for="shirt-description">
              Descripción detallada *
            </label>
            <textarea
              id="shirt-description"
              v-model="form.description"
              rows="3"
              placeholder="Detallá la historia, material, escudo y características de la camiseta..."
              class="w-full text-xs font-normal leading-relaxed bg-white dark:bg-[#081722] border rounded p-3 text-slate-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#48B0DA]"
              :class="errors.description ? 'border-red-500 bg-red-50/20' : 'border-[#C8C4B0] dark:border-neutral-600'"
            ></textarea>
            <p v-if="errors.description" class="text-[11px] text-red-500 font-semibold mt-1">
              {{ errors.description }}
            </p>
          </div>

          <!-- Form Action Buttons -->
          <div class="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-[#E2DEC9] dark:border-neutral-700">
            <div class="flex items-center gap-3">
              <button
                type="submit"
                :disabled="saveSuccess"
                class="px-5 py-2 bg-[#48B0DA] hover:bg-[#3ca0c9] text-white font-bold text-xs rounded transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {{ isEditing ? 'Actualizar camiseta' : 'Guardar camiseta' }}
              </button>
              <router-link
                to="/catalogo"
                class="px-5 py-2 bg-transparent text-[#0C2333] dark:text-white font-bold text-xs rounded border border-[#0C2333] dark:border-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors text-center"
              >
                Cancelar
              </router-link>
            </div>

            <div v-if="isEditing">
              <button
                type="button"
                @click="handleDelete"
                class="w-full sm:w-auto px-5 py-2 bg-transparent text-[#0C2333] dark:text-neutral-300 font-bold text-xs rounded border border-[#0C2333] dark:border-neutral-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                Eliminar camiseta
              </button>
            </div>
          </div>
        </form>
      </section>

      <!-- RIGHT COLUMN: Live Product Preview -->
      <section class="lg:col-span-4 lg:sticky lg:top-44" data-purpose="live-preview-section">
        <div class="flex items-center gap-3 mb-4">
          <h2 class="text-xl font-condensed font-extrabold text-[#0C2333] dark:text-white tracking-wide uppercase whitespace-nowrap">
            VISTA PREVIA
          </h2>
          <div class="h-[2px] bg-[#D8B15E] flex-1"></div>
        </div>

        <article class="bg-[#F7F4EA] dark:bg-[#112C3F] border border-[#E2DEC9] dark:border-neutral-700 rounded-xl p-5 shadow-xs" data-purpose="product-preview-card">
          <!-- Jersey Image Container -->
          <div class="jersey-frame w-full max-w-[240px] mx-auto rounded-lg bg-slate-100 dark:bg-[#081722] mb-4">
            <img
              :src="form.image || '/sin-imagen.svg'"
              :alt="form.name || 'Vista previa'"
              class="jersey-image p-2"
            />
          </div>

          <!-- Product Details -->
          <div class="space-y-1">
            <h3 class="text-xl font-extrabold text-[#0C2333] dark:text-white tracking-tight truncate">
              {{ form.name || 'Nombre de la camiseta' }}
            </h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {{ form.team === 'Otro equipo...' ? (form.customTeam || 'Club') : form.team }} · {{ form.era }}
            </p>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 leading-tight">
              <div>Temporada {{ form.season || '----' }} · {{ form.type }}</div>
              <div>{{ form.garmentType }}</div>
            </div>

            <!-- Divider Line -->
            <div class="pt-2 pb-1">
              <div class="h-[1.5px] bg-[#D8B15E] w-full"></div>
            </div>

            <!-- Price & Total Stock Display -->
            <div class="pt-1">
              <div class="text-2xl font-black text-[#0C2333] dark:text-[#48B0DA] tracking-tight tabular-nums">
                $ {{ form.price ? Number(form.price).toLocaleString('es-AR') : '0' }}
              </div>
              <div class="text-xs text-slate-700 dark:text-slate-300 mt-1">
                Stock total: <span class="font-bold text-[#0C2333] dark:text-white">{{ totalStockComputed }}</span>
              </div>
            </div>

            <!-- Available Sizes Preview with individual quantities -->
            <div class="pt-3">
              <span class="block text-xs font-bold text-[#0C2333] dark:text-white mb-1.5">Talles y existencias</span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span
                  v-for="s in form.sizes"
                  :key="s"
                  class="px-2 py-1 text-xs font-semibold rounded flex items-center gap-1 shadow-2xs border"
                  :class="[
                    (form.sizeStock[s] || 0) > 0
                      ? 'bg-white dark:bg-[#081722] text-slate-800 dark:text-white border-[#C8C4B0] dark:border-neutral-600'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-slate-400 line-through border-dashed border-neutral-300'
                  ]"
                >
                  <span>{{ s }}:</span>
                  <strong class="font-mono">{{ form.sizeStock[s] || 0 }}</strong>
                </span>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>

    <!-- Confirm Modal para Eliminación -->
    <ConfirmModal
      :is-open="showDeleteConfirm"
      title="¿Eliminar esta camiseta?"
      :message="`¿Estás seguro de que deseás eliminar permanentemente '${form.name}' del catálogo? Esta acción no se puede deshacer.`"
      confirm-text="Sí, eliminar"
      cancel-text="Cancelar"
      :danger="true"
      @confirm="onConfirmDelete"
      @cancel="showDeleteConfirm = false"
    />
  </main>
</template>
