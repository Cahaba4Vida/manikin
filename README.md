# Tactical 3D Configurator (Netlify + Neon)

This is a deployable MVP for a tactical store product viewer:

- fixed male mannequin
- black pants + black long sleeve base outfit
- swappable vest products
- swappable helmet products
- color swaps like black / tan / olive / gray
- Netlify-hosted static frontend
- Netlify Function for live Neon products
- fallback sample products if the DB is empty or the env var is missing

## What is included

- `index.html` — main UI
- `styles.css` — responsive styling
- `app.js` — Three.js mannequin + product UI
- `netlify/functions/products.js` — Neon-backed products endpoint
- `sql/setup.sql` — schema + seed data for Neon
- `netlify.toml` — Netlify routing for the API

## Fastest way to preview

### Option A: Netlify Drop

You can drag this whole folder or ZIP into Netlify Drop to preview the frontend immediately.

Important:
- the static site will work
- the API function will **not** be bundled through a plain ZIP drop workflow
- the site will automatically fall back to the built-in sample products

So this is good for quick preview only.

## Full deploy with Neon-backed data

### 1) Put the project in GitHub
Create a repo and upload all files in this folder.

### 2) Import the repo into Netlify
In Netlify:
- Add new site
- Import from existing repository
- Select this repo

### 3) Add environment variable
In Netlify site settings, add:

- `NEON_DATABASE_URL` = your Neon connection string

### 4) Run SQL in Neon
Open Neon SQL editor and run:

- `sql/setup.sql`

That creates the tables and inserts example products.

### 5) Deploy
Netlify will build the function and publish the static site.

## How the product system works

Products are stored in `products`:
- `vest`
- `helmet`

Color variants are stored in `product_variants`.

The frontend calls:
- `/api/products`

If live products are found, it uses Neon data.
If not, it falls back to the built-in sample data.

## How to add more products later

### Add a new vest
Insert into `products` with:
- unique `id`
- `category = 'vest'`
- `style_key = 'plate_carrier'` or `style_key = 'chest_rig'`

Then add variants in `product_variants`.

### Add a new helmet
Insert into `products` with:
- unique `id`
- `category = 'helmet'`
- `style_key = 'high_cut'` or `style_key = 'mich'`

Then add variants in `product_variants`.

## Current MVP limitation

This version does **not** use imported GLB models yet.
The mannequin, vest, and helmet are built from simple Three.js shapes so the project works right away without an asset pipeline.

That is intentional for version 1.

## Best next upgrade

When you want a more realistic viewer, the next step is:
- replace the primitive mannequin with a GLB male base model
- replace the primitive vest/helmet meshes with actual GLB assets
- keep the same DB structure and UI controls

That way the backend and product logic stay the same.


Patch: switched Three.js imports to esm.sh for browser-safe module resolution on Netlify, and added a favicon to remove the 404 warning.
