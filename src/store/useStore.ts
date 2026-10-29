import { reactive, ref, computed, watch } from 'vue';
import type { Jersey, CartItem, FilterState, Order, OrderStatus, BuyerInfo, PaymentMethod, DeliveryMethod } from '../types';
import { INITIAL_JERSEYS } from '../data/initialJerseys';
import { supabaseService, type RemoteSyncStatus } from '../services/supabaseService';
import { currentUser } from './useAuth';

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
          // Stock total = suma de talles
          j.stock = Object.values(j.sizeStock as Record<string, number>).reduce((a, b) => a + Number(b || 0), 0);
          return j as Jersey;
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
      if (Array.isArray(parsed)) return parsed;
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
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error al leer pedidos de LocalStorage:', e);
  }
  // Pedido inicial de demostración para el panel de administración
  return [
    {
      id: 'TDP-2026-1042',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      buyer: {
        name: 'Matías',
        lastName: 'Gallardo',
        email: 'matias.gallardo@gmail.com',
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
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtK7AmERvAeFkoG9fzxTpsSeKt-Fv0_J-rN5DwehqzfP8LyDZbMuc5ogcuw2t-Rd4af6beG1iPzCM11MEQDzCb_zHyhd8X01wkAuQqwwjpOp7A0_gQ5cXPXLSxZ54HVRUYcZc7iMP3nUyYW3RLfEmJ2ExEngkqEmyGy216mzutjTiS6t4sP6T4A9w0RX-qVTIDSmhN9wCJ8UBK8eIQVNv4sWaRaLbJkG0DF7my_J_CIRNVV23HDcLVBw'
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

function loadStoredFavorites(userId?: string): string[] {
  try {
    const key = `${STORAGE_KEYS.FAVORITES}_${userId || 'guest'}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return ['arg-1986', 'boca-2024'];
}

// 2. Estado Global Reactivo
export const jerseys = ref<Jersey[]>(migrateAndLoadJerseys());
export const cart = ref<CartItem[]>(loadStoredCart());
export const orders = ref<Order[]>(loadStoredOrders());
export const theme = ref<'light' | 'dark'>(loadStoredTheme());
export const themeMode = theme;

// Control de Drawers y Modales
export const isCartOpen = ref<boolean>(false);
export const isFavoritesOpen = ref<boolean>(false);

// Favoritos reactivos sincronizados con usuario actual
export const favorites = ref<string[]>(loadStoredFavorites(currentUser.value?.id));

// Cambio de usuario actualiza sus favoritos
watch(
  currentUser,
  (newUser) => {
    favorites.value = loadStoredFavorites(newUser?.id);
  },
  { immediate: true }
);

watch(
  favorites,
  (newVal) => {
    try {
      const key = `${STORAGE_KEYS.FAVORITES}_${currentUser.value?.id || 'guest'}`;
      localStorage.setItem(key, JSON.stringify(newVal));
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

export const apiSyncState = reactive<RemoteSyncStatus>({
  status: 'idle',
  message: 'Iniciando conexión con API...',
  lastChecked: null,
  endpoint: 'Supabase REST API / Dólar API'
});

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

export const favoritesCount = computed(() => {
  return favorites.value.length;
});

export const favoriteJerseys = computed(() => {
  return jerseys.value.filter((j) => favorites.value.includes(j.id));
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
  supabaseService.syncJersey(created);
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

  supabaseService.syncJersey(updated);
  return true;
}

export function deleteJersey(id: string): boolean {
  const initialLength = jerseys.value.length;
  jerseys.value = jerseys.value.filter((j) => j.id !== id);

  cart.value = cart.value.filter((item) => item.jersey.id !== id);
  favorites.value = favorites.value.filter((favId) => favId !== id);

  if (jerseys.value.length < initialLength) {
    supabaseService.deleteJersey(id);
    return true;
  }
  return false;
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

/**
 * Modificar estado de pedido (Pendiente -> Pagado -> Cancelado)
 * Si se cancela, reintegra automáticamente el stock una sola vez.
 * Si se marca como Pagado, NO vuelve a descontar stock.
 */
export function updateOrderStatus(orderId: string, newStatus: OrderStatus): boolean {
  const order = orders.value.find((o) => o.id === orderId);
  if (!order) return false;

  const previousStatus = order.status;
  if (previousStatus === newStatus) return true;

  // Caso: Cancelación de pedido y devolución de stock
  if (newStatus === 'Cancelado' && order.stockDeducted) {
    order.items.forEach((item) => {
      const jersey = getJerseyById(item.jerseyId);
      if (jersey && jersey.sizeStock[item.size] !== undefined) {
        jersey.sizeStock[item.size] += item.quantity;
        jersey.stock = Object.values(jersey.sizeStock).reduce((acc, qty) => acc + qty, 0);
      }
    });
    order.stockDeducted = false;
  }

  // Caso: Si un pedido cancelado se vuelve a reactivar como Pendiente o Pagado
  if (previousStatus === 'Cancelado' && newStatus !== 'Cancelado' && !order.stockDeducted) {
    order.items.forEach((item) => {
      const jersey = getJerseyById(item.jerseyId);
      if (jersey && jersey.sizeStock[item.size] !== undefined) {
        jersey.sizeStock[item.size] = Math.max(0, jersey.sizeStock[item.size] - item.quantity);
        jersey.stock = Object.values(jersey.sizeStock).reduce((acc, qty) => acc + qty, 0);
      }
    });
    order.stockDeducted = true;
  }

  order.status = newStatus;
  return true;
}

// 8. Métodos de Favoritos
export function toggleFavorite(id: string) {
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

// 10. Inicialización de API externa con Fetch
export async function initializeApiService() {
  apiSyncState.status = 'loading';
  apiSyncState.message = 'Sincronizando con Supabase y Dólar API...';

  try {
    const announcement = await supabaseService.fetchLiveAnnouncements();
    liveAnnouncement.value = announcement.message;

    const result = await supabaseService.fetchJerseys();
    if (result.fromApi && result.data && result.data.length > 0) {
      apiSyncState.status = 'success';
      apiSyncState.message = `Sincronizado con Supabase (${result.data.length} camisetas en API)`;
    } else {
      apiSyncState.status = 'fallback';
      apiSyncState.message = `Modo local activo (${jerseys.value.length} camisetas en inventario)`;
    }
  } catch (err: any) {
    apiSyncState.status = 'fallback';
    apiSyncState.message = `Persistencia LocalStorage activa (${jerseys.value.length} camisetas)`;
  } finally {
    apiSyncState.lastChecked = new Date().toLocaleTimeString('es-AR');
  }
}
