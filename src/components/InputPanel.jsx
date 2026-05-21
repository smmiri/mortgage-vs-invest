import { useTranslation } from "react-i18next";
import { DEFAULT_INPUTS } from "../lib/defaults.js";
import { useFieldMeta } from "../hooks/useFieldMeta.js";
import { useFormat } from "../hooks/useFormat.js";
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
  const { t } = useTranslation();
  const fmt = useFormat();
  const FIELD_META = useFieldMeta();

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
      ? t("summary.noCrossover", { years: inputs.years })
      : t("summary.crossoverAt", { year: final.breakeven });

  return (
    <div aria-label="Model inputs">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-heading">{t("calculator.assumptions")}</h2>
          <p className="mt-0.5 text-sm text-muted">
            {t("calculator.assumptionsHint")}{" "}
            <span className="inline-flex h-3.5 w-3.5 translate-y-px items-center justify-center rounded-full border border-default text-[8px] text-muted">
              {t("calculator.helpIcon")}
            </span>{" "}
            {t("calculator.helpSuffix")}
          </p>
        </div>
        {onReset ? (
          <button type="button" onClick={onReset} className="btn-ghost">
            {t("calculator.reset")}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InputColumn title={t("columns.property")}>
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
            label={t("hints.estClosing")}
            value={fmt.formatCurrency(closingCosts)}
            detail={
              <a href="#cash-to-close" className="link-accent">
                {t("hints.editClosing")}
              </a>
            }
          />
        </InputColumn>

        <InputColumn title={t("columns.mortgage")}>
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

        <InputColumn title={t("columns.rent")}>
          {renderField("initialRent", inputs.initialRent, FIELD_META.initialRent, handleField)}
          {renderField("rentIncrease", inputs.rentIncrease, FIELD_META.rentIncrease, handleField)}
          {renderField("marketReturn", inputs.marketReturn, FIELD_META.marketReturn, handleField)}
          <ColumnHint
            label={t("hints.year1TopUp")}
            value={fmt.formatSignedCurrency(initialTopUp)}
            detail={initialTopUp >= 0 ? t("hints.owningMore") : t("hints.rentingMore")}
          />
        </InputColumn>

        <InputColumn title={t("columns.horizon")}>
          {renderField("years", inputs.years, FIELD_META.years, handleField)}
          <div className="space-y-3 rounded-lg border border-subtle bg-surface-muted p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium text-heading">{t("saleAtExit.title")}</h4>
                <p className="mt-0.5 text-[11px] leading-snug text-muted">{t("saleAtExit.hint")}</p>
              </div>
              <Switch
                checked={inputs.applySaleCost}
                onChange={(v) => handleToggle("applySaleCost", v)}
                aria-label={t("saleAtExit.aria")}
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
            label={t("hints.crossover")}
            value={breakevenText}
            detail={
              inputs.modelExitTaxes !== false
                ? t("hints.crossoverAfterTax")
                : t("hints.crossoverPreTax")
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
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-default bg-surface-card shadow-sm">
      <header className="panel-header shrink-0 px-4 py-3">
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
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-heading numeric-ltr">{value}</div>
      {detail ? <div className="mt-1 text-[11px] text-muted">{detail}</div> : null}
    </div>
  );
}
