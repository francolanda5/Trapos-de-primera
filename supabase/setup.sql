-- =====================================================================
-- Trapos de Primera: base de datos en Supabase
-- Cómo usarlo: Supabase > SQL Editor > New query > pegar TODO este archivo > Run.
-- Se puede ejecutar más de una vez sin romper nada.
-- Crea: perfiles (usuarios), camisetas, pedidos, favoritos y mensajes de contacto,
-- con seguridad por filas (RLS) y la lógica de stock dentro de la base.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PERFILES: uno por cada usuario de Supabase Auth (Google o correo).
--    El rol arranca siempre en 'customer'. Un administrador se marca a mano
--    con supabase/admin.sql; desde la web nadie puede cambiar su propio rol.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '',
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Perfiles de usuarios que ya existían antes de correr este archivo
insert into public.profiles (id, email, name, avatar_url)
select u.id, u.email,
       coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1)),
       coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
on conflict (id) do nothing;

-- ¿El usuario que hace el pedido es administrador? (se usa en las reglas de seguridad)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
drop policy if exists "profiles: ver el propio o todos si es admin" on public.profiles;
create policy "profiles: ver el propio o todos si es admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- 2. CAMISETAS: las ve cualquiera; solo el administrador las modifica.
-- ---------------------------------------------------------------------
create table if not exists public.jerseys (
  id text primary key,
  name text not null,
  team text not null,
  category text not null check (category in ('Primera División', 'Primera Nacional', 'Primera B Metropolitana', 'Selección Argentina')),
  era text not null check (era in ('Actual', 'Retro')),
  decade text,
  season text not null,
  type text not null check (type in ('Titular', 'Suplente', 'Tercera', 'Arquero')),
  price integer not null check (price > 0),
  size_stock jsonb not null default '{}'::jsonb,   -- stock por talle, por ejemplo {"S": 2, "M": 5}
  sizes text[] not null default '{}',
  garment_type text not null,
  image text not null,
  gallery_images text[],
  description text not null,
  featured boolean not null default false,
  new_arrival boolean not null default false,
  most_searched boolean not null default false,
  history_note jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jerseys enable row level security;
drop policy if exists "jerseys: las ve cualquiera" on public.jerseys;
create policy "jerseys: las ve cualquiera" on public.jerseys
  for select to anon, authenticated using (true);
drop policy if exists "jerseys: solo admin crea" on public.jerseys;
create policy "jerseys: solo admin crea" on public.jerseys
  for insert to authenticated with check (public.is_admin());
drop policy if exists "jerseys: solo admin edita" on public.jerseys;
create policy "jerseys: solo admin edita" on public.jerseys
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "jerseys: solo admin borra" on public.jerseys;
create policy "jerseys: solo admin borra" on public.jerseys
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- 3. PEDIDOS: cada cliente ve los suyos; el administrador ve todos.
--    Nadie los crea ni los modifica con INSERT/UPDATE directos: se hace con
--    las funciones create_order y set_order_status (más abajo), que además
--    descuentan o devuelven el stock en el mismo paso.
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id text primary key,                                   -- por ejemplo TDP-2026-1042
  user_id uuid references public.profiles (id) on delete set null,
  buyer jsonb not null,
  delivery_method text not null check (delivery_method in ('shipping', 'pickup')),
  payment_method text not null check (payment_method in ('efectivo', 'tarjeta', 'mercadopago')),
  receipt_image text,
  subtotal integer not null default 0,
  shipping_cost integer not null default 0,
  total integer not null default 0,
  status text not null default 'Pendiente' check (status in ('Pendiente', 'Pagado', 'Cancelado')),
  stock_deducted boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders (id) on delete cascade,
  jersey_id text not null,
  name text not null,
  team text not null,
  season text not null,
  size text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null,
  image text not null
);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists orders_user_id_idx on public.orders (user_id);

alter table public.orders enable row level security;
drop policy if exists "orders: el dueño o el admin" on public.orders;
create policy "orders: el dueño o el admin" on public.orders
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

alter table public.order_items enable row level security;
drop policy if exists "order_items: del pedido del dueño o del admin" on public.order_items;
create policy "order_items: del pedido del dueño o del admin" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
  );

-- ---------------------------------------------------------------------
-- 4. FAVORITOS: cada usuario ve y maneja solo los suyos.
-- ---------------------------------------------------------------------
create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  jersey_id text not null references public.jerseys (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, jersey_id)
);

