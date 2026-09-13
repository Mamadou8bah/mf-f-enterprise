# MF & F Enterprise

Only two apps at the repo root:

| App | Folder | Stack | Role |
|-----|--------|--------|------|
| **Desk** | `web/` | Next.js + Prisma | Staff login, payments, receipts |
| **Website** | `website/` | Vite + React | Public marketing + vacant listings |

They do not share runtime code. The website only calls:

`GET {desk}/api/public/vacancies`

## Desk (`web/`)

Requires Neon Postgres URLs in `web/.env.local` and `web/packages/db/.env`:

- `DATABASE_URL` — pooled (`…-pooler…`) with `sslmode=require&pgbouncer=true&connect_timeout=30`
- `DIRECT_URL` — non-pooler host (for `db:push` / migrate)

If the desk shows “Can't reach database server”, Neon may be waking from idle — refresh once, or restart `npm run dev`.

```bash
cd web
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

→ http://localhost:3000

Seeded login (change after first login):

- `admin@garawol.gm` / `garawol123`
- `secretary@garawol.gm` / `garawol123`

Netlify (desk): base directory `web`. Set `DATABASE_URL` (pooled), `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (strong random). Build runs `prisma generate` then `next build`.

**Before handover:** change Owner/Secretary passwords in Admin → Staff. Do not ship `garawol123` to clients as a permanent password.

## Website (`website/`)

```bash
cd website
npm install
npm run dev
```

→ http://localhost:5173

Set `VITE_API_BASE` (see `website/.env.example`) to the desk URL.

Netlify (website): base directory `website`. Set `VITE_API_BASE` to the **production desk URL** at **build** time.

## Production notes

- Word import and local photo upload are **disabled on Netlify/production** (no durable disk / SQLite there). Portfolio is already on Neon.
- Public API: `GET /api/public/vacancies` (CORS `*`) for the marketing site.
- Neon cold starts: first request after idle may be slow; use pooled `DATABASE_URL` with `connect_timeout=30`.

## Brand

- Company: MF & F Enterprise
- Colours: navy, white, gold
- Receipts: `MFF-YYYY-#####`

## Database

- Prisma schema: `web/packages/db/prisma/schema.prisma`
- Hosted on Neon Postgres (local and production)
- Real portfolio lives in Neon; optional one-shot reload from local SQLite:

```bash
cd web
# requires web/data/garawol.db + DATABASE_URL
npx tsx scripts/migrate-sqlite-to-neon.ts
```

- Word/ledger import scripts still target SQLite and are only for rebuilding that file if needed
