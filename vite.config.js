import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const PLACEHOLDER_HOST = "https://buy-vs-rent.example.com";

/**
 * Replace the placeholder canonical URL in index.html, robots.txt, and
 * sitemap.xml with the value of `VITE_SITE_URL` at build time.
 *
 * The placeholder makes the source tree readable on GitHub. Setting
 * `VITE_SITE_URL=https://your-domain.tld` in `.env` (or in the deploy
 * environment) rewrites every reference before assets ship.
 */
function siteUrlSubstitution(siteUrl) {
  if (!siteUrl || siteUrl === PLACEHOLDER_HOST) return null;
  const trimmed = siteUrl.replace(/\/$/, "");
  const replace = (s) => s.split(PLACEHOLDER_HOST).join(trimmed);
  return {
    name: "site-url-substitution",
    apply: "build",
    transformIndexHtml: (html) => replace(html),
    generateBundle(_, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === "asset" && typeof file.source === "string") {
          file.source = replace(file.source);
        }
      }
    },
    closeBundle() {
      // No-op: public/ assets (robots.txt, sitemap.xml) are copied verbatim
      // by Vite. Substitute them via a small post-build step in package.json.
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // GitHub Pages serves project sites at /repo-name/ — set VITE_BASE=/mortgage-vs-invest/
  const base = env.VITE_BASE || "/";
  return {
    base,
    plugins: [react(), tailwindcss(), siteUrlSubstitution(env.VITE_SITE_URL)].filter(Boolean),
  };
});
