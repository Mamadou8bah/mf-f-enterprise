import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

function siteMetaPlugin(siteUrl: string): Plugin {
  const base = siteUrl.replace(/\/$/, "") || "http://localhost:5173";
  return {
    name: "mff-site-meta",
    closeBundle() {
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
      writeFileSync(resolve(__dirname, "dist/sitemap.xml"), sitemap);
      writeFileSync(
        resolve(__dirname, "dist/robots.txt"),
        `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`
      );
    },
  };
}

/** Standalone marketing site. Talks to the desk app only via VITE_API_BASE. */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteUrl = env.VITE_SITE_URL || "http://localhost:5173";

  return {
    plugins: [react(), siteMetaPlugin(siteUrl)],
    // Ensure %VITE_SITE_URL% in index.html is replaced at build/dev
    envPrefix: "VITE_",
    define: {
      // Fallback so empty env still produces a usable absolute URL in HTML
      "import.meta.env.VITE_SITE_URL": JSON.stringify(siteUrl),
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    preview: {
      port: 4173,
      strictPort: true,
    },
  };
});
