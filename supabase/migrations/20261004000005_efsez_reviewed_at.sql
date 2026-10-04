-- =====================================================================
-- EFSE'Z Markt – Pflegemodus
-- reviewed_at: wann das Personal ein Produkt zuletzt durchgesehen hat.
-- Der Pflegemodus zeigt immer die Produkte zuerst, die am längsten nicht
-- (oder noch nie) gepflegt wurden. Der Kassen-Import ändert das Feld nicht.
-- =====================================================================

alter table public.products add column reviewed_at timestamptz;

create index products_review_queue_idx on public.products
  (reviewed_at asc nulls first, visible desc, featured desc, id)
  where merged_into is null;
