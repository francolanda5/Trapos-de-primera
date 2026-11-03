<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  messages,
  unreadMessagesCount,
  setMessageRead,
  markAllMessagesRead,
  deleteMessage
} from '../store/useStore';
import type { ContactMessage } from '../types';
import ConfirmModal from '../components/ConfirmModal.vue';

type MessageFilter = 'todos' | 'sin-leer' | 'leidos';

const selectedFilter = ref<MessageFilter>('todos');
const messageToDelete = ref<ContactMessage | null>(null);

const readCount = computed(() => messages.value.length - unreadMessagesCount.value);

const filteredMessages = computed(() => {
  if (selectedFilter.value === 'sin-leer') return messages.value.filter((m) => !m.read);
  if (selectedFilter.value === 'leidos') return messages.value.filter((m) => m.read);
  return messages.value;
});

const emptyText = computed(() => {
  if (messages.value.length === 0) return 'Todavía no llegó ningún mensaje. Los que se envíen desde el formulario de "Acerca de" aparecen acá.';
  return selectedFilter.value === 'sin-leer' ? 'No hay mensajes sin leer.' : 'No hay mensajes leídos.';
});

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
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

// Abre el correo del administrador con la respuesta lista para escribir
function replyLink(m: ContactMessage): string {
  const subject = encodeURIComponent('Re: tu consulta en Trapos de Primera');
  const body = encodeURIComponent(`Hola ${m.name},\n\n`);
  return `mailto:${m.email}?subject=${subject}&body=${body}`;
}

function onConfirmDelete() {
  if (messageToDelete.value) deleteMessage(messageToDelete.value.id);
  messageToDelete.value = null;
}
</script>

