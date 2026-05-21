import { useTranslation } from "react-i18next";
import InfoTip from "./InfoTip.jsx";
import { useFormat } from "../hooks/useFormat.js";

export default function AmortizationSelector({ value, onChange, meta, compact = false }) {
  const { t } = useTranslation();
  const selected = value === 30 ? 30 : 25;

  const options = [
    { years: 25, label: t("amort.y25"), hint: t("amort.y25hint") },
    { years: 30, label: t("amort.y30"), hint: t("amort.y30hint") },
  ];

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-sm font-medium text-label">{meta.label}</span>
        {meta.help ? <InfoTip text={meta.help} /> : null}
      </div>
      <div
        role="radiogroup"
        aria-label={meta.label}
        className={`grid gap-2 rounded-lg border border-default bg-surface-inset p-1 ${
          compact ? "grid-cols-1" : "grid-cols-2"
        }`}
      >
        {options.map(({ years, label, hint }) => {
          const active = selected === years;
          return (
            <button
              key={years}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(years)}
              className={`rounded-md px-3 py-2 text-start transition-colors ${
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-surface-card text-label hover:bg-surface-inset"
              }`}
            >
              <div className="text-sm font-semibold">{label}</div>
              {!compact && hint ? (
                <div
                  className={`mt-0.5 text-[11px] leading-snug ${
                    active ? "text-indigo-100" : "text-muted"
                  }`}
                >
                  {hint}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Shown when down payment is below 20% — CMHC is mandatory and rolls into the mortgage. */
export function CmhcInsuranceCallout({ results, inputs, variant = "full" }) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const price = inputs.propertyPrice || 0;
  if (price <= 0 || price > 1_500_000) return null;

  const downPct = inputs.downPayment / price;
  if (downPct >= 0.2) return null;

  const { cmhcPremium, cmhcRateApplied, totalPrincipal } = results;
  const baseMortgage = Math.max(0, price - inputs.downPayment);
  const surcharge =
    inputs.amortization > 25 ? t("cmhc.surcharge30") : "";

  if (variant === "compact") {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
        <span className="font-semibold text-amber-900 dark:text-amber-200">CMHC:</span>{" "}
        {fmt.formatPercent(cmhcRateApplied, 2)} ({fmt.formatCurrency(cmhcPremium)}) →{" "}
        <strong className="numeric-ltr">{fmt.formatCurrency(totalPrincipal)}</strong>
        {surcharge}
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
      <div className="font-semibold text-amber-900 dark:text-amber-200">{t("cmhc.title")}</div>
      <p className="mt-1">
        {t("cmhc.p1", {
          rate: fmt.formatPercent(cmhcRateApplied, 2),
          premium: fmt.formatCurrency(cmhcPremium),
        })}
      </p>
      <ul className="mt-2 list-inside list-disc space-y-0.5 text-amber-900/90 dark:text-amber-200/90">
        <li>
          {t("cmhc.baseMortgage", {
            base: fmt.formatCurrency(baseMortgage),
            total: fmt.formatCurrency(totalPrincipal),
          })}
        </li>
        {inputs.amortization > 25 && cmhcRateApplied > 0 ? <li>{t("cmhc.surchargeLine")}</li> : null}
        {results.closingCostsBreakdown?.pstOnCmhc > 0 ? (
          <li>{t("cmhc.pstLine", { amount: fmt.formatCurrency(results.closingCostsBreakdown.pstOnCmhc) })}</li>
        ) : null}
      </ul>
    </div>
  );
}
