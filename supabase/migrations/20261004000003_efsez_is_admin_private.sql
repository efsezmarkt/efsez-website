-- =====================================================================
-- EFSE'Z Markt – Rechteprüfung aus der öffentlichen API nehmen
-- (Supabase-Advisor: Security-Definer-Funktion nicht per RPC aufrufbar)
-- =====================================================================

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

-- ---------- Richtlinien auf private.is_admin() umstellen ----------
alter policy "Kategorien lesen" on public.categories using (visible or (select private.is_admin()));
alter policy "Kategorien verwalten" on public.categories using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "Produkte lesen" on public.products using (visible or (select private.is_admin()));
alter policy "Produkte verwalten" on public.products using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "Angebote lesen" on public.offers using (
  (active
    and (starts_on is null or starts_on <= (now() at time zone 'Europe/Berlin')::date)
    and (ends_on is null or ends_on >= (now() at time zone 'Europe/Berlin')::date))
  or (select private.is_admin()));
alter policy "Angebote verwalten" on public.offers using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "Angebotspositionen verwalten" on public.offer_items using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "Einstellungen lesen" on public.settings using (is_public or (select private.is_admin()));
alter policy "Einstellungen verwalten" on public.settings using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "Anfragen verwalten" on public.contact_requests using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "Personal lädt Bilder hoch" on storage.objects with check (bucket_id = 'images' and (select private.is_admin()));
alter policy "Personal ändert Bilder" on storage.objects using (bucket_id = 'images' and (select private.is_admin()));
alter policy "Personal löscht Bilder" on storage.objects using (bucket_id = 'images' and (select private.is_admin()));

-- ---------- Kassen-Import ----------
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
  if not (private.is_admin() or current_user in ('postgres', 'supabase_admin', 'service_role')) then
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

revoke execute on function public.is_admin() from anon, authenticated;
