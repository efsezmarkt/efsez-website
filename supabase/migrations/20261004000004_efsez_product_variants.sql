-- =====================================================================
-- EFSE'Z Markt – Sorten & Größen zusammenfassen
-- Die Kasse führt jede Sorte/Größe als eigenen Artikel. Auf der Website
-- wird daraus EIN Produkt: Die anderen Artikel zeigen per merged_into auf
-- das Hauptprodukt und sind selbst ausgeblendet. Ihre Preise pflegt der
-- Kassen-Import weiter; das Hauptprodukt hält eine Zusammenfassung
-- (variants, price_from/price_to), die öffentlich lesbar ist.
-- =====================================================================

alter table public.products
  add column merged_into bigint references public.products (id) on delete set null,
  add column variants jsonb not null default '[]'::jsonb,
  add column variant_count integer not null default 0,
  add column price_from numeric(10, 2),
  add column price_to numeric(10, 2),
  add column variant_names text not null default '',
  add constraint products_not_self_merged check (merged_into is null or merged_into <> id);

alter table public.products
  add column search_text text generated always as (name || ' ' || brand || ' ' || variant_names) stored;

create index products_merged_into_idx on public.products (merged_into) where merged_into is not null;
create index products_search_trgm_idx on public.products using gin (search_text extensions.gin_trgm_ops);

-- Zusammenfassung eines Hauptprodukts neu berechnen
create or replace function public.refresh_product_variants(p_main bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.products m set
    variants = coalesce(v.list, '[]'::jsonb),
    variant_count = coalesce(v.cnt, 0),
    price_from = v.pmin,
    price_to = v.pmax,
    variant_names = coalesce(v.names, '')
  from (
    select
      jsonb_agg(jsonb_build_object('id', a.id, 'name', a.name, 'unit', a.unit, 'price', a.price)
        order by a.price nulls last, a.name) as list,
      count(*)::int as cnt,
      min(a.price) as pmin,
      max(a.price) as pmax,
      string_agg(a.name, ' ') as names
    from (
      select id, name, unit, price from public.products where id = p_main
      union all
      select id, name, unit, price from public.products where merged_into = p_main
    ) a
  ) v
  where m.id = p_main;

  -- Ohne Varianten: Zusammenfassung leeren
  update public.products set variants = '[]'::jsonb, variant_count = 0, price_from = null, price_to = null, variant_names = ''
  where id = p_main and not exists (select 1 from public.products c where c.merged_into = p_main);
end;
$$;
revoke all on function public.refresh_product_variants(bigint) from public, anon, authenticated;

create or replace function public.products_variants_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.merged_into is not null then
    perform public.refresh_product_variants(old.merged_into);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    if new.merged_into is not null and (tg_op = 'INSERT' or new.merged_into is distinct from old.merged_into) then
      perform public.refresh_product_variants(new.merged_into);
    end if;
    if tg_op = 'UPDATE' and new.variant_count > 0 then
      perform public.refresh_product_variants(new.id);
    end if;
  end if;
  return null;
end;
$$;
revoke all on function public.products_variants_trigger() from public, anon, authenticated;

create trigger products_variants_sync
  after insert or delete or update of price, unit, name, merged_into on public.products
  for each row execute function public.products_variants_trigger();

-- Personal: Artikel zu einem Produkt zusammenfassen bzw. wieder herauslösen
create or replace function public.merge_products(p_main bigint, p_ids bigint[], p_title text default null)
returns json
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_moved int;
begin
  if not (private.is_admin() or current_user in ('postgres', 'supabase_admin', 'service_role')) then
    raise exception 'Nicht berechtigt.';
  end if;

  -- Varianten, die schon an einem der Artikel hängen, mitnehmen
  update public.products set merged_into = p_main
  where merged_into = any (p_ids) and id <> p_main;

  update public.products set merged_into = p_main, visible = false, featured = false
  where id = any (p_ids) and id <> p_main;
  get diagnostics v_moved = row_count;

  update public.products set
    merged_into = null,
    name = coalesce(nullif(trim(p_title), ''), name)
  where id = p_main;

  perform public.refresh_product_variants(p_main);
  return json_build_object('merged', v_moved);
end;
$$;
revoke all on function public.merge_products(bigint, bigint[], text) from public, anon;
grant execute on function public.merge_products(bigint, bigint[], text) to authenticated;

create or replace function public.unmerge_product(p_id bigint)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (private.is_admin() or current_user in ('postgres', 'supabase_admin', 'service_role')) then
    raise exception 'Nicht berechtigt.';
  end if;
  update public.products set merged_into = null where id = p_id;
end;
$$;
revoke all on function public.unmerge_product(bigint) from public, anon;
grant execute on function public.unmerge_product(bigint) to authenticated;
