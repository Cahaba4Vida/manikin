import { neon } from '@neondatabase/serverless';

const fallbackProducts = [
  {
    id: 'vest_plate_carrier_alpha',
    name: 'Plate Carrier Alpha',
    category: 'vest',
    style_key: 'plate_carrier',
    price_cents: 26500,
    active: true,
    variants: [
      { id: 'vest_plate_carrier_alpha_black', color_name: 'Black', color_code: '#181a1d' },
      { id: 'vest_plate_carrier_alpha_tan', color_name: 'Tan', color_code: '#8a7152' },
      { id: 'vest_plate_carrier_alpha_olive', color_name: 'Olive', color_code: '#55624b' }
    ]
  },
  {
    id: 'vest_chest_rig_scout',
    name: 'Chest Rig Scout',
    category: 'vest',
    style_key: 'chest_rig',
    price_cents: 17900,
    active: true,
    variants: [
      { id: 'vest_chest_rig_scout_black', color_name: 'Black', color_code: '#181a1d' },
      { id: 'vest_chest_rig_scout_tan', color_name: 'Tan', color_code: '#91734d' },
      { id: 'vest_chest_rig_scout_gray', color_name: 'Gray', color_code: '#656b73' }
    ]
  },
  {
    id: 'helmet_high_cut_echo',
    name: 'High-Cut Helmet Echo',
    category: 'helmet',
    style_key: 'high_cut',
    price_cents: 32500,
    active: true,
    variants: [
      { id: 'helmet_high_cut_echo_black', color_name: 'Black', color_code: '#17191c' },
      { id: 'helmet_high_cut_echo_tan', color_name: 'Tan', color_code: '#8c7250' },
      { id: 'helmet_high_cut_echo_green', color_name: 'Green', color_code: '#4d5d4f' }
    ]
  },
  {
    id: 'helmet_mich_bravo',
    name: 'MICH Helmet Bravo',
    category: 'helmet',
    style_key: 'mich',
    price_cents: 28900,
    active: true,
    variants: [
      { id: 'helmet_mich_bravo_black', color_name: 'Black', color_code: '#191b1e' },
      { id: 'helmet_mich_bravo_tan', color_name: 'Tan', color_code: '#8b7252' },
      { id: 'helmet_mich_bravo_coyote', color_name: 'Coyote', color_code: '#7c6241' }
    ]
  }
];

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body)
});

export async function handler() {
  if (!process.env.NEON_DATABASE_URL) {
    return json(200, fallbackProducts);
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL);
    const rows = await sql`
      select
        p.id,
        p.name,
        p.category,
        p.style_key,
        p.price_cents,
        p.active,
        coalesce(
          json_agg(
            json_build_object(
              'id', v.id,
              'color_name', v.color_name,
              'color_code', v.color_code
            )
            order by v.sort_order asc, v.color_name asc
          ) filter (where v.id is not null and v.active = true),
          '[]'::json
        ) as variants
      from products p
      left join product_variants v on v.product_id = p.id
      where p.active = true
      group by p.id
      order by p.category asc, p.sort_order asc, p.created_at asc;
    `;

    if (!rows.length) {
      return json(200, fallbackProducts);
    }

    return json(200, rows);
  } catch (error) {
    return json(200, fallbackProducts);
  }
}
