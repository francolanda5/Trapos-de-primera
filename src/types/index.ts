export interface HistoryNote {
  year: string;
  title: string;
  subtitle: string;
  text: string;
  photo: string;
}

export interface Jersey {
  id: string;
  name: string;
  team: string;
  category: 'Primera División' | 'Primera Nacional' | 'Primera B Metropolitana' | 'Selección Argentina';
  era: 'Actual' | 'Retro';
  decade?: '80' | '90' | '00' | '10' | 'Actual';
  season: string;
  type: 'Titular' | 'Suplente' | 'Tercera' | 'Arquero';
  price: number;
  stock: number; // Sum of sizeStock
  sizeStock: Record<string, number>; // e.g. { S: 2, M: 5, L: 3, XL: 0, XXL: 1 }
  sizes: string[];
  garmentType: 'Reedición retro' | 'Original de época' | 'Versión jugador' | 'Versión hincha';
  image: string;
  galleryImages?: string[];
  description: string;
  featured?: boolean;
  newArrival?: boolean;
  mostSearched?: boolean;
  historyNote?: HistoryNote;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string; // unique item key: jerseyId + size
  jersey: Jersey;
  size: string;
  quantity: number;
}

export interface OrderItem {
  jerseyId: string;
  name: string;
  team: string;
  season: string;
  size: string;
  quantity: number;
  unitPrice: number;
  image: string;
}

export type OrderStatus = 'Pendiente' | 'Pagado' | 'Cancelado';
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'mercadopago';
export type DeliveryMethod = 'shipping' | 'pickup';

export interface BuyerInfo {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
}

export interface Order {
  id: string; // e.g. TDP-2026-1042
  createdAt: string;
  buyer: BuyerInfo;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  receiptImage?: string; // base64 data URL for persistent review
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  stockDeducted: boolean;
  userId?: string;
  historyNotes?: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  passwordHash?: string;
  avatarUrl?: string;
  googleId?: string;
  createdAt: string;
}

export interface FilterState {
  search: string;
  teamSearch: string;
  categories: string[];
  era: 'Todas' | 'Actual' | 'Retro';
  decade: string;
  selectedTeams: string[];
  selectedSizes: string[];
  minPrice: number;
  maxPrice: number;
  sortBy: 'price-asc' | 'price-desc' | 'recent' | 'name';
}
