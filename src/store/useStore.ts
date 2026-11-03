import { reactive, ref, computed, watch } from 'vue';
import type { Jersey, CartItem, FilterState, Order, OrderStatus, BuyerInfo, PaymentMethod, DeliveryMethod } from '../types';
import { INITIAL_JERSEYS } from '../data/initialJerseys';
import { getGeneratedImages, isLegacyPhoto, upgradeJerseyImages } from '../data/jerseyImages';
import { fetchDolarQuotes } from '../services/apiService';
import { currentUser, openLoginModal } from './useAuth';

const STORAGE_KEYS = {
  JERSEYS: 'tdp_jerseys_v2',
  CART: 'tdp_cart_v2',
  FAVORITES: 'tdp_favorites_v2',
  ORDERS: 'tdp_orders_v2',
  THEME: 'tdp_theme_v2'
};

// 1. Migración y carga de camisetas con stock independiente por talle
function migrateAndLoadJerseys(): Jersey[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.JERSEYS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((j: any) => {
          // Si no tiene sizeStock o es inválido, migramos proporcionalmente
          if (!j.sizeStock || typeof j.sizeStock !== 'object') {
            const sizeStock: Record<string, number> = {};
            const sizes = j.sizes && j.sizes.length > 0 ? j.sizes : ['S', 'M', 'L', 'XL'];
            const baseQty = Math.max(1, Math.floor((j.stock || 8) / sizes.length));
            sizes.forEach((s: string, idx: number) => {
              // Dejamos un talle en 0 para ejemplificar si corresponde
              sizeStock[s] = idx === sizes.length - 1 && j.stock > 4 ? 0 : baseQty;
            });
            j.sizeStock = sizeStock;
          }
          if (!Array.isArray(j.sizes)) j.sizes = Object.keys(j.sizeStock);
          // Stock total = suma de talles
          j.stock = Object.values(j.sizeStock as Record<string, number>).reduce((a, b) => a + Number(b || 0), 0);
          return upgradeJerseyImages(j as Jersey);
        });
      }
    }
  } catch (e) {
    console.error('Error al leer LocalStorage jerseys:', e);
  }
  return JSON.parse(JSON.stringify(INITIAL_JERSEYS));
}

function loadStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CART);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Se descartan ítems viejos o dañados para que no rompan la app
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item?.jersey?.id && item.size)
          .map((item) => ({ ...item, jersey: upgradeJerseyImages(item.jersey) })); // el carrito guarda una copia de la camiseta
      }
    }
  } catch (e) {
    console.error('Error al leer LocalStorage cart:', e);
  }
  return [];
}

function loadStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Se descartan pedidos viejos o dañados para que no rompan la app
      if (Array.isArray(parsed)) {
        const valid: Order[] = parsed.filter((o) => o?.id && o.buyer && Array.isArray(o.items));
        // Cada ítem guarda su imagen: si es una foto del catálogo anterior, pasa a la nueva.
        valid.forEach((order) => {
          order.items.forEach((item) => {
            const generated = getGeneratedImages(item.jerseyId);
            if (generated && isLegacyPhoto(item.image)) item.image = generated.image;
          });
        });
        return valid;
      }
    }
  } catch (e) {
    console.error('Error al leer pedidos de LocalStorage:', e);
  }
  // Pedido de demostración: pertenece a la cuenta de prueba cliente (franco@gmail.com)
  return [
    {
      id: 'TDP-2026-1042',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      buyer: {
        name: 'Franco',
        lastName: 'Fusco',
        email: 'franco@gmail.com',
        phone: '+54 11 4455-6677',
        address: 'Av. Corrientes 1234, 4B',
        city: 'CABA',
        postalCode: '1043'
      },
      deliveryMethod: 'shipping',
      paymentMethod: 'mercadopago',
      receiptImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=60',
      items: [
        {
          jerseyId: 'arg-1986',
          name: 'Argentina 1986',
          team: 'Argentina',
          season: '1986',
          size: 'M',
          quantity: 1,
          unitPrice: 89999,
          image: '/assets/jerseys/arg-1986-frente.webp'
        }
      ],
      subtotal: 89999,
      shippingCost: 0,
      total: 89999,
      status: 'Pendiente',
      stockDeducted: true,
      userId: 'user-customer'
    }
  ];
}

