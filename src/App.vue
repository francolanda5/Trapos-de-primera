<script setup lang="ts">
import { onMounted } from 'vue';
import TDPNavbar from './components/TDPNavbar.vue';
import TDPFooter from './components/TDPFooter.vue';
import CartDrawer from './components/CartDrawer.vue';
import FavoritesDrawer from './components/FavoritesDrawer.vue';
import AuthModal from './components/AuthModal.vue';
import ConfirmModal from './components/ConfirmModal.vue';
import ScrollTopButton from './components/ScrollTopButton.vue';
import {
  initializeApiService,
  deleteModalState,
  confirmDeleteJersey,
  closeDeleteConfirmation,
  syncError
} from './store/useStore';

// onMounted() es el mounted() de la Composition API: corre cuando el DOM ya está listo.
// Acá se pide la cotización a DolarAPI con fetch (ver services/apiService.ts).
onMounted(() => {
  initializeApiService();
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

    <!-- Aviso si falla un guardado o una carga en Supabase -->
    <div
      v-if="syncError"
      role="alert"
      class="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-40 p-3 rounded-lg bg-red-600 text-white text-xs shadow-xl flex items-start justify-between gap-3"
    >
      <span>{{ syncError }}</span>
      <button type="button" @click="syncError = ''" aria-label="Cerrar aviso" class="font-bold cursor-pointer">✕</button>
    </div>

    <!-- Botón flotante para volver arriba -->
    <ScrollTopButton />

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
