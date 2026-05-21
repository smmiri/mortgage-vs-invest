#!/usr/bin/env node
// Substitute the placeholder site URL in `dist/` after `vite build`.
// Vite copies the `public/` folder verbatim, so robots.txt and sitemap.xml
// keep the placeholder URL unless we rewrite them here.
//
// Usage: VITE_SITE_URL=https://your-domain.tld node scripts/configure-site-url.mjs

import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const PLACEHOLDER = "https://rentorbuy.smmiri.com";
const TARGETS = new Set([".html", ".xml", ".txt", ".webmanifest", ".json", ".svg"]);
const root = new URL("../dist/", import.meta.url);

const siteUrl = (process.env.VITE_SITE_URL || "").replace(/\/$/, "");
if (!siteUrl || siteUrl === PLACEHOLDER) {
  console.log(`[configure-site-url] VITE_SITE_URL not set or equals placeholder; skipping.`);
  process.exit(0);
}

async function walk(dir) {
  const entries = await readdir(dir);
  const files = [];
  for (const entry of entries) {
    const full = new URL(entry, dir + "/");
    const s = await stat(full);
    if (s.isDirectory()) {
      files.push(...(await walk(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

const files = await walk(root);
let changed = 0;
for (const file of files) {
  const path = file.pathname;
  const ext = path.slice(path.lastIndexOf("."));
  if (!TARGETS.has(ext)) continue;
  const original = await readFile(file, "utf8");
  if (!original.includes(PLACEHOLDER)) continue;
  await writeFile(file, original.split(PLACEHOLDER).join(siteUrl));
  changed += 1;
}
console.log(`[configure-site-url] Rewrote ${changed} file(s) with ${siteUrl}.`);
