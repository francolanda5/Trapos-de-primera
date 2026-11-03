<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { filterState } from '../store/useStore';

const router = useRouter();

const contactForm = reactive({
  name: '',
  email: '',
  message: ''
});

const contactErrors = reactive<{ name?: string; email?: string; message?: string }>({});

const formSent = ref(false);

// Validación personalizada: obligatorios, longitud mínima y formato de email
function validateContact(): boolean {
  contactErrors.name = contactForm.name.trim().length < 3 ? 'Ingresá tu nombre (mínimo 3 caracteres).' : undefined;
  contactErrors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email) ? undefined : 'Ingresá un email válido.';
  contactErrors.message = contactForm.message.trim().length < 10 ? 'El mensaje debe tener al menos 10 caracteres.' : undefined;
  return !contactErrors.name && !contactErrors.email && !contactErrors.message;
}

function handleContactSubmit() {
  if (!validateContact()) return;
  // Es una demostración: el mensaje no se envía a ningún servidor.
  formSent.value = true;
  setTimeout(() => {
    contactForm.name = '';
    contactForm.email = '';
    contactForm.message = '';
    formSent.value = false;
  }, 4000);
}

function filterAscenso(category: string) {
  filterState.search = '';
  router.push({ path: '/catalogo', query: { categoria: category } });
}
</script>

