import { formatCompactCurrency, formatCurrency, formatPercent, formatSignedCurrency } from "../lib/format.js";
import StatCard from "./StatCard.jsx";

export default function Summary({ results }) {
  const { cmhcPremium, cmhcRateApplied, monthlyPayment, initialTopUp, cashAtClose, final, inputs } = results;
  const horizon = inputs.years;
  const delta = final.delta;
  const winnerLabel = delta === 0 ? "Tie" : delta > 0 ? "Buying wins" : "Renting wins";
  const breakevenText =
    final.breakeven == null
      ? `No crossover within ${horizon} years`
      : `Lines cross at year ${final.breakeven}`;

  return (
    <section aria-label="Headline results" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        tone={delta >= 0 ? "positive" : "negative"}
        label={`Delta at year ${horizon}`}
        value={formatSignedCurrency(delta)}
        sublabel={`${winnerLabel} · ${breakevenText}`}
        help="Buyer net wealth minus renter net wealth at the end of the time horizon. Positive means buying wins."
      />
      <StatCard
        tone="primary"
        label="Cash at closing"
        value={formatCurrency(cashAtClose)}
        sublabel={`Down payment + ${formatCurrency(results.closingCosts)} closing costs`}
        help="Total cash the buyer hands over at closing — down payment plus the province-aware closing-cost breakdown (LTT, GST/HST net of rebates, PST on CMHC, legal/title/inspection). The renter is assumed to invest the same total amount in the market portfolio at year 0."
      />
      <StatCard
        tone="primary"
        label="Monthly P&I"
        value={formatCurrency(monthlyPayment)}
        sublabel="Mortgage payment (principal + interest)"
        help="Computed with Canadian semi-annual compounding: effective monthly rate = (1 + r/2)^(1/6) − 1."
      />
      <StatCard
        tone="primary"
        label="Initial monthly top-up"
        value={formatSignedCurrency(initialTopUp)}
        sublabel={initialTopUp >= 0 ? "Owning costs more than renting" : "Renting costs more than owning"}
        help="The renter's monthly investment comes from this gap. We assume both paths spend max(owning_cost, rent) on housing each month; the cheaper side invests the difference at the market return. Floored at zero — never negative."
      />
      <StatCard
        tone={cmhcRateApplied > 0 ? "primary" : "neutral"}
        label="CMHC insurance"
        value={cmhcRateApplied > 0 ? formatCurrency(cmhcPremium) : "Not required"}
        sublabel={
          cmhcRateApplied > 0
            ? `${formatPercent(cmhcRateApplied, 2)} of financed amount · rolled into principal`
            : "≥ 20% down — no default insurance"
        }
        help="Mandatory CMHC (or equivalent) default insurance when down payment is below 20%. The premium is added to the mortgage balance, not paid as cash at closing (PST on the premium may appear in closing costs in ON/QC/SK/MB)."
      />
    </section>
  );
}

export function PathTotals({ results }) {
  const { final, inputs } = results;
  const horizon = inputs.years;
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs text-slate-500">
      <Totals label="Total rent paid" value={formatCompactCurrency(final.totalRentPaid)} sub={`over ${horizon} yrs`} />
      <Totals label="Total ownership cost" value={formatCompactCurrency(final.totalOwningCost)} sub={`over ${horizon} yrs`} />
      <Totals label="Interest paid" value={formatCompactCurrency(final.totalInterestPaid)} sub="on the mortgage" />
      <Totals label="Principal paid down" value={formatCompactCurrency(final.totalPrincipalPaid)} sub="reduces balance" />
    </section>
  );
}

function Totals({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-slate-700">{value}</div>
      <div className="text-[11px] text-slate-400">{sub}</div>
    </div>
  );
}
