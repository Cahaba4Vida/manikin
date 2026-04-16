create extension if not exists pgcrypto;

create table if not exists products (
  id text primary key,
  name text not null,
  category text not null check (category in ('vest', 'helmet')),
  style_key text not null,
  price_cents integer not null default 0,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists product_variants (
  id text primary key,
  product_id text not null references products(id) on delete cascade,
  color_name text not null,
  color_code text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on products(category);
create index if not exists idx_product_variants_product_id on product_variants(product_id);

insert into products (id, name, category, style_key, price_cents, sort_order)
values
  ('vest_plate_carrier_alpha', 'Plate Carrier Alpha', 'vest', 'plate_carrier', 26500, 1),
  ('vest_chest_rig_scout', 'Chest Rig Scout', 'vest', 'chest_rig', 17900, 2),
  ('helmet_high_cut_echo', 'High-Cut Helmet Echo', 'helmet', 'high_cut', 32500, 1),
  ('helmet_mich_bravo', 'MICH Helmet Bravo', 'helmet', 'mich', 28900, 2)
on conflict (id) do update
set
  name = excluded.name,
  category = excluded.category,
  style_key = excluded.style_key,
  price_cents = excluded.price_cents,
  sort_order = excluded.sort_order,
  active = true;

insert into product_variants (id, product_id, color_name, color_code, sort_order)
values
  ('vest_plate_carrier_alpha_black', 'vest_plate_carrier_alpha', 'Black', '#181a1d', 1),
  ('vest_plate_carrier_alpha_tan', 'vest_plate_carrier_alpha', 'Tan', '#8a7152', 2),
  ('vest_plate_carrier_alpha_olive', 'vest_plate_carrier_alpha', 'Olive', '#55624b', 3),

  ('vest_chest_rig_scout_black', 'vest_chest_rig_scout', 'Black', '#181a1d', 1),
  ('vest_chest_rig_scout_tan', 'vest_chest_rig_scout', 'Tan', '#91734d', 2),
  ('vest_chest_rig_scout_gray', 'vest_chest_rig_scout', 'Gray', '#656b73', 3),

  ('helmet_high_cut_echo_black', 'helmet_high_cut_echo', 'Black', '#17191c', 1),
  ('helmet_high_cut_echo_tan', 'helmet_high_cut_echo', 'Tan', '#8c7250', 2),
  ('helmet_high_cut_echo_green', 'helmet_high_cut_echo', 'Green', '#4d5d4f', 3),

  ('helmet_mich_bravo_black', 'helmet_mich_bravo', 'Black', '#191b1e', 1),
  ('helmet_mich_bravo_tan', 'helmet_mich_bravo', 'Tan', '#8b7252', 2),
  ('helmet_mich_bravo_coyote', 'helmet_mich_bravo', 'Coyote', '#7c6241', 3)
on conflict (id) do update
set
  product_id = excluded.product_id,
  color_name = excluded.color_name,
  color_code = excluded.color_code,
  sort_order = excluded.sort_order,
  active = true;
