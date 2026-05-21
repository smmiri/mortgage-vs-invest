import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import * as format from "../lib/format.js";

export function useFormat() {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  return useMemo(
    () => ({
      locale,
      formatCurrency: (n) => format.formatCurrency(n, locale),
      formatCurrencyDecimal: (n) => format.formatCurrencyDecimal(n, locale),
      formatCompactCurrency: (n) => format.formatCompactCurrency(n, locale),
      formatSignedCurrency: (n) => format.formatSignedCurrency(n, locale),
      formatPercent: (n, digits) => format.formatPercent(n, digits, locale),
    }),
    [locale],
  );
}