function loadStoredTheme(): 'light' | 'dark' {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME);
    if (raw === 'dark' || raw === 'light') return raw;
  } catch (e) {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Cada cuenta tiene sus favoritos en su propia clave. Un invitado no tiene favoritos.
function loadStoredFavorites(userId?: string): string[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.FAVORITES}_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

// Limpieza: versiones anteriores guardaban favoritos de invitados en esta clave.
try {
  localStorage.removeItem(`${STORAGE_KEYS.FAVORITES}_guest`);
} catch (e) {}

// 2. Estado Global Reactivo
export const jerseys = ref<Jersey[]>(migrateAndLoadJerseys());
export const cart = ref<CartItem[]>(loadStoredCart());
export const orders = ref<Order[]>(loadStoredOrders());
export const theme = ref<'light' | 'dark'>(loadStoredTheme());

// Control de Drawers y Modales
export const isCartOpen = ref<boolean>(false);
export const isFavoritesOpen = ref<boolean>(false);

// Favoritos reactivos sincronizados con usuario actual
export const favorites = ref<string[]>(loadStoredFavorites(currentUser.value?.id));

// Al cambiar de usuario se cargan sus favoritos. Al cerrar sesión quedan vacíos en memoria.
// Los pedidos no hace falta limpiarlos: cada vista los filtra según el usuario actual.
watch(
  currentUser,
  (newUser) => {
    favorites.value = loadStoredFavorites(newUser?.id);
    if (!newUser) isFavoritesOpen.value = false;
  },
  { immediate: true }
);

watch(
  favorites,
  (newVal) => {
    if (!currentUser.value) return; // sin sesión no se guarda nada
    try {
      localStorage.setItem(`${STORAGE_KEYS.FAVORITES}_${currentUser.value.id}`, JSON.stringify(newVal));
    } catch (e) {}
  },
  { deep: true }
);

// Aplicar tema en el documento
export function applyTheme(t: 'light' | 'dark') {
  theme.value = t;
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, t);
  } catch (e) {}
  if (t === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function toggleTheme() {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark');
}

// Inicializar tema de inmediato
applyTheme(theme.value);

export const deleteModalState = reactive<{
  isOpen: boolean;
  jersey: Jersey | null;
}>({
  isOpen: false,
  jersey: null
});

// Estado de la cotización que trae DolarAPI (ver initializeApiService)
export const dolarStatus = ref<'loading' | 'ok' | 'error'>('loading');

export const liveAnnouncement = ref<string>('CAMISETAS ARGENTINAS, DE TODAS LAS ÉPOCAS');

// Filtros globales para el catálogo
export const filterState = reactive<FilterState>({
  search: '',
  teamSearch: '',
  categories: [],
  era: 'Todas',
  decade: 'Todas las épocas',
  selectedTeams: [],
  selectedSizes: [],
  minPrice: 0,
  maxPrice: 300000,
  sortBy: 'price-asc'
});

// 3. Sincronización automática de Store con LocalStorage
watch(
  jerseys,
  (newVal) => {
    try {
      localStorage.setItem(STORAGE_KEYS.JERSEYS, JSON.stringify(newVal));
    } catch (e) {
      console.error('Error al guardar camisetas en LocalStorage:', e);
    }
  },
  { deep: true }
);

watch(
  cart,
  (newVal) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(newVal));
    } catch (e) {
      console.error('Error al guardar carrito en LocalStorage:', e);
    }
  },
  { deep: true }
);

watch(
  orders,
  (newVal) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(newVal));
    } catch (e) {
      console.error('Error al guardar pedidos en LocalStorage:', e);
    }
  },
  { deep: true }
);

// 4. Propiedades Computadas (Requisitos técnicos: al menos 2 computed properties)
export const cartCount = computed(() => {
  return cart.value.reduce((acc, item) => acc + item.quantity, 0);
});

export const cartTotal = computed(() => {
  return cart.value.reduce((acc, item) => acc + item.jersey.price * item.quantity, 0);
});

export const favoriteJerseys = computed(() => {
  return jerseys.value.filter((j) => favorites.value.includes(j.id));
});

// Se cuentan las camisetas que existen: si el admin borró una favorita, no suma.
export const favoritesCount = computed(() => {
  return favoriteJerseys.value.length;
});

