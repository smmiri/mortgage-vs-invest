const currencyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

const currencyDecimalFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat("en-CA", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(n) {
  if (!Number.isFinite(n)) return "—";
  return currencyFormatter.format(Math.round(n));
}

export function formatCurrencyDecimal(n) {
  if (!Number.isFinite(n)) return "—";
  return currencyDecimalFormatter.format(n);
}

export function formatCompactCurrency(n) {
  if (!Number.isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${compactFormatter.format(Math.abs(n))}`;
}

export function formatSignedCurrency(n) {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(Math.round(n));
  const sign = n >= 0 ? "+" : "−";
  return `${sign}${currencyFormatter.format(abs).replace(/^[-]?/, "")}`;
}

export function formatPercent(value, digits = 1) {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}
