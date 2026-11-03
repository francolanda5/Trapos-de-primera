<script setup lang="ts">
import { SIZE_GUIDE } from '../data/sizeGuide';
</script>

<template>
  <main class="max-w-3xl mx-auto px-4 sm:px-6 py-6 text-slate-800 dark:text-neutral-100" data-purpose="size-guide-page">
    <nav aria-label="Breadcrumb" class="text-xs text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
      <router-link to="/" class="text-[#48B0DA] hover:underline">Inicio</router-link>
      <span>/</span>
      <span class="text-[#0C2333] dark:text-white font-semibold">Guía de talles</span>
    </nav>

    <h1 class="font-condensed font-extrabold text-3xl sm:text-4xl uppercase tracking-wider text-[#0C2333] dark:text-white mb-2">
      Guía de talles
    </h1>
    <p class="text-sm text-gray-600 dark:text-gray-300 mb-6">
      Medidas orientativas de la camiseta, tomadas con la prenda apoyada sobre una superficie plana.
    </p>

    <div class="overflow-x-auto bg-white dark:bg-[#112C3F] rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xs mb-6">
      <table class="w-full text-left text-sm">
        <caption class="sr-only">Medidas en centímetros de cada talle</caption>
        <thead class="bg-[#F7F4EA] dark:bg-[#081722] text-[#0C2333] dark:text-white text-xs uppercase tracking-wider">
          <tr>
            <th scope="col" class="px-4 py-3">Talle</th>
            <th scope="col" class="px-4 py-3">Pecho (de axila a axila)</th>
            <th scope="col" class="px-4 py-3">Largo</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
          <tr v-for="row in SIZE_GUIDE" :key="row.size">
            <th scope="row" class="px-4 py-3 font-bold text-[#0C2333] dark:text-[#48B0DA]">{{ row.size }}</th>
            <td class="px-4 py-3 tabular-nums">{{ row.chestCm }} cm</td>
            <td class="px-4 py-3 tabular-nums">{{ row.lengthCm }} cm</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2 class="font-condensed font-bold text-xl uppercase text-[#0C2333] dark:text-white mb-2">Cómo medirte</h2>
    <ul class="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300 mb-6">
      <li><strong>Pecho:</strong> medí una camiseta tuya de axila a axila.</li>
      <li><strong>Largo:</strong> medí desde el punto más alto del hombro hasta el borde inferior.</li>
      <li>Si estás entre dos talles, elegí el más grande para un calce más holgado.</li>
    </ul>

    <router-link
      to="/catalogo"
      class="inline-flex items-center justify-center bg-[#48B0DA] hover:bg-[#3ca0c9] text-white px-6 py-2.5 rounded text-sm font-bold transition-colors"
    >
      Ver camisetas →
    </router-link>
  </main>
</template>
