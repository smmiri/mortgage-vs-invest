import { DEFAULT_INPUTS, FIELD_META } from "../lib/defaults.js";
import InputField from "./InputField.jsx";
import SliderField from "./SliderField.jsx";
import DownPaymentSlider from "./DownPaymentSlider.jsx";
import AmortizationSelector, { CmhcInsuranceCallout } from "./AmortizationSelector.jsx";
import ClosingCostsSection from "./ClosingCostsSection.jsx";
import Switch from "./Switch.jsx";

const DEFAULT_DOWN_PCT = DEFAULT_INPUTS.downPayment / DEFAULT_INPUTS.propertyPrice;

const GROUPS = [
  { key: "rent", title: "Rent & investing", fields: ["initialRent", "rentIncrease", "marketReturn"] },
  { key: "horizon", title: "Horizon & exit", fields: ["years"] },
];

function renderField(name, value, meta, onChange) {
  if (meta.kind === "slider") return <SliderField key={name} name={name} value={value} meta={meta} onChange={onChange} />;
  return <InputField key={name} name={name} value={value} meta={meta} onChange={onChange} />;
}

export default function InputPanel({ inputs, results, onChange }) {
  const handleField = (name, value) => onChange({ ...inputs, [name]: value });
  const handleToggle = (name, value) => onChange({ ...inputs, [name]: value });

  const handlePropertyPrice = (price) => {
    const nextPrice = Math.max(0, price);
    const pct =
      inputs.propertyPrice > 0
        ? inputs.downPayment / inputs.propertyPrice
        : DEFAULT_DOWN_PCT;
    onChange({
      ...inputs,
      propertyPrice: nextPrice,
      downPayment: Math.round(nextPrice * pct),
    });
  };

  const handleDownPayment = (cash) => onChange({ ...inputs, downPayment: Math.max(0, cash) });

  return (
    <aside
      aria-label="Model inputs"
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <header>
        <h2 className="text-base font-semibold text-slate-900">Inputs</h2>
        <p className="mt-1 text-xs text-slate-500">
          Numbers update the projection live. Drag sliders for what-ifs or type a precise value next to each. Hover
          the
          <span className="mx-1 inline-flex h-3 w-3 translate-y-0.5 items-center justify-center rounded-full border border-slate-300 text-[8px] text-slate-500">
            i
          </span>
          for context on each input.
        </p>
      </header>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Property</h3>
        <div className="space-y-4">
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
        </div>
      </section>

      <ClosingCostsSection inputs={inputs} results={results} onChange={onChange} />

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mortgage &amp; ownership</h3>
        <div className="space-y-4">
          <AmortizationSelector
            value={inputs.amortization}
            onChange={(years) => handleField("amortization", years)}
            meta={FIELD_META.amortization}
          />
          <CmhcInsuranceCallout results={results} inputs={inputs} />
          {renderField("mortgageRate", inputs.mortgageRate, FIELD_META.mortgageRate, handleField)}
          {renderField("fixedExpenses", inputs.fixedExpenses, FIELD_META.fixedExpenses, handleField)}
          {renderField("expenseInflation", inputs.expenseInflation, FIELD_META.expenseInflation, handleField)}
          {renderField("propertyGrowth", inputs.propertyGrowth, FIELD_META.propertyGrowth, handleField)}
        </div>
      </section>

      {GROUPS.map((group) => (
        <section key={group.key} className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group.title}</h3>
          <div className="space-y-4">
            {group.fields.map((name) => renderField(name, inputs[name], FIELD_META[name], handleField))}
          </div>
        </section>
      ))}

      <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-900">Apply sale costs at the end</h3>
            <p className="mt-1 text-xs text-slate-500">
              On if you plan to sell at the end of the horizon. Off if you intend to keep the property.
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
        ) : (
          <p className="text-xs text-slate-500">
            Wealth on the buy line is treated as paper equity (property value minus mortgage balance) — no realtor or
            closing penalty is deducted.
          </p>
        )}
      </section>
    </aside>
  );
}
