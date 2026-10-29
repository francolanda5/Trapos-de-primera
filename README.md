# TRAPOS DE PRIMERA — Camisetas Argentinas (Vue.js SPA)

**Materia**: Práctica Profesionalizante Desarrollo Web y Mobile  
**Institución**: ISEC — Tecnicatura Superior en Diseño Multimedial  
**Docente**: ROMERO, Facundo  
**Modalidad**: Trabajo Práctico Integrador Final / Examen  

---

## 📌 Descripción del Proyecto

**Trapos de Primera** es una Single Page Application (SPA) para comercio electrónico y gestión integral de indumentaria futbolística argentina. Reúne camisetas oficiales de la temporada actual y reediciones históricas retro de Primera División, Primera Nacional, Primera B Metropolitana y la Selección Argentina.

La aplicación replica el diseño y proporciones de las maquetas originales, e incorpora un sistema CRUD completo, gestión de inventario por talle, persistencia en `localStorage`, autenticación con roles diferenciados (Cliente y Administrador), integración con Google Identity Services (GIS), pasarela de checkout por pasos, panel de gestión de pedidos con reversión automática de stock, alternancia de modo claro/oscuro y consumo de API externa vía `Fetch`.

---

## 🚀 Tecnologías y Herramientas

- **Framework**: [Vue.js 3](https://vuejs.org/) (Composition API con `<script setup lang="ts">`)
- **Enrutador**: [Vue Router 4](https://router.vuejs.org/) (Modo History con ScrollBehavior)
- **Bundler y Dev Server**: [Vite 8](https://vitejs.dev/) + `@vitejs/plugin-vue`
- **Estilos y Maquetación**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Lenguaje**: TypeScript (Strict Mode)
- **Criptografía**: Web Crypto API nativa (`crypto.subtle.digest('SHA-256')`) para almacenamiento seguro de contraseñas
- **Persistencia**: `localStorage` (catálogo de 18 camisetas, stock por talle, carrito, favoritos por usuario, pedidos con comprobantes y modo de tema)
- **Consumo de API**: `fetch()` asincrónico para sincronización remota (Supabase REST) y cotizaciones en vivo (Dólar API)

---

## 🛠️ Cumplimiento de la Consigna del Examen (ISEC)

### 1. Gestión de Elementos (CRUD Completo)
- **Crear**: Formulario de alta en `/admin/camisetas` con carga de stock independiente por talle (S, M, L, XL, XXL) y cálculo reactivo del stock total.
- **Visualizar**: Listado dinámico en `/catalogo` con paginación, y vista enriquecida en `/camiseta/:id`.
- **Modificar**: Edición completa en `/admin/editar/:id`.
- **Eliminar**: Baja con diálogo modal de confirmación `ConfirmModal.vue`.
- **Mínimo de 15 elementos**: 18 camisetas reales iniciales de clubes de Primera, Ascenso y la Selección Argentina.

### 2. Búsqueda, Filtrado y Ordenamiento
- **Buscador por texto**: Búsqueda en tiempo real desde el Navbar global y desde el catálogo.
- **Filtro por categoría**: Primera División, Primera Nacional, Primera B Metropolitana, Selección Argentina.
- **Filtro por época**: Actuales vs. Retro, y décadas ('80, '90, '00, '10).
- **Filtro por equipo**: Búsqueda reactiva de clubes y filtrado múltiple.
- **Filtro por talle**: S, M, L, XL, XXL con detección de stock real.
- **Filtro de precio**: Slider continuo de ARS 0 a ARS 300.000.
- **Ordenamiento**: Menor a mayor precio, mayor a menor precio, más recientes y alfabético.

### 3. Navegación con Vue Router (8 Rutas)
- `/`: **Inicio** (Hero, categorías interactivas, banners Actuales/Retro, Recién llegadas, Maratón 1986, Banner Ascenso y Más buscadas).
- `/catalogo`: **Catálogo** (Filtros en sidebar colapsable, grilla animada, contador de productos y paginación).
- `/camiseta/:id`: **Detalle de Producto** (Galería fotográfica, selector de talle con indicación de stock y agotado, acordeones técnicos y sugerencias).
- `/checkout`: **Proceso de Compra** (5 pasos guiados: Revisión de productos, Datos del comprador, Envío o retiro, Medio de pago con subida de comprobante y Confirmación con código de orden).
- `/mis-pedidos`: **Historial del Cliente** (Seguimiento de pedidos realizados).
- `/admin/camisetas`: **Alta de Camiseta** (Editor con vista previa en vivo).
- `/admin/editar/:id`: **Edición de Camiseta**.
- `/admin/pedidos`: **Gestión de Pedidos** (Filtro por estado, visor de comprobante en base64, cambio de estado a Pagado o Cancelado con reversión atómica de stock).
- `/acerca-de`: **Institucional** (Historia, valores, sección de ascenso y formulario de contacto).

### 4. Formularios y Validaciones
- Enlace bidireccional reactivo con `v-model`.
- Validaciones personalizadas con alertas visibles:
  - Campos obligatorios (nombre, equipo, categoría, época, temporada, precio, stock por talle, descripción, imagen).
  - Longitud mínima (nombre $\ge 3$ caracteres, descripción $\ge 15$ caracteres).
  - Formatos válidos (precio $> 0$, stock $\ge 0$, temporadas numéricas).
  - Prevención de doble clic y estados deshabilitados durante el envío.

### 5. Persistencia Local
- Todo el estado se sincroniza en `localStorage`:
  - `tdp_jerseys_v2`: Catálogo completo con `sizeStock`.
  - `tdp_cart_v2`: Carrito con talle y cantidad.
  - `tdp_favorites_v2_[userId]`: Favoritos vinculados al usuario logueado.
  - `tdp_orders_v2`: Pedidos con información de comprador, items, totales y comprobantes en base64.
  - `tdp_theme_v2`: Preferencia de tema Claro / Oscuro.
  - `tdp_users_v1` y `tdp_current_user_v1`: Usuarios registrados (con contraseñas hasheadas en SHA-256) y sesión activa.

### 6. Consumo de API con Fetch
- Módulo `src/services/supabaseService.ts`:
  - Consumo HTTP `fetch()` con endpoints REST de Supabase.
  - Sincronización en segundo plano y fallback automático con manejo de estados (`idle`, `loading`, `success`, `fallback`).
  - Consulta de cotización Dólar API para conversión referencial.

### 7. Requisitos Técnicos de Vue
- **Componentes Reutilizables (9 componentes)**:
  1. `TDPNavbar.vue` (Navegación activa según queries, buscador, carrito, favoritos y selector de tema)
  2. `TDPFooter.vue` (Pie institucional, enlaces de administración y reset de base de datos)
  3. `ProductCard.vue` (Tarjeta vertical y horizontal con selección de talle y deshabilitado por falta de stock)
  4. `SearchBar.vue` (Barra de búsqueda reactiva con two-way binding y emits)
  5. `FilterAccordion.vue` (Acordeón colapsable para filtros y especificaciones técnicas)
  6. `CartDrawer.vue` (Drawer lateral con selector de cantidad y botón directo a Checkout)
  7. `FavoritesDrawer.vue` (Drawer lateral de favoritos con transición de lista y acceso a detalle)
  8. `AuthModal.vue` (Modal de autenticación con Google GIS y acceso rápido para pruebas)
  9. `ConfirmModal.vue` (Modal de confirmación para bajas de producto y cancelaciones de pedidos)
- **Comunicación entre componentes**: Riguroso uso de `props` y `emits`.
- **Computed Properties**: `filteredJerseys`, `cartTotal`, `cartCount`, `favoritesCount`, `paginatedJerseys`, `totalPages`, `recentArrivals`, `mostSearched`, `totalStock`, etc.
- **Ciclo de Vida**:
  - `created()` (fase ejecutada en el cuerpo de `<script setup>` antes del montaje).
  - `onMounted()` para inicialización de APIs, renderizado de Google Identity Services y scroll restoration.
- **Transiciones**:
  - `<transition name="fade">`, `<transition name="slide">`, `<transition name="modal">`.
  - `<transition-group name="list">` y `<transition-group name="cart-item">`.
- **Diseño Responsive**: Probado en móviles, tablets y monitores de escritorio.

---

## 🎨 Identidad Visual y Modo Claro / Oscuro

El proyecto aplica la paleta institucional de Trapos de Primera:
- **Azul marino profundo**: `#0C2333`
- **Celeste bandera**: `#48B0DA`
- **Blanco cálido**: `#F7F4EA`
- **Dorado de laureles**: `#D8B15E`

El botón en el Navbar permite alternar entre Modo Claro y Modo Oscuro, aplicando la clase `dark` al elemento raíz y persistiendo la selección en `localStorage`.

---

## 🔐 Autenticación y Roles

La plataforma separa la autenticación de la autorización:
1. **Cuentas Preconfiguradas para Pruebas**:
   - **Administrador**: `admin@traposdeprimera.com` / `admin123`
   - **Cliente**: `franco@gmail.com` / `cliente123`
   - *(En el modal de inicio de sesión existe un botón "Ingresar como Admin de prueba" para facilitar la corrección rápida).*
2. **Seguridad**: Las contraseñas nunca se guardan en texto plano; se utiliza SHA-256 mediante `crypto.subtle`.
3. **Google Identity Services (GIS)**:
   - Configurar la variable de entorno `VITE_GOOGLE_CLIENT_ID` en el archivo `.env`.
   - Si no está configurada, el modal provee un simulador transparente que emula el token JWT de Google con rol `customer`.
   - Cualquier usuario que ingresa vía Google obtiene exclusivamente el rol `customer`, garantizando que el acceso administrativo sea reservado.

---

## 📦 Inventario por Talle y Flujo de Checkout

1. **Stock por Talle**: Cada camiseta tiene un diccionario `sizeStock: { S: number, M: number, L: number, XL: number, XXL: number }`. En las tarjetas y fichas de producto, los talles sin stock quedan deshabilitados visualmente (`line-through` y cursor no disponible).
2. **Checkout en 5 Pasos**:
   - Paso 1: Revisión de prendas y talles seleccionados.
   - Paso 2: Información del comprador con validaciones de email y teléfono.
   - Paso 3: Método de entrega (Envío a domicilio o Retiro en tienda).
   - Paso 4: Método de pago (Efectivo, Tarjeta de crédito o Transferencia / Mercado Pago con subida de comprobante).
   - Paso 5: Resumen y confirmación final generando el código de pedido (ej: `TDP-2026-XXXX`).
3. **Deducción y Reversión Atómica**: Al confirmar el pedido, el stock del talle exacto se descuenta de forma inmediata. Si un administrador cancela el pedido desde `/admin/pedidos`, el sistema restaura automáticamente el stock a cada talle involucrado.

---

## 💻 Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor en modo desarrollo
npm run dev

# 3. Compilar para producción
npm run build
```
