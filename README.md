# Buy vs Rent &amp; Invest

A small open-source web calculator that compares two long-running decisions:

1. **Buy a home**, pay down a mortgage, and either sell or keep the property at the end of the time horizon.
2. **Rent the same home** and invest the difference (and the down payment) in a market portfolio.

The model is month-by-month, written as a pure function, and aimed at Canadian buyers (semi-annual mortgage compounding, CMHC default insurance tiers, 25/30 year amortization rules). It still works for other jurisdictions if you set the inputs accordingly.

## Highlights

- **Cash to close** by province: land transfer tax (with first-time-buyer rebates), GST/HST on new construction, PST on CMHC where applicable, plus legal/title/inspection.
- **CMHC default insurance** when down payment is below 20% (premium rolled into the mortgage; surfaced in the UI).
- Canadian **semi-annual** mortgage compounding, **25 / 30 year** amortization, optional **sale costs** at exit.
- **Symmetric monthly cash flow**: both paths spend `max(owning_cost, rent)`; the cheaper side invests the difference.
- Expense inflation on ownership costs; editable assumptions; crossover year on the chart.

## Quickstart

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build     # production bundle in dist/
npm run preview   # serve dist/ locally
npm run api       # run the JSON API on http://localhost:8787
npm test          # run the model tests with node --test
```

> Why doesn't `python -m http.server` work? The source is JSX. Browsers can't parse JSX directly — Vite (or any bundler) has to transform it first. Either use `npm run dev` (which transforms on the fly) or `npm run build && npm run preview` (which serves the pre-built static bundle). Once `dist/` exists you can also serve it with anything, including Python's static server.

## Backend / JSON API

The simulation and closing-cost math live in `src/lib/` as pure JS — runtime-agnostic, no React, no DOM, no globals. To expose them over HTTP:

```bash
npm run api                        # listens on http://localhost:8787
PORT=4000 npm run api               # custom port
CORS_ORIGIN=https://example.com npm run api  # lock down CORS
```

Endpoints:

| Method | Path | Body / query | Returns |
| ------ | ---- | ------------ | ------- |
| GET    | `/api/health` | — | service info + default inputs + province list |
| POST   | `/api/simulate` | partial inputs (merged with defaults) | `{ inputs, result }` |
| POST   | `/api/closing-costs` | `{ price, province, firstTimeBuyer, newConstruction, includeTorontoLtt, otherClosingCosts, cmhcPremium }` | breakdown + total |
| POST   | `/api/ltt` | same shape | LTT only |
| POST   | `/api/gst-hst` | same shape | GST/HST only |
| POST   | `/api/sweep` | `{ base, overrides: [{ label, patch }] }` | array of `{ label, delta, deltaVsBaseline, breakeven }` |
| GET    | `/api/closing-costs/preview?price=&province=ON&ftb=true&new=false&toronto=false&other=2500&cmhc=24990` | — | same as POST `/api/closing-costs` |

CORS is open by default so a frontend served from another host (Vite, Python `http.server`, Nginx, S3, anywhere) can call it. Set `CORS_ORIGIN` to restrict in production.

Example:

```bash
curl -s http://localhost:8787/api/closing-costs \
  -H 'content-type: application/json' \
  -d '{"price":1050000,"province":"ON","firstTimeBuyer":true,"newConstruction":true,"includeTorontoLtt":false,"cmhcPremium":24990}' | jq .total
```

The server is zero-dependency Node 18+ using the built-in `node:http` module. Deploy it anywhere that runs Node (Render, Fly, Railway, Vercel functions, AWS Lambda via a small wrapper, a Docker container, or just `pm2` on a VPS).

## Publish to GitHub ([smmiri](https://github.com/smmiri))

Publish **only** the `mortgage-vs-invest` folder as its own repo (not the whole `personal-random` workspace).

### 1. Create the repo and push (first time)

With [GitHub CLI](https://cli.github.com/) installed (`gh auth login`):

```bash
cd personal/mortgage-vs-invest

git init
git add .
git commit -m "Initial release: Canadian buy vs rent calculator"

