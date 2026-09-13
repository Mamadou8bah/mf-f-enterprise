# MF & F Enterprise

Office system for **MF & F Enterprise** — record rent at the desk, issue receipts, manage tenants and units, and publish vacant rooms on the public website.

## Apps

| App | Folder | Purpose |
|-----|--------|---------|
| **Desk** | `web/` | Staff work — payments, receipts, tenants, due lists, settings |
| **Website** | `website/` | Public site — company presence and vacant listings |

## Who signs in

| Role | Demo login | Access |
|------|------------|--------|
| **Owner** | `admin@garawol.gm` | Full desk plus settings |
| **Secretary** | `secretary@garawol.gm` | Counter work — payments, receipts, tenants, due & overdue |

Demo password for both: `garawol123`  
Change these before handing over to the client.

## What the desk does

- Find a tenant and record payment
- Print or share official receipts
- Register tenants, assign units, mark move-out
- See vacant rooms and occupancy
- See rent due in 7 days and overdue
- Daily cash-up and settlement reports
- Owner settings for the portfolio and office accounts

## Setup

You need **Node.js** and a **Postgres** database.

### 1. Desk

```bash
cd web
cp .env.example .env.local
cp .env.example packages/db/.env
```

Fill in both env files (same values are fine for local work):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | App database connection (pooled URL if your host provides one) |
| `DIRECT_URL` | Direct database URL for schema updates |
| `NEXTAUTH_URL` | Desk URL, e.g. `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Long random string |

Then:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Desk: http://localhost:3000

### 2. Website

```bash
cd website
cp .env.example .env.development
```

Set `VITE_API_BASE` to the desk URL (local default is `http://localhost:3000`).  
Set `VITE_SITE_URL` to the public website URL (for link previews and sitemap).

```bash
npm install
npm run dev
```

Website: http://localhost:5173

Vacancies load from the desk at `GET /api/public/vacancies`.

### 3. Deploy

- Deploy `web/` as the desk. Set the same env vars for production (`NEXTAUTH_URL` must be the live desk URL).
- Deploy `website/` as the public site. At build time set:
  - `VITE_API_BASE` → live desk URL
  - `VITE_SITE_URL` → live website URL

## Brand

- Company: MF & F Enterprise  
- Colours: navy, white, gold  
- Receipt numbers: `MFF-YYYY-#####`
