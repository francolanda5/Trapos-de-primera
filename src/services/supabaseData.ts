import type { Jersey, Order, ContactMessage, BuyerInfo, DeliveryMethod, PaymentMethod, OrderStatus } from '../types';
import { sb } from './supabaseClient';

/**
 * Todas las consultas a la base de datos de Supabase están en este archivo.
 * Las tablas usan snake_case (size_stock) y la web camelCase (sizeStock): acá se traduce.
 */
type Row = Record<string, any>;

// Si Supabase devuelve un error, se lanza para que lo atrape quien llamó
function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// ---------- Camisetas ----------
export function jerseyFromRow(r: Row): Jersey {
  const sizeStock: Record<string, number> = r.size_stock ?? {};
  return {
    id: r.id,
    name: r.name,
    team: r.team,
    category: r.category,
    era: r.era,
    decade: r.decade ?? undefined,
    season: r.season,
    type: r.type,
    price: Number(r.price),
    sizeStock,
    stock: Object.values(sizeStock).reduce((acc, qty) => acc + Number(qty || 0), 0),
    sizes: r.sizes ?? [],
    garmentType: r.garment_type,
    image: r.image,
    galleryImages: r.gallery_images ?? undefined,
    description: r.description,
    featured: r.featured || undefined,
    newArrival: r.new_arrival || undefined,
    mostSearched: r.most_searched || undefined,
    historyNote: r.history_note ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

function jerseyToRow(j: Jersey): Row {
  return {
    id: j.id,
    name: j.name,
    team: j.team,
    category: j.category,
    era: j.era,
    decade: j.decade ?? null,
    season: j.season,
    type: j.type,
    price: j.price,
    size_stock: j.sizeStock,
    sizes: j.sizes,
    garment_type: j.garmentType,
    image: j.image,
    gallery_images: j.galleryImages ?? null,
    description: j.description,
    featured: !!j.featured,
    new_arrival: !!j.newArrival,
    most_searched: !!j.mostSearched,
    history_note: j.historyNote ?? null,
    updated_at: new Date().toISOString()
  };
}

export async function fetchJerseys(): Promise<Jersey[]> {
  const { data, error } = await sb().from('jerseys').select('*').order('created_at', { ascending: false }).order('id');
  check(error);
  return (data ?? []).map(jerseyFromRow);
}

export async function saveJersey(j: Jersey): Promise<void> {
  const { error } = await sb().from('jerseys').upsert(jerseyToRow(j));
  check(error);
}

export async function removeJersey(id: string): Promise<void> {
  const { error } = await sb().from('jerseys').delete().eq('id', id);
  check(error);
}

// "Restaurar inventario inicial": deja la tabla con las camisetas de la lista y nada más
export async function replaceJerseys(list: Jersey[]): Promise<void> {
  const { error } = await sb().from('jerseys').upsert(list.map(jerseyToRow));
  check(error);
  const ids = list.map((j) => j.id).join(',');
  const { error: delError } = await sb().from('jerseys').delete().not('id', 'in', `(${ids})`);
  check(delError);
}

// ---------- Pedidos ----------
function orderFromRow(r: Row): Order {
  const items: Row[] = [...(r.order_items ?? [])].sort((a, b) => a.id - b.id);
  return {
    id: r.id,
    createdAt: r.created_at,
    buyer: r.buyer,
    deliveryMethod: r.delivery_method,
    paymentMethod: r.payment_method,
    receiptImage: r.receipt_image ?? undefined,
    items: items.map((i) => ({
      jerseyId: i.jersey_id,
      name: i.name,
      team: i.team,
      season: i.season,
      size: i.size,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      image: i.image
    })),
    subtotal: r.subtotal,
    shippingCost: r.shipping_cost,
    total: r.total,
    status: r.status,
    stockDeducted: r.stock_deducted,
    userId: r.user_id ?? undefined
  };
}

const ORDER_SELECT = '*, order_items(*)';

// La base devuelve solo los pedidos que el usuario puede ver: los suyos, o todos si es administrador
export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await sb().from('orders').select(ORDER_SELECT).order('created_at', { ascending: false });
  check(error);
  return (data ?? []).map(orderFromRow);
}

// La función create_order de la base crea el pedido y descuenta el stock en un solo paso
export async function createOrderRemote(payload: {
  buyer: BuyerInfo;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  receiptImage?: string;
  items: { jerseyId: string; size: string; quantity: number }[];
}): Promise<Order> {
  const { data: id, error } = await sb().rpc('create_order', {
    p_buyer: payload.buyer,
    p_delivery: payload.deliveryMethod,
    p_payment: payload.paymentMethod,
    p_receipt: payload.receiptImage ?? null,
    p_items: payload.items
  });
  check(error);
  const { data, error: readError } = await sb().from('orders').select(ORDER_SELECT).eq('id', id).single();
  check(readError);
  return orderFromRow(data);
}

export async function setOrderStatusRemote(id: string, status: OrderStatus): Promise<void> {
  const { error } = await sb().rpc('set_order_status', { p_id: id, p_status: status });
  check(error);
}

// ---------- Favoritos ----------
export async function fetchFavorites(): Promise<string[]> {
  const { data, error } = await sb().from('favorites').select('jersey_id');
  check(error);
  return (data ?? []).map((r) => r.jersey_id);
}

export async function addFavoriteRemote(userId: string, jerseyId: string): Promise<void> {
  const { error } = await sb().from('favorites').insert({ user_id: userId, jersey_id: jerseyId });
  check(error);
}

export async function removeFavoriteRemote(userId: string, jerseyId: string): Promise<void> {
  const { error } = await sb().from('favorites').delete().eq('user_id', userId).eq('jersey_id', jerseyId);
  check(error);
}

// ---------- Mensajes de contacto ----------
function messageFromRow(r: Row): ContactMessage {
  return { id: r.id, name: r.name, email: r.email, message: r.message, createdAt: r.created_at, read: r.read };
}

export async function insertMessageRemote(data: { name: string; email: string; message: string }): Promise<void> {
  const { error } = await sb().from('messages').insert({ name: data.name.trim(), email: data.email.trim(), message: data.message.trim() });
  check(error);
}

export async function fetchMessages(): Promise<ContactMessage[]> {
  const { data, error } = await sb().from('messages').select('*').order('created_at', { ascending: false });
  check(error);
  return (data ?? []).map(messageFromRow);
}

export async function setMessageReadRemote(id: string, read: boolean): Promise<void> {
  const { error } = await sb().from('messages').update({ read }).eq('id', id);
  check(error);
}

export async function markAllMessagesReadRemote(): Promise<void> {
  const { error } = await sb().from('messages').update({ read: true }).eq('read', false);
  check(error);
}

export async function removeMessageRemote(id: string): Promise<void> {
  const { error } = await sb().from('messages').delete().eq('id', id);
  check(error);
}