# Creates https://github.com/smmiri/mortgage-vs-invest and pushes main
gh repo create mortgage-vs-invest --public --source=. --remote=origin --push
```

Without `gh`: create an empty public repo named **mortgage-vs-invest** on GitHub, then:

```bash
cd personal/mortgage-vs-invest
git init
git add .
git commit -m "Initial release: Canadian buy vs rent calculator"
git branch -M main
git remote add origin https://github.com/smmiri/mortgage-vs-invest.git
git push -u origin main
```

### 2. GitHub Pages (free public URL)

1. Open **https://github.com/smmiri/mortgage-vs-invest** → **Settings** → **Pages**.
2. **Build and deployment** → **Source**: **GitHub Actions**.
3. Push to `main` (or run **Deploy to GitHub Pages** under **Actions**).

Workflow: `.github/workflows/deploy-pages.yml`. Live site:

**https://smmiri.github.io/mortgage-vs-invest/**

### 3. Local build matching Pages

```bash
VITE_BASE=/mortgage-vs-invest/ \
VITE_SITE_URL=https://smmiri.github.io/mortgage-vs-invest \
VITE_REPO_URL=https://github.com/smmiri/mortgage-vs-invest \
npm run build
npm run preview
```

## Other static hosts

Drop `dist/` on Vercel, Netlify, or Cloudflare Pages (build: `npm run build`, output: `dist`). For a custom domain use `VITE_BASE=/` and your real `VITE_SITE_URL`.

`VITE_SITE_URL` rewrites `index.html`, `robots.txt`, and `sitemap.xml` at build time (see `scripts/configure-site-url.mjs`).

## SEO

The site ships with:

- A focused `<title>` and `description` tuned for "buy vs rent calculator" and Canadian mortgage keywords.
- Open Graph + Twitter card meta with a 1200×630 SVG social image at `public/og-image.svg`.
- JSON-LD structured data: a `WebApplication` schema for the calculator itself, and a `FAQPage` schema covering the methodology Q&A. Validate at [Google Rich Results Test](https://search.google.com/test/rich-results).
- A canonical `<link rel="canonical">` so deploys with multiple hostnames (e.g. `preview.*`, `www.*`) don't dilute ranking.
- `robots.txt` and `sitemap.xml` in `public/` — both get the deployed host substituted in.
- `noscript` block with a short description of the tool for crawlers that don't run JavaScript.
- Skip-to-content link, semantic landmarks (`<header>`, `<main>`, `<section>`, `<footer>`), and an `aria-label` on each major region for accessibility (which also helps SEO).
- `font-display: swap` on Google Fonts and `preconnect` hints to cut LCP.

Things to do yourself before launch:

- Replace the title, description, and keywords if your audience is not Canadian buyers.
- Convert `og-image.svg` to a 1200×630 PNG for the broadest social platform support and update the `og:image` extension. Many platforms accept SVG now, but PNG is the safest default.
- Add a `<meta name="google-site-verification">` tag if you want Google Search Console.
- Add an analytics snippet (Plausible, Fathom, Umami, GA) in `index.html`. The repo intentionally ships with none.

## Project layout

```
public/
  robots.txt               Crawler directives + sitemap pointer
  sitemap.xml              Single canonical URL (rewritten at build)
  site.webmanifest         PWA manifest
  favicon.svg              App icon
  og-image.svg             1200x630 social card

scripts/
  configure-site-url.mjs   Post-build URL substitution (canonical URL etc.)
  serve-api.mjs            Zero-dependency Node HTTP server for the JSON API

src/
  App.jsx                  Compose Header / Hero / Calculator / Methodology / Footer
  main.jsx                 React entry
  index.css                Tailwind v4 + Inter
  lib/
    model.js               Pure simulation. Returns trajectory + summary stats.
    closing-costs.js       LTT / GST-HST / PST-on-CMHC by province, FTB programs.
    defaults.js            DEFAULT_INPUTS + FIELD_META (labels, help text, steps)
    format.js              Currency / percent formatters
    model.test.js          node:test smoke tests for the simulation
    closing-costs.test.js  node:test smoke tests for the tax math
  components/
    Header.jsx Hero.jsx Calculator.jsx
    InputPanel.jsx InputField.jsx SliderField.jsx InfoTip.jsx
    ClosingCostsSection.jsx
    StatCard.jsx Summary.jsx WealthChart.jsx YearTable.jsx Warnings.jsx
    Methodology.jsx Footer.jsx
```

The model is the most important file. It is dependency-free and small enough to read in one sitting. Everything else is presentation.

## Methodology in one screen

- Canadian effective monthly rate: `r_m = (1 + r/2)^(1/6) − 1`.
- Mortgage payment: `P · r_m · (1 + r_m)^n / ((1 + r_m)^n − 1)`.
- CMHC: 2.8% (15–19.99% down), 3.1% (10–14.99%), 4.0% (5–9.99%). +0.20% if amortization > 25y.
- Both lines start at the down payment at year 0 (rebased baseline). The methodology section in the app explains the rebasing and what is hidden by it.
- Each month: pay interest + principal, inflate ownership expenses, set `cap = max(owning_cost, rent)`, the cheaper side invests `cap − own_cost` (buyer's side portfolio) or `cap − rent` (renter portfolio) at the market return.
- At year `t`: buyer wealth = `down_payment + (liquid_value_t − liquid_value_0) + buyer_side_portfolio_t`; renter wealth = `renter_portfolio_t`.
- `liquid_value_t = property_value_t · (1 − sale_cost%) − mortgage_balance_t`, or just `property_value_t − mortgage_balance_t` when sale costs are disabled.

## Contributing

Issues and PRs are welcome. Keep the model pure and tested:

```bash
npm test
```

When adding a new assumption, prefer a new input on the panel over hard-coded constants. Add a help string in `FIELD_META` and a short methodology paragraph.

## Disclaimer

**Not financial advice.** This calculator is a simplified, educational model — not a substitute for a mortgage broker, accountant, or lawyer.

**Included (approximate):** CMHC tiers and 30-year surcharge; monthly P&I with semi-annual compounding; province-aware land transfer tax and first-time-buyer rebates; GST/HST new-housing rebates on new builds; PST on CMHC in ON/QC/SK/MB; legal/title/inspection; optional end-of-horizon sale costs; rent and ownership expense inflation.

**Not included:** Income taxes (marginal rates, TFSA/RRSP/FHSA, principal-residence capital gains rules); mortgage refinancing or renewal at new rates; major one-off capital repairs beyond the monthly maintenance input; renter's insurance, deposits, or moving costs; rent-control ceilings (set your own rent-increase assumption). Growth rates are held constant over the horizon.

Treat every output as **directional**. Change one input at a time and watch the crossover shift — use it as a **sensitivity tool**, not a recommendation to buy or rent.

## License

MIT. See [LICENSE](./LICENSE).
