import { normalizeLocale } from "./locale.js";

const formatterCache = new Map();

function localeTag(locale) {
  return normalizeLocale(locale) === "fa" ? "fa-IR" : "en-CA";
}

function getFormatters(locale) {
  const key = normalizeLocale(locale);
  if (formatterCache.has(key)) return formatterCache.get(key);

  const tag = localeTag(key);
  const formatters = {
    currency: new Intl.NumberFormat(tag, {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }),
    currencyDecimal: new Intl.NumberFormat(tag, {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 2,
    }),
    compact: new Intl.NumberFormat(tag, {
      notation: "compact",
      maximumFractionDigits: 1,
    }),
    percent: (value, digits = 1) => {
      if (!Number.isFinite(value)) return "n/a";
      const pct = (value * 100).toFixed(digits);
      return normalizeLocale(key) === "fa" ? `${pct}٪` : `${pct}%`;
    },
    locale: key,
  };
  formatterCache.set(key, formatters);
  return formatters;
}

export { getFormatters };

export function formatCurrency(n, locale = "en") {
  if (!Number.isFinite(n)) return "n/a";
  return getFormatters(locale).currency.format(Math.round(n));
}

export function formatCurrencyDecimal(n, locale = "en") {
  if (!Number.isFinite(n)) return "n/a";
  return getFormatters(locale).currencyDecimal.format(n);
}

export function formatCompactCurrency(n, locale = "en") {
  if (!Number.isFinite(n)) return "n/a";
  const f = getFormatters(locale);
  const sign = n < 0 ? (f.locale === "fa" ? "−" : "-") : "";
  const compact = f.compact.format(Math.abs(n));
  if (f.locale === "fa") {
    return `${sign}${compact.replace(/\$/g, "")} $`;
  }
  return `${sign}$${compact}`;
}

export function formatSignedCurrency(n, locale = "en") {
  if (!Number.isFinite(n)) return "n/a";
  const f = getFormatters(locale);
  const abs = Math.abs(Math.round(n));
  const sign = n >= 0 ? (f.locale === "fa" ? "+" : "+") : "−";
  const formatted = f.currency.format(abs);
  return `${sign}${formatted.replace(/^[-−]?/, "")}`;
}

export function formatPercent(value, digits = 1, locale = "en") {
  return getFormatters(locale).percent(value, digits);
}
