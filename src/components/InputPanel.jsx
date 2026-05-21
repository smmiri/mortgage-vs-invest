import { DEFAULT_INPUTS, FIELD_META } from "../lib/defaults.js";
import { formatCurrency, formatSignedCurrency } from "../lib/format.js";
import InputField from "./InputField.jsx";
import SliderField from "./SliderField.jsx";
import DownPaymentSlider from "./DownPaymentSlider.jsx";
import AmortizationSelector from "./AmortizationSelector.jsx";
import ClosingCostsSection from "./ClosingCostsSection.jsx";
import ExitTaxSection from "./ExitTaxSection.jsx";
import Switch from "./Switch.jsx";

const DEFAULT_DOWN_PCT = DEFAULT_INPUTS.downPayment / DEFAULT_INPUTS.propertyPrice;

function renderField(name, value, meta, onChange) {
  if (meta.kind === "slider") return <SliderField key={name} name={name} value={value} meta={meta} onChange={onChange} />;
  return <InputField key={name} name={name} value={value} meta={meta} onChange={onChange} />;
}

export default function InputPanel({ inputs, results, onChange, onReset }) {
  const handleField = (name, value) => {
    const patch = { [name]: value };
    if (name === "years" && inputs.preExemption === "partial") {
      const yrs = Math.max(1, Math.min(40, Math.round(value || 0)));
      const prYears = inputs.yearsAsPrincipalResidence ?? inputs.years;
      patch.yearsAsPrincipalResidence = Math.min(prYears, yrs);
    }
    onChange({ ...inputs, ...patch });
  };
  const handleToggle = (name, value) => onChange({ ...inputs, [name]: value });

  const handlePropertyPrice = (price) => {
    const nextPrice = Math.max(0, price);
    const pct =
      inputs.propertyPrice > 0 ? inputs.downPayment / inputs.propertyPrice : DEFAULT_DOWN_PCT;
    onChange({
      ...inputs,
      propertyPrice: nextPrice,
      downPayment: Math.round(nextPrice * pct),
    });
  };

  const handleDownPayment = (cash) => onChange({ ...inputs, downPayment: Math.max(0, cash) });

  const { final, initialTopUp, closingCosts } = results;
  const breakevenText =
    final.breakeven == null
      ? `No crossover within ${inputs.years} yrs`
      : `Crossover at year ${final.breakeven}`;

  return (
    <div aria-label="Model inputs">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-heading">Assumptions</h2>
          <p className="mt-0.5 text-sm text-muted">
            Drag sliders or type values. Your assumptions are saved in this browser automatically. Hover{" "}
            <span className="inline-flex h-3.5 w-3.5 translate-y-px items-center justify-center rounded-full border border-default text-[8px] text-muted">
              i
            </span>{" "}
            for help on each field.
          </p>
        </div>
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="btn-ghost"
          >
            Reset to defaults
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InputColumn title="Property">
          <InputField
            name="propertyPrice"
            value={inputs.propertyPrice}
            meta={FIELD_META.propertyPrice}
            onChange={(_, v) => handlePropertyPrice(v)}
          />
          <DownPaymentSlider
            propertyPrice={inputs.propertyPrice}
            downPayment={inputs.downPayment}
            meta={FIELD_META.downPayment}
            onChange={handleDownPayment}
          />
          <ColumnHint
            label="Est. closing costs"
            value={formatCurrency(closingCosts)}
            detail={
              <a href="#cash-to-close" className="link-accent">
                Edit in cash to close ↓
              </a>
            }
          />
        </InputColumn>

        <InputColumn title="Mortgage & ownership">
          <AmortizationSelector
            value={inputs.amortization}
            onChange={(years) => handleField("amortization", years)}
            meta={FIELD_META.amortization}
            compact
          />
          {renderField("mortgageRate", inputs.mortgageRate, FIELD_META.mortgageRate, handleField)}
          {renderField("fixedExpenses", inputs.fixedExpenses, FIELD_META.fixedExpenses, handleField)}
          {renderField("expenseInflation", inputs.expenseInflation, FIELD_META.expenseInflation, handleField)}
          {renderField("propertyGrowth", inputs.propertyGrowth, FIELD_META.propertyGrowth, handleField)}
        </InputColumn>

        <InputColumn title="Rent & investing">
          {renderField("initialRent", inputs.initialRent, FIELD_META.initialRent, handleField)}
          {renderField("rentIncrease", inputs.rentIncrease, FIELD_META.rentIncrease, handleField)}
          {renderField("marketReturn", inputs.marketReturn, FIELD_META.marketReturn, handleField)}
          <ColumnHint
            label="Year 1 renter top-up"
            value={formatSignedCurrency(initialTopUp)}
            detail={initialTopUp >= 0 ? "Owning costs more than rent" : "Renting costs more than owning"}
          />
        </InputColumn>

        <InputColumn title="Horizon & exit">
          {renderField("years", inputs.years, FIELD_META.years, handleField)}
          <div className="space-y-3 rounded-lg border border-subtle bg-surface-muted p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium text-heading">Sale costs at exit</h4>
                <p className="mt-0.5 text-[11px] leading-snug text-muted">
                  On if you sell at the horizon; off to keep paper equity.
                </p>
              </div>
              <Switch
                checked={inputs.applySaleCost}
                onChange={(v) => handleToggle("applySaleCost", v)}
                aria-label="Apply sale costs"
              />
            </div>
            {inputs.applySaleCost ? (
              <SliderField
                name="saleCostPct"
                value={inputs.saleCostPct}
                meta={FIELD_META.saleCostPct}
                onChange={handleField}
              />
            ) : null}
          </div>
          <ColumnHint
            label="Crossover"
            value={breakevenText}
            detail={
              inputs.modelExitTaxes !== false
                ? "After-tax lines (annual portfolio tax)"
                : "When buy vs rent wealth lines meet"
            }
          />
        </InputColumn>
      </div>

      <div className="mt-4 space-y-4">
        <ClosingCostsSection
          id="cash-to-close"
          inputs={inputs}
          results={results}
          onChange={onChange}
          layout="fullWidth"
        />
        <ExitTaxSection
          inputs={inputs}
          results={results}
          onChange={onChange}
          onField={handleField}
          layout="fullWidth"
        />
      </div>
    </div>
  );
}

function InputColumn({ title, children }) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-default bg-surface-card shadow-sm">
      <header className="panel-header px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
    </section>
  );
}

function ColumnHint({ label, value, detail }) {
  return (
    <div className="mt-auto rounded-lg border border-dashed border-default bg-surface-muted px-3 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-caption">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-heading">{value}</div>
      {detail ? <div className="mt-1 text-[11px] text-muted">{detail}</div> : null}
    </div>
  );
}
