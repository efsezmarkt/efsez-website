-- =====================================================================
-- EFSE'Z Markt – Bilder-Speicher und Startdaten
-- =====================================================================

-- ---------- Bilder (öffentlich lesbar, nur Personal lädt hoch) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "Personal lädt Bilder hoch" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'images' and (select public.is_admin()));
create policy "Personal ändert Bilder" on storage.objects
  for update to authenticated
  using (bucket_id = 'images' and (select public.is_admin()));
create policy "Personal löscht Bilder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'images' and (select public.is_admin()));

-- ---------- Kategorien ----------
insert into public.categories (name, description, image, sort_order) values
  ('Obst & Gemüse', 'Frisch vom Großmarkt', '', 10),
  ('Frische Theke', 'Fleisch, Geflügel, Fisch', '', 20),
  ('Brot & Backwaren', 'Fladenbrot, Simit, Backzutaten', '', 30),
  ('Milchprodukte & Käse', 'Ayran, Joghurt, Beyaz Peynir', '/assets/categories/kaese.webp', 40),
  ('Wurst & Fleischwaren', 'Sucuk, Salami, Würstchen', '/assets/products/efepasa-sucuk.webp', 50),
  ('Oliven & Eingelegtes', 'Oliven, Turşu, Weinblätter', '/assets/products/sera-gruene-oliven.webp', 60),
  ('Gewürze & Würzpasten', 'Pul Biber, Biber Salçası, Kräuter', '/assets/products/bagdat-pul-biber.webp', 70),
  ('Nudeln, Reis & Getreide', 'Bulgur, Reis, Linsen, Makarna', '/assets/products/duru-bulgur.webp', 80),
  ('Konserven & Vorrat', 'Gläser, Dosen, Fertiggerichte', '', 90),
  ('Öle, Essig & Soßen', 'Olivenöl, Dressings, Nar Ekşisi', '', 100),
  ('Frühstück & Aufstriche', 'Tahin, Pekmez, Honig, Marmelade', '/assets/products/koska-tahin.webp', 110),
  ('Süßwaren & Snacks', 'Baklava, Lokum, Kekse, Halva', '/assets/products/baklava-pistazie.webp', 120),
  ('Nüsse & Trockenfrüchte', 'Kerne, Pistazien, Datteln', '', 130),
  ('Kaffee & Tee', 'Çay, Türk Kahvesi, Instant', '/assets/products/caykur-rize-tee.webp', 140),
  ('Getränke', 'Säfte, Limonaden, Wasser', '/assets/products/yayla-ayran.webp', 150),
  ('Tiefkühl', 'Börek, Gemüse, Teigwaren', '/assets/categories/tiefkuehl.webp', 160),
  ('Internationale Spezialitäten', 'Griechisch, Balkan, Asiatisch', '', 170),
  ('Drogerie & Haushalt', 'Pflege, Putzen, Waschen', '', 180),
  ('Geschenke & Haushalt', 'Tischdecken, Geschirr, Geschenke', '', 190),
  ('Lebensmittel', 'Weitere Lebensmittel', '', 200),
  ('Sonstiges', 'Alles Weitere', '', 900)
on conflict (name) do nothing;

-- ---------- Produkte mit eigenem Bild (aus der ersten Website-Version) ----------
insert into public.products (name, category_id, brand, description, image, featured, unit, origin, allergens, tags)
select v.name, c.id, v.brand, v.description, v.image, v.featured, v.unit, v.origin, v.allergens, v.tags
from (values
  ('Çaykur Rize Tee', 'Kaffee & Tee', 'Çaykur', 'Klassischer Schwarztee aus Rize für den Çay im Doppelkännchen.', '/assets/products/caykur-rize-tee.webp', true, '500 g', 'Türkei', '', 'tee,çay,cay'),
  ('Efepaşa Sucuk', 'Wurst & Fleischwaren', 'Efepaşa', 'Würzige Knoblauchwurst zum Braten, für Menemen oder vom Grill.', '/assets/products/efepasa-sucuk.webp', true, 'Packung', 'Deutschland', '', 'sucuk,wurst'),
  ('Baklava mit Pistazien', 'Süßwaren & Snacks', 'Hausgemacht', 'Hauchdünne Teigschichten mit Pistazien und Sirup.', '/assets/products/baklava-pistazie.webp', true, 'nach Gewicht', '', 'Nüsse, Gluten', 'baklava,theke'),
  ('Sera Grüne Oliven', 'Oliven & Eingelegtes', 'Sera', 'Eingelegte grüne Oliven, mild und knackig.', '/assets/products/sera-gruene-oliven.webp', false, 'Glas', 'Türkei', '', 'oliven,zeytin'),
  ('Bağdat Pul Biber', 'Gewürze & Würzpasten', 'Bağdat', 'Türkische Chiliflocken – mild-scharf und aromatisch.', '/assets/products/bagdat-pul-biber.webp', true, 'Packung', 'Türkei', '', 'pul biber,chili,gewürz'),
  ('Yayla Ayran', 'Getränke', 'Yayla', 'Gesalzenes Joghurtgetränk, eiskalt am besten.', '/assets/products/yayla-ayran.webp', true, 'Becher', 'Deutschland', 'Milch', 'ayran,joghurt'),
  ('Koska Tahin', 'Frühstück & Aufstriche', 'Koska', 'Feine Sesampaste – mit Pekmez zum Frühstück.', '/assets/products/koska-tahin.webp', false, 'Glas', 'Türkei', 'Sesam', 'tahin,sesam'),
  ('Koska Pekmez', 'Frühstück & Aufstriche', 'Koska', 'Traubensirup, natürlich süß.', '/assets/products/koska-pekmez.webp', false, 'Glas', 'Türkei', '', 'pekmez,sirup'),
  ('Duru Bulgur', 'Nudeln, Reis & Getreide', 'Duru', 'Bulgur für Pilav, Kısır und Köfte.', '/assets/products/duru-bulgur.webp', false, 'Packung', 'Türkei', 'Gluten', 'bulgur,pilav')
) as v(name, category, brand, description, image, featured, unit, origin, allergens, tags)
join public.categories c on c.name = v.category;

-- ---------- Einstellungen ----------
insert into public.settings (key, value, is_public) values
  ('whatsapp_number', '', true),
  ('phone', '0911 / 40870524', true),
  ('contact_email', '', true),
  ('address', 'Burgsalacher Str. 1, 90449 Nürnberg', true),
  ('opening_hours', 'Mo–Sa 08:00–20:00', true),
  ('instagram', '', true),
  ('imprint_text', '', true),
  ('privacy_text', '', true),
  ('notify_email', '', false)
on conflict (key) do nothing;
