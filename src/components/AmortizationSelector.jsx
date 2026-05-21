import InfoTip from "./InfoTip.jsx";
import { formatCurrency, formatPercent } from "../lib/format.js";

const OPTIONS = [
  { years: 25, label: "25 years", hint: "Standard cap for insured mortgages (down < 20%)" },
  { years: 30, label: "30 years", hint: "Extended amortization (+0.20% CMHC premium when insured)" },
];

export default function AmortizationSelector({ value, onChange, meta, compact = false }) {
  const selected = value === 30 ? 30 : 25;

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
        {OPTIONS.map(({ years, label, hint }) => {
          const active = selected === years;
          return (
            <button
              key={years}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(years)}
              className={`rounded-md px-3 py-2 text-left transition-colors ${
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
  const price = inputs.propertyPrice || 0;
  if (price <= 0 || price > 1_500_000) return null;

  const downPct = inputs.downPayment / price;
  if (downPct >= 0.2) return null;

  const { cmhcPremium, cmhcRateApplied, totalPrincipal } = results;
  const baseMortgage = Math.max(0, price - inputs.downPayment);

  if (variant === "compact") {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
        <span className="font-semibold text-amber-900 dark:text-amber-200">CMHC required:</span>{" "}
        {formatPercent(cmhcRateApplied, 2)} premium ({formatCurrency(cmhcPremium)}) rolled into principal →{" "}
        <strong>{formatCurrency(totalPrincipal)}</strong> financed
        {inputs.amortization > 25 ? " (+0.20% rate for 30-yr amort)" : ""}.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
      <div className="font-semibold text-amber-900 dark:text-amber-200">CMHC mortgage default insurance (required)</div>
      <p className="mt-1">
        With less than 20% down, lenders require CMHC (or equivalent) insurance. The premium is{" "}
        <strong>{formatPercent(cmhcRateApplied, 2)}</strong> of the financed amount (
        <strong>{formatCurrency(cmhcPremium)}</strong>) and is <strong>added to your mortgage principal</strong>, not
        paid in cash at closing.
      </p>
      <ul className="mt-2 list-inside list-disc space-y-0.5 text-amber-900/90 dark:text-amber-200/90">
        <li>
          Base mortgage: {formatCurrency(baseMortgage)} → principal with CMHC:{" "}
          <strong>{formatCurrency(totalPrincipal)}</strong>
        </li>
        {inputs.amortization > 25 && cmhcRateApplied > 0 ? (
          <li>30-year amortization adds a 0.20% surcharge on the CMHC premium rate.</li>
        ) : null}
        {results.closingCostsBreakdown?.pstOnCmhc > 0 ? (
          <li>
            PST on the CMHC premium ({formatCurrency(results.closingCostsBreakdown.pstOnCmhc)}) is in cash to close.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
