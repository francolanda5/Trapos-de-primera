import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './index.css';

// Fallback global de imágenes: si una imagen no carga, se reemplaza por una local.
// El evento 'error' de las imágenes no burbujea: por eso se escucha en fase de captura (true).
const FALLBACK_IMAGE = '/sin-imagen.svg';
document.addEventListener(
  'error',
  (event) => {
    const target = event.target;
    if (target instanceof HTMLImageElement && !target.src.endsWith(FALLBACK_IMAGE)) {
      target.src = FALLBACK_IMAGE;
    }
  },
  true
);

const app = createApp(App);
app.use(router);
app.mount('#app');