<template>
  <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-purpose="admin-messages-page">
    <!-- Breadcrumbs -->
    <nav class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6">
      <router-link to="/" class="text-[#48B0DA] hover:underline">Inicio</router-link>
      <span>/</span>
      <router-link to="/admin/camisetas" class="text-slate-600 dark:text-slate-300 hover:underline">Administración</router-link>
      <span>/</span>
      <span class="text-[#0C2333] dark:text-white font-semibold">Mensajes</span>
    </nav>

    <!-- Encabezado y accesos a las otras secciones -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="font-condensed font-black text-2xl sm:text-3xl uppercase tracking-wider text-[#0C2333] dark:text-white">
            MENSAJES DE CONTACTO
          </h1>
          <div class="h-[2px] bg-[#D8B15E] w-12 hidden sm:block"></div>
        </div>
        <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
          Consultas que llegan desde el formulario de "Acerca de". Se guardan en este navegador.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <router-link
          to="/admin/pedidos"
          class="px-3.5 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-[#112C3F] text-xs font-bold text-slate-700 dark:text-neutral-200 hover:border-[#48B0DA] transition-colors"
        >
          📋 Administrar Pedidos
        </router-link>
        <router-link
          to="/admin/camisetas"
          class="px-3.5 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-[#112C3F] text-xs font-bold text-slate-700 dark:text-neutral-200 hover:border-[#48B0DA] transition-colors"
        >
          👕 Gestionar Camisetas
        </router-link>
      </div>
    </div>

    <!-- Filtros y acción masiva -->
    <div class="flex flex-wrap items-center gap-2 mb-6">
      <span class="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Filtrar por:</span>
      <button
        type="button"
        @click="selectedFilter = 'todos'"
        :aria-pressed="selectedFilter === 'todos'"
        class="px-3.5 py-1.5 min-h-9 text-xs font-bold rounded-md transition-colors cursor-pointer"
        :class="selectedFilter === 'todos' ? 'bg-[#48B0DA] text-white' : 'bg-white dark:bg-[#112C3F] border border-neutral-300 dark:border-neutral-600 text-slate-700 dark:text-slate-300'"
      >
        Todos ({{ messages.length }})
      </button>
      <button
        type="button"
        @click="selectedFilter = 'sin-leer'"
        :aria-pressed="selectedFilter === 'sin-leer'"
        class="px-3.5 py-1.5 min-h-9 text-xs font-bold rounded-md transition-colors cursor-pointer"
        :class="selectedFilter === 'sin-leer' ? 'bg-[#48B0DA] text-white' : 'bg-white dark:bg-[#112C3F] border border-neutral-300 dark:border-neutral-600 text-slate-700 dark:text-slate-300'"
      >
        Sin leer ({{ unreadMessagesCount }})
      </button>
      <button
        type="button"
        @click="selectedFilter = 'leidos'"
        :aria-pressed="selectedFilter === 'leidos'"
        class="px-3.5 py-1.5 min-h-9 text-xs font-bold rounded-md transition-colors cursor-pointer"
        :class="selectedFilter === 'leidos' ? 'bg-[#48B0DA] text-white' : 'bg-white dark:bg-[#112C3F] border border-neutral-300 dark:border-neutral-600 text-slate-700 dark:text-slate-300'"
      >
        Leídos ({{ readCount }})
      </button>

      <button
        v-if="unreadMessagesCount > 0"
        type="button"
        @click="markAllMessagesRead"
        class="sm:ml-auto px-3.5 py-1.5 min-h-9 text-xs font-bold rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-[#112C3F] text-slate-700 dark:text-slate-200 hover:border-[#48B0DA] transition-colors cursor-pointer"
      >
        Marcar todos como leídos
      </button>
    </div>

    <!-- Lista de mensajes -->
    <transition-group v-if="filteredMessages.length > 0" name="list" tag="div" class="space-y-3" data-purpose="messages-list">
      <article
        v-for="m in filteredMessages"
        :key="m.id"
        class="bg-white dark:bg-[#112C3F] rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xs p-4 sm:p-5"
        :class="m.read ? '' : 'border-l-4 border-l-[#48B0DA]'"
        :data-read="m.read"
      >
        <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h2 class="font-bold text-sm text-[#0C2333] dark:text-white break-words">{{ m.name }}</h2>
              <span
                v-if="!m.read"
                class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#48B0DA] text-white"
              >
                Nuevo
              </span>
            </div>
            <a :href="`mailto:${m.email}`" class="text-xs text-[#48B0DA] hover:underline break-all">{{ m.email }}</a>
          </div>
          <time :datetime="m.createdAt" class="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {{ formatDate(m.createdAt) }}
          </time>
        </div>

        <!-- {{ }} escapa el texto: lo que escriba el visitante nunca se ejecuta como HTML -->
        <p class="mt-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line break-words">{{ m.message }}</p>

        <div class="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700 flex flex-wrap items-center gap-2">
          <a
            :href="replyLink(m)"
            @click="setMessageRead(m.id, true)"
            class="inline-flex items-center justify-center min-h-11 px-4 rounded bg-[#48B0DA] hover:bg-[#3ca0c9] text-white text-xs font-bold transition-colors"
          >
            ✉️ Responder
          </a>
          <button
            type="button"
            @click="setMessageRead(m.id, !m.read)"
            class="min-h-11 px-4 rounded border border-neutral-300 dark:border-neutral-600 text-xs font-bold text-slate-700 dark:text-neutral-200 hover:border-[#48B0DA] transition-colors cursor-pointer"
          >
            {{ m.read ? 'Marcar como sin leer' : 'Marcar como leído' }}
          </button>
          <button
            type="button"
            @click="messageToDelete = m"
            class="min-h-11 px-4 rounded border border-red-500 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer sm:ml-auto"
          >
            Eliminar
          </button>
        </div>
      </article>
    </transition-group>

    <div
      v-else
      class="bg-white dark:bg-[#112C3F] rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xs px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
      data-purpose="messages-empty"
    >
      {{ emptyText }}
    </div>

    <ConfirmModal
      :is-open="messageToDelete !== null"
      title="¿Eliminar este mensaje?"
      :message="`¿Querés eliminar el mensaje de ${messageToDelete?.name ?? ''}? Esta acción no se puede deshacer.`"
      confirm-text="Sí, eliminar"
      cancel-text="Cancelar"
      :danger="true"
      @confirm="onConfirmDelete"
      @cancel="messageToDelete = null"
    />
  </main>
</template>
