# Custom domain: rentorbuy.smmiri.com

## DNS (Cloudflare, zone smmiri.com)

| Type  | Name       | Target           | Proxy      |
| ----- | ---------- | ---------------- | ---------- |
| CNAME | `rentorbuy` | `smmiri.github.io` | DNS only   |

## GitHub Pages

1. Repo **Settings → Pages → Custom domain:** `rentorbuy.smmiri.com`
2. Wait for DNS check and TLS certificate (minutes to 24h).
3. Enable **Enforce HTTPS** when available.

## Build (this repo)

Deploy workflow sets:

- `VITE_BASE=/`
- `VITE_SITE_URL=https://rentorbuy.smmiri.com`

Local production build:

```bash
VITE_BASE=/ VITE_SITE_URL=https://rentorbuy.smmiri.com npm run build
npm run preview
```

## SEO after go-live

1. [Google Search Console](https://search.google.com/search-console): add property `https://rentorbuy.smmiri.com`
2. Submit sitemap: `https://rentorbuy.smmiri.com/sitemap.xml`
3. Optional Cloudflare redirect: `smmiri.github.io/mortgage-vs-invest` → `https://rentorbuy.smmiri.com`

## Optional: PNG social image

Some networks prefer `og-image.png` (1200×630) over `og-image.svg`. Add `public/og-image.png` and point `og:image` / `twitter:image` in `index.html` to it.