<template>
  <main class="flex-grow w-full" data-purpose="about-page">
    <!-- Breadcrumb -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 w-full pt-4 pb-2" data-purpose="breadcrumbs">
      <p class="text-xs font-semibold text-gray-500 dark:text-gray-400">
        <router-link to="/" class="text-[#48B0DA] hover:underline">Inicio</router-link>
        <span class="mx-1 text-gray-400">/</span>
        <span class="text-gray-700 dark:text-gray-200">Acerca de</span>
      </p>
    </div>

    <!-- BEGIN: HeroInstitutionalSection -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-4" data-purpose="hero-about">
      <div class="grid grid-cols-1 lg:grid-cols-2 rounded-sm overflow-hidden shadow-md">
        <!-- Left Panel: Navy Text Banner -->
        <div class="bg-[#0C2333] text-white p-8 sm:p-12 md:p-16 flex flex-col justify-between">
          <div>
            <h1 class="font-condensed text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05] tracking-tight">
              VIEJOS SON<br />
              LOS TRAPOS.<br />
              <span class="text-[#48B0DA] block mt-1">LA PASIÓN<br />SIGUE INTACTA.</span>
            </h1>

            <!-- Golden decorative line -->
            <div class="w-16 h-1 bg-[#D8B15E] my-6"></div>

            <p class="text-base sm:text-lg text-gray-200 font-normal leading-relaxed max-w-md">
              Camisetas actuales y retro del fútbol argentino. De Primera al Ascenso, y siempre con la Selección.
            </p>
          </div>

          <!-- Decorative Cyan Graphic Bars -->
          <div class="mt-12 flex flex-col gap-2">
            <span class="h-3 w-28 bg-[#48B0DA] inline-block rounded-xs"></span>
            <span class="h-3 w-28 bg-[#48B0DA] inline-block rounded-xs"></span>
          </div>
        </div>

        <!-- Right Panel: Visual Dressing Room Photograph -->
        <div class="relative bg-neutral-900 min-h-[350px] lg:min-h-[500px]">
          <img
            alt="Perchero con camisetas de fútbol en exhibición"
            class="w-full h-full object-cover object-center"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJxxYdifj1Yqvlx4BrnbvkKaFDPvfSLAPtPz94PCGjYAKWSdJ316BG4bcf_dsR_dC-P9siFyGag-U8y5-hBy6aeugTzUEgxC-_NlqGg97U6gEwh6KThDmTbpMIB1BarUSGyvPOllbiNuAzxj49fioh0bNt75RytoZhmYtwWf79Z3PK9u7g1NuRi3Z2YCx3ZTlJsB4zoSKLAOd1xhu0ed33E2TiD7dF4phFShD3X0zqvW9triNcripPfQ"
          />
        </div>
      </div>
    </section>
    <!-- END: HeroInstitutionalSection -->

    <!-- BEGIN: ValuePropositionSection -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-12" data-purpose="why-us">
      <!-- Section Header -->
      <div class="flex items-center gap-4 mb-3">
        <h2 class="font-condensed text-3xl sm:text-4xl font-black tracking-tight text-[#0C2333] dark:text-[#F7F4EA] sm:whitespace-nowrap">
          POR QUÉ TRAPOS DE PRIMERA
        </h2>
        <div class="flex-grow h-[1.5px] bg-[#D8B15E]/70"></div>
      </div>

      <p class="text-[#0C2333]/80 dark:text-slate-300 text-sm sm:text-base max-w-3xl mb-8 leading-relaxed font-normal">
        Cada camiseta guarda una época, una cancha y una manera de sentir el fútbol. Reunimos diseños actuales y clásicos para que encuentres el tuyo.
      </p>

      <!-- 3 Feature Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Card 1: Todas las épocas -->
        <div class="bg-white/60 dark:bg-slate-800/80 border border-[#E6E1D3] dark:border-slate-700 rounded-lg p-8 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-shadow">
          <div class="w-20 h-20 mb-4 flex items-center justify-center text-[#48B0DA]">
            <svg class="w-16 h-16 stroke-[#0C2333] dark:stroke-[#F7F4EA] fill-none" stroke-width="2.5" viewBox="0 0 64 64">
              <path d="M22 10 L12 18 L18 26 L22 23 L22 54 L42 54 L42 23 L46 26 L52 18 L42 10 C38 15 26 15 22 10 Z" fill="#F7F4EA" stroke-linejoin="round"></path>
              <path d="M27 13 L27 54" stroke="#48B0DA" stroke-linecap="round" stroke-width="3"></path>
              <path d="M32 14 L32 54" stroke="#0C2333" stroke-linecap="round" stroke-width="2"></path>
              <path d="M37 13 L37 54" stroke="#48B0DA" stroke-linecap="round" stroke-width="3"></path>
            </svg>
          </div>
          <h3 class="font-condensed text-2xl font-black tracking-tight text-[#0C2333] dark:text-[#F7F4EA] mb-2">
            TODAS LAS ÉPOCAS
          </h3>
          <div class="w-8 h-[2.5px] bg-[#D8B15E] mb-4"></div>
          <p class="text-xs sm:text-sm text-[#0C2333]/80 dark:text-slate-300 leading-relaxed font-normal">
            Desde las camisetas más recientes hasta los grandes clásicos que marcaron generaciones.
          </p>
        </div>

        <!-- Card 2: Todas las tribunas -->
        <div class="bg-white/60 dark:bg-slate-800/80 border border-[#E6E1D3] dark:border-slate-700 rounded-lg p-8 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-shadow">
          <div class="w-20 h-20 mb-4 flex items-center justify-center text-[#0C2333] dark:text-[#48B0DA]">
            <svg class="w-16 h-16 stroke-[#0C2333] dark:stroke-[#F7F4EA] fill-none" stroke-width="2.2" viewBox="0 0 64 64">
              <ellipse cx="32" cy="30" rx="24" ry="12"></ellipse>
              <ellipse cx="32" cy="30" fill="#48B0DA" fill-opacity="0.2" rx="14" ry="7"></ellipse>
              <path d="M8 30 V38 C8 44.6 18.7 50 32 50 C45.3 50 56 44.6 56 38 V30"></path>
              <path d="M14 36 V43"></path>
              <path d="M22 39 V46"></path>
              <path d="M32 40 V48"></path>
              <path d="M42 39 V46"></path>
              <path d="M50 36 V43"></path>
            </svg>
          </div>
          <h3 class="font-condensed text-2xl font-black tracking-tight text-[#0C2333] dark:text-[#F7F4EA] mb-2">
            TODAS LAS TRIBUNAS
          </h3>
          <div class="w-8 h-[2.5px] bg-[#D8B15E] mb-4"></div>
          <p class="text-xs sm:text-sm text-[#0C2333]/80 dark:text-slate-300 leading-relaxed font-normal">
            Primera División, Primera Nacional, Primera B Metropolitana y la Selección Argentina.
          </p>
        </div>

        <!-- Card 3: Cada detalle cuenta -->
        <div class="bg-white/60 dark:bg-slate-800/80 border border-[#E6E1D3] dark:border-slate-700 rounded-lg p-8 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-shadow">
          <div class="w-20 h-20 mb-4 flex items-center justify-center text-[#0C2333] dark:text-[#48B0DA]">
            <svg class="w-16 h-16 stroke-[#0C2333] dark:stroke-[#F7F4EA] fill-none" stroke-width="2.5" viewBox="0 0 64 64">
              <circle cx="28" cy="27" r="15" stroke="currentColor" stroke-width="3"></circle>
              <circle cx="28" cy="27" fill="#48B0DA" fill-opacity="0.15" r="10" stroke="#48B0DA" stroke-width="2.5"></circle>
              <path d="M39 38 L52 51" stroke="currentColor" stroke-linecap="round" stroke-width="4.5"></path>
            </svg>
          </div>
          <h3 class="font-condensed text-2xl font-black tracking-tight text-[#0C2333] dark:text-[#F7F4EA] mb-2">
            CADA DETALLE CUENTA
          </h3>
          <div class="w-8 h-[2.5px] bg-[#D8B15E] mb-4"></div>
          <p class="text-xs sm:text-sm text-[#0C2333]/80 dark:text-slate-300 leading-relaxed font-normal">
            Camisetas originales, con historia, para quienes valoran los colores, los diseños y sus significados.
          </p>
        </div>
      </div>
    </section>
    <!-- END: ValuePropositionSection -->

    <!-- BEGIN: AscensoBannerSection -->
    <section class="w-full bg-[#0C2333] dark:bg-[#081824] relative overflow-hidden py-14 my-6 text-white" data-purpose="ascenso-spotlight">
      <div class="absolute inset-0 z-0">
        <img
          alt="Tribuna popular con hinchada y banderas de aliento de ascenso"
          class="w-full h-full object-cover opacity-25 filter grayscale"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQ-wWPrSYJ2_t14uwg3vB76yf7tJqIsXnV5s4bY8kEhmz19ngvYspC3vLFpPJD5KXIebyFAXqOwXL2OnyDTGnkfonKI8pB9N3oodbd46J6yjQiBmSbuBvCgvBw5Zldn0ipbWL0Jq3CJxY8LvMxIyXi9f8NK_uH_ku92v6HqpDnRMABHNWFkQ-HS44D-6zqxWtwYMYnhijEnljHn-UYeFabCxGCVn5Bekt4c3zFW05eXfNqWL7_k_cxLw"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-[#0C2333] via-[#0C2333]/90 to-transparent"></div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div class="lg:col-span-7">
          <h2 class="font-condensed text-4xl sm:text-5xl font-black tracking-tight uppercase leading-tight mb-4">
            EL ASCENSO TAMBIÉN<br />ES PROTAGONISTA
          </h2>
          <p class="text-gray-200 text-sm sm:text-base leading-relaxed mb-6 max-w-xl font-normal">
            La pasión no tiene categoría. En Trapos de Primera encontrás camisetas de la Primera Nacional, la Primera B Metropolitana y todos esos clubes que hacen grande al fútbol argentino.
          </p>

          <div class="flex flex-wrap items-center gap-4">
            <button
              @click="filterAscenso('Primera Nacional')"
              class="inline-flex items-center justify-center bg-[#48B0DA] hover:bg-[#3ca0c9] text-white text-sm font-bold px-6 py-2.5 rounded transition-colors shadow-xs cursor-pointer"
            >
              Primera Nacional →
            </button>
            <button
              @click="filterAscenso('Primera B Metropolitana')"
              class="inline-flex items-center justify-center bg-[#48B0DA] hover:bg-[#3ca0c9] text-white text-sm font-bold px-6 py-2.5 rounded transition-colors shadow-xs cursor-pointer"
            >
              Primera B Metropolitana →
            </button>
          </div>
        </div>

        <div class="lg:col-span-5 hidden lg:flex justify-end pr-4">
          <div class="bg-white/10 backdrop-blur-xs border border-white/20 p-4 rounded text-center rotate-1 shadow-lg max-w-xs">
            <p class="font-condensed text-2xl font-black uppercase text-white tracking-wider leading-none">
              EL FÚTBOL<br />TAMBIÉN LATE<br />
              <span class="text-[#48B0DA]">EN EL ASCENSO</span>
            </p>
          </div>
        </div>
      </div>
    </section>
    <!-- END: AscensoBannerSection -->

    <!-- BEGIN: ContactSection -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-12" data-purpose="contact-form-section">
      <div class="flex items-center gap-4 mb-2">
        <h2 class="font-condensed text-3xl sm:text-4xl font-black tracking-tight text-[#0C2333] dark:text-[#F7F4EA] sm:whitespace-nowrap">
          HABLEMOS DE CAMISETAS
        </h2>
        <div class="flex-grow h-[1.5px] bg-[#D8B15E]/70"></div>
      </div>

      <p class="text-[#0C2333]/80 dark:text-slate-300 text-sm sm:text-base mb-8 font-normal">
        ¿Tenés alguna consulta? Escribinos y te ayudamos.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <!-- Left: Contact Form -->
        <div class="lg:col-span-8">
          <div v-if="formSent" class="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 p-4 rounded-md mb-4 text-sm font-semibold">
            ✓ ¡Mensaje enviado con éxito! Nos pondremos en contacto con vos a la brevedad.
          </div>

          <form @submit.prevent="handleContactSubmit" class="space-y-4" novalidate>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="sr-only" for="name-input">Nombre</label>
                <input
                  id="name-input"
                  v-model="contactForm.name"
                  class="w-full bg-[#f2eee3] dark:bg-slate-800 border border-[#d8d2c2] dark:border-slate-700 rounded px-4 py-2.5 text-sm text-[#0C2333] dark:text-slate-100 focus:ring-2 focus:ring-[#48B0DA] outline-none placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  placeholder="Nombre"
                  type="text"
                />
                <p v-if="contactErrors.name" class="text-[11px] text-red-500 font-semibold mt-1">{{ contactErrors.name }}</p>
              </div>
              <div>
                <label class="sr-only" for="email-input">Email</label>
                <input
                  id="email-input"
                  v-model="contactForm.email"
                  class="w-full bg-[#f2eee3] dark:bg-slate-800 border border-[#d8d2c2] dark:border-slate-700 rounded px-4 py-2.5 text-sm text-[#0C2333] dark:text-slate-100 focus:ring-2 focus:ring-[#48B0DA] outline-none placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  placeholder="Email"
                  type="email"
                />
                <p v-if="contactErrors.email" class="text-[11px] text-red-500 font-semibold mt-1">{{ contactErrors.email }}</p>
              </div>
            </div>

            <div>
              <label class="sr-only" for="message-input">Mensaje</label>
              <textarea
                id="message-input"
                v-model="contactForm.message"
                class="w-full bg-[#f2eee3] dark:bg-slate-800 border border-[#d8d2c2] dark:border-slate-700 rounded px-4 py-2.5 text-sm text-[#0C2333] dark:text-slate-100 focus:ring-2 focus:ring-[#48B0DA] outline-none placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-y"
                placeholder="Mensaje"
                rows="5"
              ></textarea>
              <p v-if="contactErrors.message" class="text-[11px] text-red-500 font-semibold mt-1">{{ contactErrors.message }}</p>
            </div>

            <button
              class="w-full bg-[#48B0DA] hover:bg-[#3ca0c9] text-white font-bold py-3 px-6 rounded transition-colors text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              type="submit"
            >
              <span>Enviar</span>
              <span>→</span>
            </button>
          </form>
        </div>

        <!-- Right: Support Box with Golden Left Border -->
        <div class="lg:col-span-4 border-l-2 border-[#D8B15E] pl-6 sm:pl-8 py-2">
          <div class="flex items-start gap-4">
            <div class="text-[#48B0DA] shrink-0 mt-0.5">
              <svg class="w-10 h-10 stroke-[#48B0DA] fill-none" stroke-width="2" viewBox="0 0 24 24">
                <path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.636 1.054.498 1.666l-.504 2.222c-.135.594.398 1.096.969.914l2.584-.823a2.38 2.38 0 011.512.062c.54.218 1.107.329 1.668.329z" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>
            <div>
              <h3 class="font-condensed text-xl sm:text-2xl font-black tracking-tight text-[#0C2333] dark:text-[#F7F4EA] leading-tight mb-2">
                CONSULTAS SOBRE CAMISETAS, TALLES Y DISPONIBILIDAD
              </h3>
            </div>
          </div>
          <div class="w-12 h-[2px] bg-[#D8B15E] my-4"></div>
          <p class="text-xs sm:text-sm text-[#0C2333]/80 dark:text-slate-300 leading-relaxed font-normal">
            Estamos para ayudarte con cualquier duda sobre productos, talles, stock o lo que necesites saber antes de tu compra. Respondemos en menos de 2 horas en días hábiles.
          </p>
        </div>
      </div>
    </section>
    <!-- END: ContactSection -->
  </main>
</template>