export const filteredJerseys = computed(() => {
  let list = [...jerseys.value];

  // Búsqueda general por texto
  if (filterState.search.trim()) {
    const q = filterState.search.toLowerCase().trim();
    list = list.filter(
      (j) =>
        j.name.toLowerCase().includes(q) ||
        j.team.toLowerCase().includes(q) ||
        j.category.toLowerCase().includes(q) ||
        j.season.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q)
    );
  }

  // Búsqueda específica por equipo
  if (filterState.teamSearch.trim()) {
    const tq = filterState.teamSearch.toLowerCase().trim();
    list = list.filter((j) => j.team.toLowerCase().includes(tq) || j.name.toLowerCase().includes(tq));
  }

  // Filtro por Categorías seleccionadas
  if (filterState.categories.length > 0) {
    list = list.filter((j) => filterState.categories.includes(j.category));
  }

  // Filtro por Época (Actual / Retro / Todas)
  if (filterState.era !== 'Todas') {
    list = list.filter((j) => j.era.toLowerCase() === filterState.era.toLowerCase());
  }

  // Filtro por Década
  if (filterState.decade && filterState.decade !== 'Todas las épocas') {
    list = list.filter((j) => j.decade === filterState.decade);
  }

  // Filtro por Equipos seleccionados
  if (filterState.selectedTeams.length > 0) {
    list = list.filter((j) => filterState.selectedTeams.includes(j.team));
  }

  // Filtro por Talles seleccionados (considerando que tengan stock disponible en ese talle)
  if (filterState.selectedSizes.length > 0) {
    list = list.filter((j) =>
      filterState.selectedSizes.some((s) => (j.sizeStock[s] || 0) > 0)
    );
  }

  // Filtro por Precio Máximo
  if (filterState.maxPrice > 0) {
    list = list.filter((j) => j.price <= filterState.maxPrice);
  }

  // Ordenamiento
  if (filterState.sortBy === 'price-asc') {
    list.sort((a, b) => a.price - b.price);
  } else if (filterState.sortBy === 'price-desc') {
    list.sort((a, b) => b.price - a.price);
  } else if (filterState.sortBy === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (filterState.sortBy === 'recent') {
    list.sort((a, b) => parseInt(b.season.slice(0, 4) || '0') - parseInt(a.season.slice(0, 4) || '0'));
  }

  return list;
});

export const availableTeams = computed(() => {
  const teams = new Set(jerseys.value.map((j) => j.team));
  return Array.from(teams).sort();
});

// 5. Métodos CRUD de Camisetas
export function createJersey(newJerseyData: Omit<Jersey, 'id' | 'stock'> & { sizeStock: Record<string, number> }): Jersey {
  const id = `trapo-${Date.now()}`;
  const now = new Date().toISOString();
  const totalStock = Object.values(newJerseyData.sizeStock).reduce((acc, qty) => acc + Number(qty || 0), 0);

  const created: Jersey = {
    ...newJerseyData,
    id,
    stock: totalStock,
    createdAt: now,
    updatedAt: now
  };

  jerseys.value.unshift(created);
  return created;
}

export function updateJersey(id: string, updatedData: Partial<Jersey>): boolean {
  const index = jerseys.value.findIndex((j) => j.id === id);
  if (index === -1) return false;

  const current = jerseys.value[index];
  const sizeStock = updatedData.sizeStock || current.sizeStock;
  const totalStock = Object.values(sizeStock).reduce((acc, qty) => acc + Number(qty || 0), 0);

  const updated: Jersey = {
    ...current,
    ...updatedData,
    id: current.id,
    sizeStock,
    stock: totalStock,
    updatedAt: new Date().toISOString()
  };

  jerseys.value[index] = updated;

  // Actualizar también en el carrito si existía ese producto
  cart.value = cart.value.map((item) => {
    if (item.jersey.id === id) {
      return { ...item, jersey: updated };
    }
    return item;
  });

  return true;
}

export function deleteJersey(id: string): boolean {
  const initialLength = jerseys.value.length;
  jerseys.value = jerseys.value.filter((j) => j.id !== id);

  cart.value = cart.value.filter((item) => item.jersey.id !== id);
  favorites.value = favorites.value.filter((favId) => favId !== id);

  return jerseys.value.length < initialLength;
}

export function getJerseyById(id: string): Jersey | undefined {
  return jerseys.value.find((j) => j.id === id);
}

export function resetToDefaultJerseys() {
  jerseys.value = JSON.parse(JSON.stringify(INITIAL_JERSEYS));
  localStorage.setItem(STORAGE_KEYS.JERSEYS, JSON.stringify(INITIAL_JERSEYS));
}

