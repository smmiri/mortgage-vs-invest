import { FIELD_META } from "../lib/defaults.js";
import { PRE_EXEMPTION_MODES } from "../lib/exit-taxes.js";
import { formatCurrency } from "../lib/format.js";
import InfoTip from "./InfoTip.jsx";
import SliderField from "./SliderField.jsx";
import Switch from "./Switch.jsx";
import InputField from "./InputField.jsx";

const PRE_LABELS = {
  full: "Principal residence",
  partial: "Partial years",
  none: "Not exempt",
};

export default function ExitTaxSection({ inputs, results, onChange, onField, layout = "fullWidth" }) {
  const { exitTaxes, final } = results;
  const on = inputs.modelExitTaxes !== false;
  const isWide = layout === "fullWidth";

  const shell = isWide
    ? "overflow-hidden rounded-2xl border border-default bg-surface-muted shadow-sm"
    : "space-y-3 overflow-hidden rounded-lg border border-subtle bg-surface-muted p-3";

  return (
    <section id="exit-taxes" className={shell}>
      <header
        className={`flex flex-wrap items-start justify-between gap-3 ${
          isWide ? "panel-header px-4 py-3 sm:px-5" : "border-0 bg-transparent p-0 pb-0"
        }`}
      >
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-heading">Exit taxes (simplified)</h3>
            <InfoTip text="Canadian capital gains: portfolio gains taxed each year (non-registered; no TFSA/FHSA room). Home sale taxed at the horizon only when selling; full principal residence exemption by default." />
          </div>
          <p className="mt-0.5 text-xs text-muted">
            Annual tax on portfolio growth; home tax at exit when selling.
          </p>
        </div>
        <Switch
          checked={on}
          onChange={(v) => onChange({ ...inputs, modelExitTaxes: v })}
          aria-label="Estimate exit taxes"
        />
      </header>

      {on ? (
        <div className={isWide ? "space-y-4 p-4 sm:p-5" : "mt-3 space-y-3"}>
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <strong className="font-semibold">Taxable portfolio assumption.</strong> Portfolio gains are taxed each
            year as if held in a non-registered account. TFSA, FHSA, and RRSP sheltering are not modeled. Turn exit
            taxes off, or lower the marginal rate, to approximate tax-sheltered investing.
          </p>
          <div className={isWide ? "grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start" : "space-y-3"}>
            <div className={isWide ? "lg:col-span-4" : ""}>
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="text-xs font-medium text-body">Principal residence</span>
                <InfoTip text="Full PRE: no tax on home sale gain. Partial: exempt fraction ≈ years as PR ÷ years owned. Not exempt: investment/rental property." />
              </div>
              <div
                role="radiogroup"
                aria-label="Principal residence exemption"
                className={`flex gap-1.5 ${isWide ? "flex-wrap" : "grid grid-cols-1 gap-1.5"}`}
              >
                {PRE_EXEMPTION_MODES.map((mode) => {
                  const active = (inputs.preExemption || "full") === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => onChange({ ...inputs, preExemption: mode })}
                      className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                        active
                          ? "border-indigo-300 bg-indigo-50 font-medium text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"
                          : "chip-inactive"
                      }`}
                    >
                      {PRE_LABELS[mode]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={
                isWide
                  ? `grid grid-cols-1 gap-3 sm:grid-cols-2 ${inputs.preExemption === "partial" ? "lg:col-span-6" : "lg:col-span-8"}`
                  : "space-y-3"
              }
            >
              {inputs.preExemption === "partial" ? (
                <InputField
                  name="yearsAsPrincipalResidence"
                  value={inputs.yearsAsPrincipalResidence ?? inputs.years}
                  meta={{ ...FIELD_META.yearsAsPrincipalResidence, max: inputs.years }}
                  onChange={onField}
                />
              ) : null}
              <SliderField
                name="marginalTaxRate"
                value={inputs.marginalTaxRate}
                meta={FIELD_META.marginalTaxRate}
                onChange={onField}
              />
              <SliderField
                name="capitalGainsInclusionRate"
                value={inputs.capitalGainsInclusionRate}
                meta={FIELD_META.capitalGainsInclusionRate}
                onChange={onField}
              />
            </div>
          </div>

          <p className="rounded-lg border border-default bg-surface-card px-3 py-2 text-[11px] leading-relaxed text-body">
            Portfolio tax <strong>{formatCurrency(exitTaxes.rentTax)}</strong> (renter, annual) · Home{" "}
            {inputs.applySaleCost
              ? exitTaxes.buyTax > 0
                ? `tax ${formatCurrency(exitTaxes.buyTax)}`
                : "PRE: $0"
              : "N/A (not selling)"}{" "}
            · After-tax delta <strong>{formatCurrency(final.deltaAfterTax)}</strong>
            {final.breakevenPreTax != null && final.breakevenPreTax !== final.breakeven ? (
              <> · Crossover moves from Y{final.breakevenPreTax} (pre-tax) to Y{final.breakeven ?? "none"} (after-tax)</>
            ) : null}
          </p>
        </div>
      ) : null}
    </section>
  );
}
