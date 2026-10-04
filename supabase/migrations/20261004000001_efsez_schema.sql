-- =====================================================================
-- EFSE'Z Markt – Datenbank (Supabase, EU – Irland)
-- Die Website liest direkt über die Supabase-API. Zugriffsregeln (RLS):
--   * Besucher sehen nur sichtbare Produkte/Kategorien und laufende Angebote
--   * Besucher dürfen Kontaktanfragen anlegen, sonst nichts schreiben
--   * Personal (Einträge in public.admins) darf alles
-- =====================================================================

create extension if not exists pg_trgm with schema extensions;

-- ---------- Personal ----------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create policy "Personal sieht eigenen Eintrag" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------- Kategorien --------------------------------------------------
create table public.categories (
  id bigint generated always as identity primary key,
  name text not null unique check (char_length(trim(name)) between 1 and 80),
  description text not null default '',
  image text not null default '',
  sort_order integer not null default 500,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;

create policy "Kategorien lesen" on public.categories
  for select to anon, authenticated
  using (visible or (select public.is_admin()));
create policy "Kategorien verwalten" on public.categories
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- Produkte ----------------------------------------------------
create table public.products (
  id bigint generated always as identity primary key,
  barcode text unique,
  kassen_id integer,
  name text not null check (char_length(trim(name)) between 1 and 160),
  category_id bigint references public.categories (id) on delete set null,
  brand text not null default '',
  description text not null default '',
  details text not null default '',
  unit text not null default '',
  origin text not null default '',
  allergens text not null default '',
  tags text not null default '',
  image text not null default '',
  price numeric(10, 2) check (price is null or price >= 0),
  featured boolean not null default false,
  available boolean not null default true,
  visible boolean not null default true,
  pos_group text not null default '',
  source text not null default 'manuell',
  has_image boolean generated always as (image <> '') stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;

create index products_category_idx on public.products (category_id) where visible;
create index products_visible_order_idx on public.products (visible, featured desc, has_image desc, name);
create index products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);
create index products_brand_trgm_idx on public.products using gin (brand extensions.gin_trgm_ops);

create policy "Produkte lesen" on public.products
  for select to anon, authenticated
  using (visible or (select public.is_admin()));
create policy "Produkte verwalten" on public.products
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- Kategorien mit Produktzahlen (rechnet mit den Rechten des Aufrufers)
create view public.categories_with_counts
with (security_invoker = true) as
select
  c.id, c.name, c.description, c.image, c.sort_order, c.visible,
  count(p.id) filter (where p.visible)::int as visible_count,
  count(p.id)::int as total_count
from public.categories c
left join public.products p on p.category_id = c.id
group by c.id;

-- ---------- Angebote ----------------------------------------------------
create table public.offers (
  id bigint generated always as identity primary key,
  title text not null default 'Wochenangebot' check (char_length(trim(title)) between 1 and 120),
  note text not null default '',
  image text not null default '',
  starts_on date,
  ends_on date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
alter table public.offers enable row level security;

create policy "Angebote lesen" on public.offers
  for select to anon, authenticated
  using (
    (active
      and (starts_on is null or starts_on <= (now() at time zone 'Europe/Berlin')::date)
      and (ends_on is null or ends_on >= (now() at time zone 'Europe/Berlin')::date))
    or (select public.is_admin())
  );
create policy "Angebote verwalten" on public.offers
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create table public.offer_items (
  id bigint generated always as identity primary key,
  offer_id bigint not null references public.offers (id) on delete cascade,
  product_id bigint not null references public.products (id) on delete cascade,
  offer_price numeric(10, 2) check (offer_price is null or offer_price >= 0),
  old_price numeric(10, 2) check (old_price is null or old_price >= 0),
  note text not null default '' check (char_length(note) <= 120),
  sort_order integer not null default 0,
  unique (offer_id, product_id)
);
alter table public.offer_items enable row level security;
create index offer_items_offer_idx on public.offer_items (offer_id, sort_order);
create index offer_items_product_idx on public.offer_items (product_id);

create policy "Angebotspositionen lesen" on public.offer_items
  for select to anon, authenticated
  using (exists (select 1 from public.offers o where o.id = offer_id));
create policy "Angebotspositionen verwalten" on public.offer_items
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- Einstellungen -----------------------------------------------
create table public.settings (
  key text primary key,
  value text not null default '',
  is_public boolean not null default true
);
alter table public.settings enable row level security;

create policy "Einstellungen lesen" on public.settings
  for select to anon, authenticated
  using (is_public or (select public.is_admin()));
create policy "Einstellungen verwalten" on public.settings
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- Kontaktanfragen ---------------------------------------------
create table public.contact_requests (
  id bigint generated always as identity primary key,
  name text not null default '' check (char_length(name) <= 120),
  contact text not null check (char_length(trim(contact)) between 3 and 160),
  purpose text not null default 'Allgemeine Anfrage' check (char_length(purpose) <= 60),
  message text not null check (char_length(trim(message)) between 2 and 4000),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.contact_requests enable row level security;

create policy "Anfrage senden" on public.contact_requests
  for insert to anon, authenticated
  with check (handled = false);
create policy "Anfragen verwalten" on public.contact_requests
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- Kassen-Import -----------------------------------------------
-- p_rows: [{barcode, name, category, unit, price, kassen_id, pos_group, favorit}]
-- Neue Produkte werden angelegt. Vorhandene (gleicher Barcode) bekommen nur
-- Preis, Kassen-ID, Warengruppe und – falls leer – die Einheit. Name, Bild,
-- Kategorie und Sichtbarkeit bleiben, wie sie auf der Website gepflegt wurden.
create or replace function public.import_products(p_rows jsonb, p_visibility text default 'favorites')
returns json
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_inserted int;
  v_updated int;
begin
  if not (public.is_admin() or current_user in ('postgres', 'supabase_admin', 'service_role')) then
    raise exception 'Nicht berechtigt.';
  end if;

  insert into public.categories (name, sort_order)
  select distinct trim(r ->> 'category'), 500
  from jsonb_array_elements(p_rows) r
  where coalesce(trim(r ->> 'category'), '') <> ''
  on conflict (name) do nothing;

  with src as (
    select distinct on (trim(r ->> 'barcode'))
      trim(r ->> 'barcode') as barcode,
      trim(r ->> 'name') as name,
      trim(r ->> 'category') as category,
      coalesce(r ->> 'unit', '') as unit,
      nullif(r ->> 'price', '')::numeric(10, 2) as price,
      nullif(r ->> 'kassen_id', '')::int as kassen_id,
      coalesce(r ->> 'pos_group', '') as pos_group,
      coalesce((r ->> 'favorit')::boolean, false) as favorit
    from jsonb_array_elements(p_rows) r
    where coalesce(trim(r ->> 'barcode'), '') <> '' and coalesce(trim(r ->> 'name'), '') <> ''
  ),
  upserted as (
    insert into public.products as p
      (barcode, name, category_id, unit, price, kassen_id, pos_group, featured, visible, source)
    select s.barcode, s.name, c.id, s.unit, s.price, s.kassen_id, s.pos_group, s.favorit,
      case p_visibility when 'all' then true when 'none' then false else s.favorit end,
      'kasse'
    from src s
    left join public.categories c on c.name = s.category
    on conflict (barcode) do update set
      price = excluded.price,
      kassen_id = excluded.kassen_id,
      pos_group = excluded.pos_group,
      unit = case when p.unit = '' then excluded.unit else p.unit end
    returning (xmax = 0) as inserted
  )
  select count(*) filter (where inserted), count(*) filter (where not inserted)
  into v_inserted, v_updated
  from upserted;

  return json_build_object('inserted', v_inserted, 'updated', v_updated);
end;
$$;
revoke all on function public.import_products(jsonb, text) from public, anon;
grant execute on function public.import_products(jsonb, text) to authenticated;

-- ---------- Rechte für die API-Rollen ------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.offers, public.offer_items,
  public.settings, public.categories_with_counts to anon, authenticated;
grant insert on public.contact_requests to anon, authenticated;
grant select, insert, update, delete on public.categories, public.products, public.offers,
  public.offer_items, public.settings, public.contact_requests to authenticated;
grant select on public.admins to authenticated;