// 6. Métodos de Carrito y Validación de Stock por Talle
export function addToCart(jersey: Jersey, size: string, quantity: number = 1): { success: boolean; error?: string } {
  const currentAvailable = jersey.sizeStock[size] || 0;
  if (currentAvailable <= 0) {
    return { success: false, error: `El talle ${size} está agotado actualmente.` };
  }

  const itemKey = `${jersey.id}_${size}`;
  const existing = cart.value.find((item) => item.id === itemKey);

  const newTotalRequested = (existing ? existing.quantity : 0) + quantity;
  if (newTotalRequested > currentAvailable) {
    return {
      success: false,
      error: `Solo hay ${currentAvailable} unidades disponibles en talle ${size}.`
    };
  }

  if (existing) {
    existing.quantity = newTotalRequested;
  } else {
    cart.value.push({
      id: itemKey,
      jersey,
      size,
      quantity
    });
  }
  isCartOpen.value = true;
  return { success: true };
}

export function removeFromCart(itemKey: string) {
  cart.value = cart.value.filter((item) => item.id !== itemKey);
}

export function updateCartQuantity(itemKey: string, delta: number): { success: boolean; error?: string } {
  const existing = cart.value.find((item) => item.id === itemKey);
  if (!existing) return { success: false };

  const currentJersey = getJerseyById(existing.jersey.id) || existing.jersey;
  const currentAvailable = currentJersey.sizeStock[existing.size] || 0;
  const targetQuantity = existing.quantity + delta;

  if (delta > 0 && targetQuantity > currentAvailable) {
    return { success: false, error: `No podés agregar más de ${currentAvailable} unidades en talle ${existing.size}.` };
  }

  existing.quantity = targetQuantity;
  if (existing.quantity <= 0) {
    removeFromCart(itemKey);
  }
  return { success: true };
}

export function clearCart() {
  cart.value = [];
}

