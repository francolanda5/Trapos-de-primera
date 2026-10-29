# Trapos de Primera - Plan de Mejoras Integrales y Gestión Avanzada

Plan de evolución para **Trapos de Primera**, incorporando gestión de existencias independientes por talle, flujo de compra completo en página dedicada, panel administrativo de pedidos con trazabilidad de stock, autenticación con roles y Google Identity, modo oscuro/claro con paleta institucional, drawer de favoritos y navbar dinámico.

---

### Decisiones de Usuario y Confirmaciones

> [!IMPORTANT]
> Decisiones confirmadas en la etapa de clarificación:
> - **Proceso de Compra**: Página dedicada `/checkout` estructurada en 5 etapas progresivas (Revisión de productos, Datos personales, Entrega/Domicilio, Método de pago con comprobante, Resumen y Confirmación).
> - **Roles de Usuario**: Cuenta administradora preconfigurada (`admin@traposdeprimera.com`) con selector de rol rápido para pruebas, protegiendo rutas y acciones de gestión (`/admin/*`).
> - **Favoritos**: Panel deslizable lateral (`FavoritesDrawer.vue`) accesible desde el icono de corazón en el navbar, sincronizado con LocalStorage y separable por usuario.

---

### 1. Visión General de las Mejoras

El proyecto se consolidará como una solución completa de comercio electrónico y administración con:
- **Gestión precisa de inventario por talle**: Cada camiseta cuenta con cantidades específicas por talle (`S, M, L, XL, XXL`), deshabilitando talles agotados e impidiendo sobreventas.
- **Ciclo de vida completo del pedido**: Descuento atómico de stock al confirmar el pedido, registro con código único, carga de comprobantes de pago (base64 persistente) y restitución de stock si el pedido es cancelado.
- **Acceso y Perfil de Usuario**: Login/Registro local seguro (sin passwords en texto plano), preparación para Google OAuth (Google Identity Services) y menú de usuario para ver pedidos propios.
- **Tema Claro / Oscuro**: Basado en los colores institucionales (`#0C2333`, `#48B0DA`, `#F7F4EA`, `#D8B15E`), con persistencia en LocalStorage.
- **Cumplimiento estricto de la consigna ISEC**: Vue CLI/Vite, Vue Router, 5 vistas requeridas, 8 componentes reutilizables, props/emits, computed properties, hooks `created()` y `mounted()`, transiciones `<transition>` y `<transition-group>`, LocalStorage y Fetch API.

---

### 2. Especificación Visual y Experiencia de Usuario

#### A. Navbar y Logo
- **Tamaño del Logo**: Se incrementa moderadamente su escala (de `h-10 sm:h-12` a `h-12 sm:h-16`) manteniendo proporciones exactas y preservando la adaptabilidad en pantallas móviles.
- **Detección Activa de Categorías**:
  - Al ingresar en *Primera*, *Ascenso*, *Selección*, *Retro*, *Actuales*, o *Inicio*, la opción correspondiente se resalta de forma idéntica (texto celeste `#48B0DA` y borde inferior `border-b-2`).
  - Detección reactiva mediante `useRoute()` evaluando tanto la ruta (`route.path`) como los parámetros de consulta (`route.query.categoria` y `route.query.era`).
- **Acceso de Usuarios**: Reemplazo del botón "+ Gestionar" en el header por:
  - Botones *"Iniciar sesión"* y *"Crear cuenta"* (o avatar/nombre y dropdown con *"Mis Pedidos"* y *"Cerrar sesión"* si está autenticado).
  - El acceso administrativo *"Gestionar"* se traslada al footer y al menú desplegable exclusivo de usuarios con rol `admin`.
- **Selector de Modo Oscuro / Claro**: Botón de alternancia rápida (Sol / Luna) visible en la barra superior.

#### B. Paleta de Modo Oscuro & Claro
- **Modo Claro (Predeterminado)**:
  - Fondo general: `#F7F4EA` (crema cálido)
  - Textos principales y encabezados: `#0C2333` (azul noche)
  - Acentos interactivos y botones: `#48B0DA` (celeste)
  - Detalles y líneas divisorias: `#D8B15E` (dorado)
  - Tarjetas: `#FFFFFF` y `#EFECE1`
- **Modo Oscuro**:
  - Fondo general: `#081722` (azul muy oscuro)
  - Superficies y tarjetas: `#0C2333` y `#112C3F`
  - Bordes y divisores: `#1E4663` y `#D8B15E`
  - Textos: `#F7F4EA` y `#C9D6DF`
  - Acentos: `#48B0DA` y `#E2BF65`

#### C. Drawer de Favoritos (`FavoritesDrawer.vue`)
- Despliegue lateral animado al pulsar el corazón en el header.
- Listado de camisetas guardadas con foto, equipo, temporada, precio y botón rápido para ir a la ficha de detalle o eliminar de favoritos.
- Estado vacío con sugerencia de exploración al catálogo.

---

