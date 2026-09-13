# MF & F public website

Public site for MF & F Enterprise — company presence and vacant rooms from the desk.

## Setup

```bash
cp .env.example .env.development
```

Set `VITE_API_BASE` to the desk base URL (no trailing slash), e.g. `http://localhost:3000`.  
Set `VITE_SITE_URL` to this site’s public URL (used for Open Graph previews, canonical, sitemap).

```bash
npm install
npm run dev
```

Open http://localhost:5173