// 7. Flujo de Pedidos y Descuento Atómico de Stock
export function createOrder(data: {
  buyer: BuyerInfo;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  receiptImage?: string;
}): { success: boolean; order?: Order; error?: string } {
  if (cart.value.length === 0) {
    return { success: false, error: 'El carrito de compras está vacío.' };
  }

  // 1. Validar existencias de cada talle en el momento de la confirmación
  for (const item of cart.value) {
    const liveJersey = getJerseyById(item.jersey.id);
    if (!liveJersey) {
      return { success: false, error: `La camiseta '${item.jersey.name}' ya no está disponible en catálogo.` };
    }
    const available = liveJersey.sizeStock[item.size] || 0;
    if (item.quantity > available) {
      return {
        success: false,
        error: `Stock insuficiente para ${liveJersey.name} (Talle ${item.size}). Disponibles: ${available}, solicitadas: ${item.quantity}.`
      };
    }
  }

  // 2. Descontar las existencias por talle una sola vez
  cart.value.forEach((item) => {
    const liveJersey = getJerseyById(item.jersey.id);
    if (liveJersey && liveJersey.sizeStock[item.size] !== undefined) {
      liveJersey.sizeStock[item.size] -= item.quantity;
      liveJersey.stock = Object.values(liveJersey.sizeStock).reduce((acc, qty) => acc + qty, 0);
    }
  });

  // 3. Crear el pedido
  const orderNumber = `TDP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderItems = cart.value.map((item) => ({
    jerseyId: item.jersey.id,
    name: item.jersey.name,
    team: item.jersey.team,
    season: item.jersey.season,
    size: item.size,
    quantity: item.quantity,
    unitPrice: item.jersey.price,
    image: item.jersey.image
  }));

  const subtotal = cartTotal.value;
  const shippingCost = data.deliveryMethod === 'shipping' ? 0 : 0; // Envío gratuito
  const newOrder: Order = {
    id: orderNumber,
    createdAt: new Date().toISOString(),
    buyer: { ...data.buyer },
    deliveryMethod: data.deliveryMethod,
    paymentMethod: data.paymentMethod,
    receiptImage: data.receiptImage,
    items: orderItems,
    subtotal,
    shippingCost,
    total: subtotal + shippingCost,
    status: 'Pendiente',
    stockDeducted: true,
    userId: currentUser.value?.id
  };

  orders.value.unshift(newOrder);

  // 4. Vaciar carrito de compras
  clearCart();

  return { success: true, order: newOrder };
}

// Suma (o resta, con signo negativo) las unidades del pedido al stock de cada talle.
function applyOrderToStock(order: Order, sign: 1 | -1) {
  order.items.forEach((item) => {
    const jersey = getJerseyById(item.jerseyId);
    if (jersey && jersey.sizeStock[item.size] !== undefined) {
      jersey.sizeStock[item.size] += sign * item.quantity;
      jersey.stock = Object.values(jersey.sizeStock).reduce((acc, qty) => acc + qty, 0);
    }
  });
}

// Devuelve el motivo por el que un pedido no se puede reactivar, o null si hay stock de todo.
function findStockProblem(order: Order): string | null {
  for (const item of order.items) {
    const jersey = getJerseyById(item.jerseyId);
    if (!jersey) return `${item.name} ya no está en el catálogo`;
    const available = jersey.sizeStock[item.size];
    if (available === undefined) return `${item.name} ya no tiene talle ${item.size}`;
    if (item.quantity > available) {
      return `${item.name} talle ${item.size}: pide ${item.quantity} y hay ${available}`;
    }
  }
  return null;
}

/**
 * Cambia el estado de un pedido respetando las reglas de stock:
 * - A Cancelado: repone el stock una sola vez (el flag stockDeducted evita reponerlo dos veces).
 * - De Pendiente a Pagado, o al revés: no toca el stock, ya estaba descontado.
 * - De Cancelado a Pendiente o Pagado: vuelve a descontar, pero solo si hay stock de todo el pedido.
 *   Si falta algo, el pedido no cambia y se devuelve el motivo (nada se descuenta a medias).
 */
export function updateOrderStatus(orderId: string, newStatus: OrderStatus): { success: boolean; error?: string } {
  const order = orders.value.find((o) => o.id === orderId);
  if (!order) return { success: false, error: 'El pedido no existe' };

  if (newStatus === 'Cancelado' && order.stockDeducted) {
    applyOrderToStock(order, 1);
    order.stockDeducted = false;
  }

  if (order.status === 'Cancelado' && newStatus !== 'Cancelado' && !order.stockDeducted) {
    const problem = findStockProblem(order);
    if (problem) return { success: false, error: problem };
    applyOrderToStock(order, -1);
    order.stockDeducted = true;
  }

  order.status = newStatus;
  return { success: true };
}

export interface BulkStatusResult {
  updated: string[];
  unchanged: string[];
  skipped: { id: string; reason: string }[];
}

/**
 * Cambia el estado de varios pedidos, de a uno. Como el stock se actualiza en cada paso,
 * dos pedidos que compiten por la última unidad no pueden reactivarse los dos.
 */
export function updateOrdersStatus(orderIds: string[], newStatus: OrderStatus): BulkStatusResult {
  const result: BulkStatusResult = { updated: [], unchanged: [], skipped: [] };

  for (const id of orderIds) {
    if (orders.value.find((o) => o.id === id)?.status === newStatus) {
      result.unchanged.push(id);
      continue;
    }
    const res = updateOrderStatus(id, newStatus);
    if (res.success) {
      result.updated.push(id);
    } else {
      result.skipped.push({ id, reason: res.error || 'No se pudo actualizar' });
    }
  }
  return result;
}

// 8. Métodos de Favoritos
export function toggleFavorite(id: string) {
  // Los favoritos son por cuenta: sin sesión se pide iniciarla.
  if (!currentUser.value) {
    openLoginModal('Iniciá sesión para guardar favoritos');
    return;
  }
  const idx = favorites.value.indexOf(id);
  if (idx > -1) {
    favorites.value.splice(idx, 1);
  } else {
    favorites.value.push(id);
  }
}

export function isFavorite(id: string): boolean {
  return favorites.value.includes(id);
}

// 9. Diálogo modal de confirmación de eliminación
export function openDeleteConfirmation(jersey: Jersey) {
  deleteModalState.jersey = jersey;
  deleteModalState.isOpen = true;
}

export function closeDeleteConfirmation() {
  deleteModalState.isOpen = false;
  deleteModalState.jersey = null;
}

export function confirmDeleteJersey() {
  if (deleteModalState.jersey) {
    deleteJersey(deleteModalState.jersey.id);
    closeDeleteConfirmation();
  }
}

// 10. Consumo de DolarAPI con fetch: se llama una vez, desde App.vue (onMounted).
// Si falla, la app sigue funcionando y la barra superior muestra el mensaje por defecto.
export async function initializeApiService() {
  try {
    const quotes = await fetchDolarQuotes();
    dolarStatus.value = 'ok';
    const card = quotes.find((quote) => quote.casa === 'tarjeta');
    if (card) {
      liveAnnouncement.value = `Dólar Tarjeta: $${card.venta.toLocaleString('es-AR')} ARS · Envíos a todo el país · 3 y 6 cuotas sin interés`;
    }
  } catch (error) {
    console.warn('[DolarAPI] No se pudo obtener la cotización:', error);
    dolarStatus.value = 'error';
  }
}