alter table public.favorites enable row level security;
drop policy if exists "favorites: ver los propios" on public.favorites;
create policy "favorites: ver los propios" on public.favorites
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "favorites: agregar los propios" on public.favorites;
create policy "favorites: agregar los propios" on public.favorites
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "favorites: quitar los propios" on public.favorites;
create policy "favorites: quitar los propios" on public.favorites
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 5. MENSAJES DE CONTACTO: los puede enviar cualquiera, solo el admin los lee.
-- ---------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 80),
  email text not null check (char_length(email) <= 120 and email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  message text not null check (char_length(message) between 10 and 1000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;
drop policy if exists "messages: cualquiera envía" on public.messages;
create policy "messages: cualquiera envía" on public.messages
  for insert to anon, authenticated with check (read = false);
drop policy if exists "messages: solo admin lee" on public.messages;
create policy "messages: solo admin lee" on public.messages
  for select to authenticated using (public.is_admin());
drop policy if exists "messages: solo admin marca" on public.messages;
create policy "messages: solo admin marca" on public.messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "messages: solo admin borra" on public.messages;
create policy "messages: solo admin borra" on public.messages
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- 6. FUNCIÓN create_order: crea el pedido y descuenta el stock en un solo paso.
--    Los precios salen de la tabla jerseys, no de lo que mande el navegador.
--    Si falta stock se cancela todo: no queda nada a medias.
-- ---------------------------------------------------------------------
create or replace function public.create_order(
  p_buyer jsonb,
  p_delivery text,
  p_payment text,
  p_receipt text,
  p_items jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id text;
  v_subtotal integer := 0;
  v_item jsonb;
  v_j public.jerseys%rowtype;
  v_qty integer;
  v_size text;
  v_avail integer;
  v_try integer := 0;
begin
  if v_user is null then
    raise exception 'Tenés que iniciar sesión para comprar.';
  end if;
  if p_buyer is null or jsonb_typeof(p_buyer) <> 'object' then
    raise exception 'Faltan los datos del comprador.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito de compras está vacío.';
  end if;
  if p_receipt is not null and char_length(p_receipt) > 2000000 then
    raise exception 'El comprobante es demasiado pesado.';
  end if;

  loop
    v_id := 'TDP-2026-' || (1000 + floor(random() * 9000))::int;
    exit when not exists (select 1 from public.orders where id = v_id);
    v_try := v_try + 1;
    if v_try > 30 then raise exception 'No se pudo generar el número de pedido.'; end if;
  end loop;

  insert into public.orders (id, user_id, buyer, delivery_method, payment_method, receipt_image)
  values (v_id, v_user, p_buyer, p_delivery, p_payment, p_receipt);

  -- Se recorren ordenadas por camiseta, para que dos compras a la vez no se traben entre sí
  for v_item in
    select e from jsonb_array_elements(p_items) as e order by e ->> 'jerseyId'
  loop
    v_size := v_item ->> 'size';
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 then
      raise exception 'La cantidad de una camiseta no es válida.';
    end if;

    select * into v_j from public.jerseys where id = v_item ->> 'jerseyId' for update;
    if not found then
      raise exception 'Una de las camisetas ya no está disponible en el catálogo.';
    end if;

    v_avail := coalesce((v_j.size_stock ->> v_size)::integer, 0);
    if v_qty > v_avail then
      raise exception 'Stock insuficiente para % (Talle %). Disponibles: %, solicitadas: %.', v_j.name, v_size, v_avail, v_qty;
    end if;

    update public.jerseys
       set size_stock = jsonb_set(size_stock, array[v_size], to_jsonb(v_avail - v_qty)),
           updated_at = now()
     where id = v_j.id;

    insert into public.order_items (order_id, jersey_id, name, team, season, size, quantity, unit_price, image)
    values (v_id, v_j.id, v_j.name, v_j.team, v_j.season, v_size, v_qty, v_j.price, v_j.image);

    v_subtotal := v_subtotal + v_j.price * v_qty;
  end loop;

  update public.orders set subtotal = v_subtotal, total = v_subtotal where id = v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. FUNCIÓN set_order_status: solo el administrador. Mismas reglas que la web:
--    cancelar devuelve el stock una sola vez; reactivar un pedido cancelado lo
--    vuelve a descontar, pero solo si alcanza el stock de todo el pedido.
-- ---------------------------------------------------------------------
create or replace function public.set_order_status(p_id text, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_o public.orders%rowtype;
  v_i public.order_items%rowtype;
  v_j public.jerseys%rowtype;
  v_avail integer;
begin
  if not public.is_admin() then
    raise exception 'Solo el administrador puede cambiar el estado de un pedido.';
  end if;
  if p_status not in ('Pendiente', 'Pagado', 'Cancelado') then
    raise exception 'El estado no es válido.';
  end if;

  select * into v_o from public.orders where id = p_id for update;
  if not found then
    raise exception 'El pedido no existe';
  end if;
  if v_o.status = p_status then
    return;
  end if;

  if p_status = 'Cancelado' and v_o.stock_deducted then
    for v_i in select * from public.order_items where order_id = p_id order by jersey_id loop
      update public.jerseys
         set size_stock = case
               when size_stock ? v_i.size
               then jsonb_set(size_stock, array[v_i.size], to_jsonb((size_stock ->> v_i.size)::integer + v_i.quantity))
               else size_stock end,
             updated_at = now()
       where id = v_i.jersey_id;
    end loop;
    update public.orders set stock_deducted = false where id = p_id;

  elsif v_o.status = 'Cancelado' and not v_o.stock_deducted then
    for v_i in select * from public.order_items where order_id = p_id order by jersey_id loop
      select * into v_j from public.jerseys where id = v_i.jersey_id for update;
      if not found then
        raise exception '% ya no está en el catálogo', v_i.name;
      end if;
      if not (v_j.size_stock ? v_i.size) then
        raise exception '% ya no tiene talle %', v_i.name, v_i.size;
      end if;
      v_avail := (v_j.size_stock ->> v_i.size)::integer;
      if v_i.quantity > v_avail then
        raise exception '% talle %: pide % y hay %', v_i.name, v_i.size, v_i.quantity, v_avail;
      end if;
    end loop;
    for v_i in select * from public.order_items where order_id = p_id order by jersey_id loop
      update public.jerseys
         set size_stock = jsonb_set(size_stock, array[v_i.size], to_jsonb((size_stock ->> v_i.size)::integer - v_i.quantity)),
             updated_at = now()
       where id = v_i.jersey_id;
    end loop;
    update public.orders set stock_deducted = true where id = p_id;
  end if;

  update public.orders set status = p_status where id = p_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 8. PERMISOS para la API de Supabase (rol anon = sin sesión, authenticated = con sesión)
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.jerseys to anon, authenticated;
grant insert, update, delete on public.jerseys to authenticated;
grant select on public.profiles to authenticated;
grant select on public.orders, public.order_items to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant insert on public.messages to anon, authenticated;
grant select, update, delete on public.messages to authenticated;

revoke all on function public.create_order(jsonb, text, text, text, jsonb) from public, anon;
grant execute on function public.create_order(jsonb, text, text, text, jsonb) to authenticated;
revoke all on function public.set_order_status(text, text) from public, anon;
grant execute on function public.set_order_status(text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 9. DATOS INICIALES: las 18 camisetas del catálogo
-- ---------------------------------------------------------------------
insert into public.jerseys
  (id, name, team, category, era, decade, season, type, price, size_stock, sizes, garment_type, image, gallery_images, description, featured, new_arrival, most_searched, history_note, created_at)
values
  ('arg-1986', 'Argentina 1986', 'Argentina', 'Selección Argentina', 'Retro', '80', '1986', 'Titular', 89999, '{"S":2,"M":5,"L":3,"XL":0,"XXL":1}'::jsonb, array['S', 'M', 'L', 'XL', 'XXL']::text[], 'Reedición retro', '/assets/jerseys/arg-1986-frente.webp', array['/assets/jerseys/arg-1986-frente.webp', '/assets/jerseys/arg-1986-espalda.webp', '/assets/jerseys/arg-1986-detalle.webp']::text[], 'La camiseta con la que Argentina escribió una de las páginas más grandes de su historia. Diseño clásico de 1986, ahora en una reedición retro fiel al original con escudo bordado y pique de primera calidad.', true, false, false, '{"year":"1986","title":"LA CAMISETA DE AQUEL AÑO","subtitle":"Un diseño que forma parte de la memoria del fútbol argentino.","text":"En 1986, la Selección Argentina se consagró campeona del mundo en México con un fútbol inolvidable. Esta camiseta representa talento, pasión y una generación que marcó para siempre la historia.","photo":"https://lh3.googleusercontent.com/aida-public/AB6AXuBIaR_YgZ2CzL6rt2srY-kJcAWoQRhkejg2j-MKKsgmFpB3cBrmDfE_8T_Kv-GAAgvig8zxMN5hNkXHqeNtUnHBGmBu1gxTefyky51aWpHgQr6gxBAArAasl4W8wMX5yFuSwDP8GkpwKDmiRPflZWj4gaho3PP2NbSStttR8N5BlSIi3AsNiYtRZLnkzloAk_jDQp6T_KrgZI1LcqbhWfMVh-5aZ0ZLuw6w4EyOnJhssctKSAYMBPcRSw"}'::jsonb, now() - interval '0 seconds'),
  ('boca-2024', 'Boca Juniors', 'Boca Juniors', 'Primera División', 'Actual', 'Actual', '2024/25', 'Titular', 119999, '{"S":3,"M":6,"L":4,"XL":2}'::jsonb, array['S', 'M', 'L', 'XL']::text[], 'Versión hincha', '/assets/jerseys/boca-2024-frente.webp', array['/assets/jerseys/boca-2024-frente.webp', '/assets/jerseys/boca-2024-espalda.webp', '/assets/jerseys/boca-2024-detalle.webp']::text[], 'Camiseta titular de Boca Juniors, temporada 2024/25. La tradicional azul y oro, con la franja horizontal en el pecho.', false, true, true, null, now() - interval '1 seconds'),
  ('river-2024', 'River Plate', 'River Plate', 'Primera División', 'Actual', 'Actual', '2024/25', 'Titular', 119999, '{"S":2,"M":5,"L":3,"XL":2}'::jsonb, array['S', 'M', 'L', 'XL']::text[], 'Versión hincha', '/assets/jerseys/river-2024-frente.webp', array['/assets/jerseys/river-2024-frente.webp', '/assets/jerseys/river-2024-espalda.webp', '/assets/jerseys/river-2024-detalle.webp']::text[], 'Camiseta titular de River Plate temporada 2024/25. La clásica banda roja que cruza el alma sobre fondo blanco impoluto y detalles en rojo carmesí.', false, true, true, null, now() - interval '2 seconds'),
  ('racing-2024', 'Racing Club', 'Racing Club', 'Primera División', 'Actual', 'Actual', '2024/25', 'Titular', 109999, '{"S":1,"M":4,"L":3,"XL":2}'::jsonb, array['S', 'M', 'L', 'XL']::text[], 'Versión hincha', '/assets/jerseys/racing-2024-frente.webp', array['/assets/jerseys/racing-2024-frente.webp', '/assets/jerseys/racing-2024-espalda.webp', '/assets/jerseys/racing-2024-detalle.webp']::text[], 'Camiseta titular de Racing Club temporada 2024/25. Las clásicas franjas verticales celestes y blancas.', false, true, false, null, now() - interval '3 seconds'),
  ('independiente-2024', 'Independiente', 'Independiente', 'Primera División', 'Actual', 'Actual', '2024/25', 'Titular', 109999, '{"S":2,"M":3,"L":3,"XL":1}'::jsonb, array['S', 'M', 'L', 'XL']::text[], 'Versión hincha', '/assets/jerseys/independiente-2024-frente.webp', array['/assets/jerseys/independiente-2024-frente.webp', '/assets/jerseys/independiente-2024-espalda.webp', '/assets/jerseys/independiente-2024-detalle.webp']::text[], 'Camiseta titular del Club Atlético Independiente 2024/25. Rojo rey con detalles blancos en hombros y cuello, rindiendo homenaje al Rey de Copas.', false, true, false, null, now() - interval '4 seconds'),
  ('san-lorenzo-2024', 'San Lorenzo', 'San Lorenzo', 'Primera División', 'Actual', 'Actual', '2024/25', 'Titular', 109999, '{"S":3,"M":5,"L":4,"XL":2}'::jsonb, array['S', 'M', 'L', 'XL']::text[], 'Versión hincha', '/assets/jerseys/san-lorenzo-2024-frente.webp', array['/assets/jerseys/san-lorenzo-2024-frente.webp', '/assets/jerseys/san-lorenzo-2024-espalda.webp', '/assets/jerseys/san-lorenzo-2024-detalle.webp']::text[], 'Camiseta titular de San Lorenzo de Almagro 2024/25. Azulgrana a franjas verticales, con el histórico escudo en el pecho.', false, false, true, null, now() - interval '5 seconds'),
  ('estudiantes-2024', 'Estudiantes LP', 'Estudiantes LP', 'Primera División', 'Actual', 'Actual', '2024/25', 'Titular', 109999, '{"S":2,"M":4,"L":3,"XL":2}'::jsonb, array['S', 'M', 'L', 'XL']::text[], 'Versión hincha', '/assets/jerseys/estudiantes-2024-frente.webp', array['/assets/jerseys/estudiantes-2024-frente.webp', '/assets/jerseys/estudiantes-2024-espalda.webp', '/assets/jerseys/estudiantes-2024-detalle.webp']::text[], 'Camiseta titular de Estudiantes de La Plata 2024/25. Los tradicionales bastones rojos y blancos.', false, false, true, null, now() - interval '6 seconds'),
  ('velez-2024', 'Vélez Sarsfield', 'Vélez Sarsfield', 'Primera División', 'Actual', 'Actual', '2024/25', 'Titular', 109999, '{"S":1,"M":3,"L":2,"XL":1}'::jsonb, array['S', 'M', 'L', 'XL']::text[], 'Versión hincha', '/assets/jerseys/velez-2024-frente.webp', array['/assets/jerseys/velez-2024-frente.webp', '/assets/jerseys/velez-2024-espalda.webp', '/assets/jerseys/velez-2024-detalle.webp']::text[], 'Camiseta titular del Club Atlético Vélez Sarsfield 2024/25. Fondo blanco con la mítica "V" azul en el pecho.', false, false, true, null, now() - interval '7 seconds'),
  ('chacarita-1996', 'Chacarita Juniors', 'Chacarita Juniors', 'Primera Nacional', 'Retro', '90', '1996', 'Titular', 99999, '{"S":1,"M":2,"L":2,"XL":1}'::jsonb, array['S', 'M', 'L', 'XL']::text[], 'Reedición retro', '/assets/jerseys/chacarita-1996-frente.webp', array['/assets/jerseys/chacarita-1996-frente.webp', '/assets/jerseys/chacarita-1996-espalda.webp', '/assets/jerseys/chacarita-1996-detalle.webp']::text[], 'Histórica camiseta tricolor de Chacarita Juniors de 1996. Rayas verticales rojas, blancas y negras con cuello noventero característico.', true, false, false, null, now() - interval '8 seconds'),
  ('ferro-1998', 'Ferro Carril Oeste', 'Ferro Carril Oeste', 'Primera Nacional', 'Retro', '90', '1998', 'Titular', 99999, '{"S":0,"M":2,"L":2,"XL":1}'::jsonb, array['S', 'M', 'L', 'XL']::text[], 'Reedición retro', '/assets/jerseys/ferro-1998-frente.webp', array['/assets/jerseys/ferro-1998-frente.webp', '/assets/jerseys/ferro-1998-espalda.webp', '/assets/jerseys/ferro-1998-detalle.webp']::text[], 'Camiseta titular verde de Ferro Carril Oeste, año 1998, el club de Caballito. Cuello y vivos blancos.', true, false, false, null, now() - interval '9 seconds'),
  ('atlanta-2001', 'Atlanta', 'Atlanta', 'Primera B Metropolitana', 'Retro', '00', '2001', 'Titular', 99999, '{"S":2,"M":3,"L":2,"XL":1}'::jsonb, array['S', 'M', 'L', 'XL']::text[], 'Reedición retro', '/assets/jerseys/atlanta-2001-frente.webp', array['/assets/jerseys/atlanta-2001-frente.webp', '/assets/jerseys/atlanta-2001-espalda.webp', '/assets/jerseys/atlanta-2001-detalle.webp']::text[], 'Camiseta del Bohemio de Villa Crespo año 2001. Franjas azul y amarillo oro con tipografía de época.', true, false, false, null, now() - interval '10 seconds'),
  ('arg-1990', 'Argentina 1990', 'Argentina', 'Selección Argentina', 'Retro', '90', '1990', 'Titular', 89999, '{"S":2,"M":3,"L":3,"XL":1,"XXL":1}'::jsonb, array['S', 'M', 'L', 'XL', 'XXL']::text[], 'Reedición retro', '/assets/jerseys/arg-1990-frente.webp', array['/assets/jerseys/arg-1990-frente.webp', '/assets/jerseys/arg-1990-espalda.webp', '/assets/jerseys/arg-1990-detalle.webp']::text[], 'Camiseta titular de la Selección Argentina para el Mundial de Italia 1990. El recuerdo imborrable de Goycochea, Caniggia y Diego en Turín y Roma.', true, false, false, null, now() - interval '11 seconds'),
  ('arg-1994', 'Argentina 1994', 'Argentina', 'Selección Argentina', 'Retro', '90', '1994', 'Suplente', 89999, '{"S":1,"M":3,"L":2,"XL":1}'::jsonb, array['S', 'M', 'L', 'XL']::text[], 'Reedición retro', '/assets/jerseys/arg-1994-frente.webp', array['/assets/jerseys/arg-1994-frente.webp', '/assets/jerseys/arg-1994-espalda.webp', '/assets/jerseys/arg-1994-detalle.webp']::text[], 'Inconfundible camiseta alternativa azul, con rombos oscuros en un costado, de la época del Mundial de Estados Unidos 1994.', true, false, false, null, now() - interval '12 seconds'),
  ('arg-2022', 'Argentina 2022', 'Argentina', 'Selección Argentina', 'Actual', 'Actual', '2022/24', 'Titular', 109999, '{"S":4,"M":7,"L":5,"XL":3,"XXL":1}'::jsonb, array['S', 'M', 'L', 'XL', 'XXL']::text[], 'Versión hincha', '/assets/jerseys/arg-2022-frente.webp', array['/assets/jerseys/arg-2022-frente.webp', '/assets/jerseys/arg-2022-espalda.webp', '/assets/jerseys/arg-2022-detalle.webp']::text[], 'La camiseta titular de la Selección campeona del mundo en Qatar 2022, con las franjas celestes y blancas.', true, false, false, null, now() - interval '13 seconds'),
  ('quilmes-2024', 'Quilmes AC', 'Quilmes', 'Primera Nacional', 'Actual', 'Actual', '2024/25', 'Titular', 89999, '{"S":2,"M":3,"L":3,"XL":1}'::jsonb, array['S', 'M', 'L', 'XL']::text[], 'Versión hincha', '/assets/jerseys/quilmes-2024-frente.webp', array['/assets/jerseys/quilmes-2024-frente.webp', '/assets/jerseys/quilmes-2024-espalda.webp', '/assets/jerseys/quilmes-2024-detalle.webp']::text[], 'Camiseta oficial blanca con vivos azul marino del Cervecero. Orgullo de la zona sur del conurbano bonaerense.', false, false, false, null, now() - interval '14 seconds'),
  ('allboys-2023', 'All Boys', 'All Boys', 'Primera Nacional', 'Actual', 'Actual', '2023/24', 'Titular', 84999, '{"S":2,"M":2,"L":2}'::jsonb, array['S', 'M', 'L']::text[], 'Versión hincha', '/assets/jerseys/allboys-2023-frente.webp', array['/assets/jerseys/allboys-2023-frente.webp', '/assets/jerseys/allboys-2023-espalda.webp', '/assets/jerseys/allboys-2023-detalle.webp']::text[], 'Camiseta clásica blanca y negra de Floresta. Pasión barrial centenaria con escudo bordado.', false, false, false, null, now() - interval '15 seconds'),
  ('almirante-2024', 'Almirante Brown', 'Almirante Brown', 'Primera Nacional', 'Actual', 'Actual', '2024/25', 'Titular', 89999, '{"M":3,"L":3,"XL":2}'::jsonb, array['M', 'L', 'XL']::text[], 'Versión hincha', '/assets/jerseys/almirante-2024-frente.webp', array['/assets/jerseys/almirante-2024-frente.webp', '/assets/jerseys/almirante-2024-espalda.webp', '/assets/jerseys/almirante-2024-detalle.webp']::text[], 'La Fragata de Isidro Casanova. Aurinegra a rayas verticales con textura transpirable.', false, false, false, null, now() - interval '16 seconds'),
  ('chicago-2024', 'Nueva Chicago', 'Nueva Chicago', 'Primera Nacional', 'Actual', 'Actual', '2024/25', 'Titular', 89999, '{"S":2,"M":4,"L":2,"XL":1}'::jsonb, array['S', 'M', 'L', 'XL']::text[], 'Versión hincha', '/assets/jerseys/chicago-2024-frente.webp', array['/assets/jerseys/chicago-2024-frente.webp', '/assets/jerseys/chicago-2024-espalda.webp', '/assets/jerseys/chicago-2024-detalle.webp']::text[], 'El Torito de Mataderos. Verde y negro inconfundible con toda la mística del barrio y el ascenso.', false, false, false, null, now() - interval '17 seconds')
on conflict (id) do nothing;