### 3. Modelo de Datos y Lógica de Negocio

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Estructura de Datos                             │
├────────────────────────────────────────────────────────────────────────┤
│ Jersey:                                                                │
│  - id, name, team, category, era, season, type, price, image           │
│  - sizeStock: { S: number, M: number, L: number, XL: number, XXL: ... }│
│  - stock: number (calculado dinámicamente como la suma de sizeStock)  │
├────────────────────────────────────────────────────────────────────────┤
│ Order:                                                                 │
│  - id: "TDP-2026-XXXX" (único)                                         │
│  - date: ISO timestamp                                                 │
│  - customer: { name, lastName, email, phone, address, city, zip }       │
│  - deliveryMethod: 'shipping' | 'pickup'                               │
│  - paymentMethod: 'efectivo' | 'tarjeta' | 'mercadopago'               │
│  - receiptImage?: string (base64 persistente para revisión manual)     │
│  - items: [{ jerseyId, name, size, quantity, unitPrice, image }]       │
│  - total: number                                                       │
│  - status: 'Pendiente' | 'Pagado' | 'Cancelado'                        │
│  - stockDeducted: boolean                                              │
├────────────────────────────────────────────────────────────────────────┤
│ User & Auth:                                                           │
│  - id, email, name, role: 'customer' | 'admin', googleId?              │
│  - passwordHash (almacenamiento no plano)                              │
│  - orders: string[]                                                    │
└────────────────────────────────────────────────────────────────────────┘
```

#### Reglas de Stock y Pedidos
1. **Validación al agregar al carrito**: Solo se pueden seleccionar talles con stock $> 0$. Si el usuario intenta agregar más unidades de las disponibles en ese talle, se muestra una alerta impidiendo exceder la existencia.
2. **Descuento al confirmar la compra**: Al confirmar el pedido, las unidades se descuentan del `sizeStock` correspondiente de cada camiseta. El stock total se recalcula automáticamente.
3. **Reversión de stock por cancelación**: Si un administrador cancela el pedido desde `/admin/pedidos`, el sistema reintegra automáticamente las cantidades a sus talles respectivos (una sola vez mediante el flag `stockDeducted`).
4. **Cambio de estado a "Pagado"**: No vuelve a descontar stock.
5. **Migración de datos existentes**: Se aplica un script de inicialización que garantiza que las camisetas preexistentes que tenían solo stock total cuenten con un reparto equilibrado y configurable por talle sin pérdida de información.

---

### 4. Arquitectura y Componentes Técnicos

```
src/
├── components/
│   ├── TDPNavbar.vue          # Header con logo aumentado, active states, auth y favoritos
│   ├── TDPFooter.vue          # Pie con acceso a administración y cambio de tema
│   ├── ProductCard.vue        # Tarjeta con talles deshabilitados si stock es 0
│   ├── SearchBar.vue          # Buscador reactivo
│   ├── ConfirmModal.vue       # Diálogo modal accesible
│   ├── CartDrawer.vue         # Drawer con botón "Iniciar compra" hacia /checkout
│   ├── FavoritesDrawer.vue    # Panel deslizable de favoritos
│   ├── AuthModal.vue          # Modal de inicio de sesión y registro de usuarios
│   └── FilterAccordion.vue    # Acordeón de filtros
├── views/
│   ├── HomeView.vue           # Inicio
│   ├── CatalogView.vue        # Listado con filtros y stock en vivo
│   ├── ProductDetailView.vue  # Detalle con selección de talle según stock real
│   ├── ManageJerseyView.vue   # Alta y edición con stock individual por talle
│   ├── AboutView.vue          # Acerca de y contacto
│   ├── CheckoutView.vue       # Flujo de compra en 5 pasos
│   ├── AdminOrdersView.vue    # Administración de pedidos y comprobantes
│   └── UserOrdersView.vue     # Mis Pedidos para el cliente autenticado
├── store/
│   ├── useStore.ts            # Estado reactivo global, persistencia LocalStorage
│   └── useAuth.ts             # Estado de autenticación, roles y Google Identity
└── services/
    ├── supabaseService.ts     # Consumo Fetch de API externa
    └── googleAuthService.ts   # Integración preparada para Google Cloud GIS
```

---

### 5. Plan de Ejecución por Pasos

1. **Modelo de Stock por Talle y Migración**:
   - Actualizar tipos en `src/types/index.ts` agregando `sizeStock: Record<string, number>`.
   - Modificar `src/data/initialJerseys.ts` y función de carga para asegurar que todas las camisetas tengan stock por talle.
2. **Store de Pedidos y Lógica de Compra**:
   - Crear entidades `Order`, funciones de creación, descuento de stock y restitución al cancelar en `src/store/useStore.ts`.
3. **Página de Checkout (`/checkout`)**:
   - Desarrollar `CheckoutView.vue` con 5 pasos, selector de método de pago (Efectivo, Tarjeta, Mercado Pago), carga de comprobante en base64, validaciones en tiempo real y prevención de doble clic.
4. **Panel de Administración de Pedidos (`/admin/pedidos`)**:
   - Desarrollar `AdminOrdersView.vue` con filtro de estados, detalle de comprobante y cambio de estado con confirmación.
5. **Autenticación, Roles y Google Identity**:
   - Crear `src/store/useAuth.ts` con cuenta admin predeterminada (`admin@traposdeprimera.com`), registro de clientes, hashing simple y servicio para Google Sign-In (`googleAuthService.ts`).
   - Crear `AuthModal.vue` y vista de pedidos del cliente `UserOrdersView.vue`.
6. **Favoritos y Drawer (`FavoritesDrawer.vue`)**:
   - Crear el componente deslizable y sincronizarlo con el contador del navbar.
7. **Modo Claro / Oscuro y Estilizado Global**:
   - Implementar toggle de tema con persistencia en LocalStorage (`tdp_theme`) y clases CSS semánticas en `src/index.css` y `App.vue`.
8. **Navbar Activo y Escala de Logo**:
   - Refactorizar `TDPNavbar.vue` para resaltar categorías según queries de ruta, aumentar moderadamente el logo y añadir controles de auth/favoritos.
9. **Verificación y Actualización de README**:
   - Verificar compilación, linting y los 11 recorridos solicitados.
   - Documentar en `README.md` instrucciones de Google Cloud OAuth y limitaciones locales.
