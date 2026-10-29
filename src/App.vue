<script setup lang="ts">
import { onMounted } from 'vue';
import TDPNavbar from './components/TDPNavbar.vue';
import TDPFooter from './components/TDPFooter.vue';
import CartDrawer from './components/CartDrawer.vue';
import FavoritesDrawer from './components/FavoritesDrawer.vue';
import AuthModal from './components/AuthModal.vue';
import ConfirmModal from './components/ConfirmModal.vue';
import {
  initializeApiService,
  deleteModalState,
  confirmDeleteJersey,
  closeDeleteConfirmation,
  themeMode
} from './store/useStore';

/**
 * Consigna PDF: "Uso de los hooks created() y mounted()"
 * 1. FASE CREATED: En la Composition API de Vue 3, el cuerpo de <script setup> se ejecuta
 *    inmediatamente en el ciclo de vida equivalente a created() (antes de que el componente sea montado).
 *    Aquí verificamos el tema inicial y datos de la tienda.
 */
console.info('[App.vue - created() hook phase]: Inicializando estado de la aplicación Trapos de Primera');
if (themeMode.value === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

/**
 * 2. FASE MOUNTED: onMounted() se ejecuta una vez que el DOM está listo.
 *    Aquí inicializamos el consumo de la API mediante Fetch (Supabase / Dólar) y servicios externos.
 */
onMounted(async () => {
  console.info('[App.vue - mounted() hook]: Componente montado en el DOM, inicializando consumo de API');
  await initializeApiService();
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F7F4EA] dark:bg-[#081520] text-slate-800 dark:text-slate-100 antialiased selection:bg-[#48B0DA] selection:text-white transition-colors duration-200">
    <!-- Navbar Global con indicador de categoría activa y buscador -->
    <TDPNavbar />

    <!-- Contenido Principal con Transición de Rutas -->
    <div class="flex-1 w-full">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <!-- Footer Global con enlaces institucionales y panel de gestión -->
    <TDPFooter />

    <!-- Drawer Lateral de Carrito -->
    <CartDrawer />

    <!-- Drawer Lateral de Favoritos -->
    <FavoritesDrawer />

    <!-- Modal de Inicio de Sesión y Creación de Cuenta (con soporte Google GIS) -->
    <AuthModal />

    <!-- Modal Global de Confirmación de Eliminación -->
    <ConfirmModal
      :is-open="deleteModalState.isOpen"
      title="¿Eliminar esta camiseta?"
      :message="deleteModalState.jersey ? `¿Confirmás que querés eliminar permanentemente la camiseta '${deleteModalState.jersey.name}'?` : '¿Deseás confirmar esta eliminación?'"
      confirm-text="Sí, eliminar"
      cancel-text="Cancelar"
      :danger="true"
      @confirm="confirmDeleteJersey"
      @cancel="closeDeleteConfirmation"
    />
  </div>
</template>
