import { useTranslation } from "react-i18next";
import { useFormat } from "../hooks/useFormat.js";
import StatCard from "./StatCard.jsx";

export default function Summary({ results }) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const { cmhcPremium, cmhcRateApplied, monthlyPayment, initialTopUp, cashAtClose, final, inputs, exitTaxes } =
    results;
  const horizon = inputs.years;
  const useExitTax = inputs.modelExitTaxes !== false;
  const delta = useExitTax ? final.deltaAfterTax : final.delta;
  const preTaxDelta = final.delta;
  const outcomeLabel =
    delta === 0
      ? t("summary.outcomeEven")
      : delta > 0
        ? t("summary.outcomeBuy")
        : t("summary.outcomeRent");
  const breakevenText =
    final.breakeven == null
      ? t("summary.noCrossover", { years: horizon })
      : t("summary.crossoverAt", { year: final.breakeven });

  const taxSublabel = useExitTax
    ? `${outcomeLabel} · ${t("summary.preTax", { delta: fmt.formatSignedCurrency(preTaxDelta) })} · ${t("summary.homeTax", { tax: fmt.formatCurrency(exitTaxes.buyTax) })} · ${t("summary.portfolioTax", { tax: fmt.formatCurrency(exitTaxes.rentTax) })}`
    : `${outcomeLabel} · ${breakevenText}`;

  return (
    <section aria-label="Headline results" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        tone={delta >= 0 ? "positive" : "negative"}
        label={useExitTax ? t("summary.afterTaxDelta", { year: horizon }) : t("summary.delta", { year: horizon })}
        value={fmt.formatSignedCurrency(delta)}
        sublabel={useExitTax ? taxSublabel : `${outcomeLabel} · ${breakevenText}`}
        help={useExitTax ? t("summary.afterTaxHelp") : t("summary.deltaHelp")}
      />
      <StatCard
        tone="primary"
        label={t("summary.cashAtClose")}
        value={fmt.formatCurrency(cashAtClose)}
        sublabel={t("summary.cashSublabel", { closing: fmt.formatCurrency(results.closingCosts) })}
        help={t("summary.cashHelp")}
      />
      <StatCard
        tone="primary"
        label={t("summary.monthlyPI")}
        value={fmt.formatCurrency(monthlyPayment)}
        sublabel={t("summary.monthlyPISub")}
        help={t("summary.monthlyPIHelp")}
      />
      <StatCard
        tone="primary"
        label={t("summary.topUp")}
        value={fmt.formatSignedCurrency(initialTopUp)}
        sublabel={initialTopUp >= 0 ? t("hints.owningMore") : t("hints.rentingMore")}
        help={t("summary.topUpHelp")}
      />
      <StatCard
        tone={cmhcRateApplied > 0 ? "primary" : "neutral"}
        label={t("summary.cmhc")}
        value={cmhcRateApplied > 0 ? fmt.formatCurrency(cmhcPremium) : t("summary.cmhcNotRequired")}
        sublabel={
          cmhcRateApplied > 0
            ? t("summary.cmhcSubRate", { rate: fmt.formatPercent(cmhcRateApplied, 2) })
            : t("summary.cmhcNotRequired")
        }
        help={t("summary.cmhcHelp")}
      />
    </section>
  );
}

export function PathTotals({ results }) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const { final, inputs } = results;
  const horizon = inputs.years;
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs text-muted">
      <Totals label={t("pathTotals.rentPaid")} value={fmt.formatCompactCurrency(final.totalRentPaid)} sub={t("pathTotals.overYears", { years: horizon })} />
      <Totals label={t("pathTotals.owningCost")} value={fmt.formatCompactCurrency(final.totalOwningCost)} sub={t("pathTotals.overYears", { years: horizon })} />
      <Totals label={t("pathTotals.interest")} value={fmt.formatCompactCurrency(final.totalInterestPaid)} sub={t("pathTotals.onMortgage")} />
      <Totals label={t("pathTotals.principal")} value={fmt.formatCompactCurrency(final.totalPrincipalPaid)} sub={t("pathTotals.reducesBalance")} />
    </section>
  );
}

function Totals({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-default bg-surface-card px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-caption">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-heading numeric-ltr">{value}</div>
      <div className="text-[11px] text-caption">{sub}</div>
    </div>
  );
}
