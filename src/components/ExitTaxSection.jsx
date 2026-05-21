import { Trans, useTranslation } from "react-i18next";
import { PRE_EXEMPTION_MODES } from "../lib/exit-taxes.js";
import { useFieldMeta } from "../hooks/useFieldMeta.js";
import { useFormat } from "../hooks/useFormat.js";
import InfoTip from "./InfoTip.jsx";
import SliderField from "./SliderField.jsx";
import Switch from "./Switch.jsx";
import InputField from "./InputField.jsx";

export default function ExitTaxSection({ inputs, results, onChange, onField, layout = "fullWidth" }) {
  const { t } = useTranslation();
  const FIELD_META = useFieldMeta();
  const fmt = useFormat();
  const { exitTaxes, final } = results;
  const on = inputs.modelExitTaxes !== false;
  const isWide = layout === "fullWidth";

  const shell = isWide
    ? "overflow-hidden rounded-2xl border border-default bg-surface-muted shadow-sm"
    : "space-y-3 overflow-hidden rounded-lg border border-subtle bg-surface-muted p-3";

  const homeSummary = inputs.applySaleCost
    ? exitTaxes.buyTax > 0
      ? t("exitTax.homeTax", { tax: fmt.formatCurrency(exitTaxes.buyTax) })
      : t("exitTax.homePreZero")
    : t("exitTax.homeNA");

  return (
    <section id="exit-taxes" className={shell}>
      <header
        className={`flex flex-wrap items-start justify-between gap-3 ${
          isWide ? "panel-header px-4 py-3 sm:px-5" : "border-0 bg-transparent p-0 pb-0"
        }`}
      >
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-heading">{t("exitTax.title")}</h3>
            <InfoTip text={t("exitTax.tip")} />
          </div>
          <p className="mt-0.5 text-xs text-muted">{t("exitTax.caption")}</p>
        </div>
        <Switch checked={on} onChange={(v) => onChange({ ...inputs, modelExitTaxes: v })} aria-label={t("exitTax.aria")} />
      </header>

      {on ? (
        <div className={isWide ? "space-y-4 p-4 sm:p-5" : "mt-3 space-y-3"}>
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <Trans i18nKey="exitTax.taxableBanner" components={{ strong: <strong className="font-semibold" /> }} />
          </p>
          <div className={isWide ? "grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start" : "space-y-3"}>
            <div className={isWide ? "lg:col-span-4" : ""}>
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="text-xs font-medium text-body">{t("exitTax.pre.full")}</span>
                <InfoTip text={t("exitTax.tip")} />
              </div>
              <div
                role="radiogroup"
                aria-label={t("exitTax.pre.full")}
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
                      {t(`exitTax.pre.${mode}`)}
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
            <Trans
              i18nKey="exitTax.summary"
              values={{
                rentTax: fmt.formatCurrency(exitTaxes.rentTax),
                home: homeSummary,
                delta: fmt.formatCurrency(final.deltaAfterTax),
              }}
              components={{ strong: <strong /> }}
            />
            {final.breakevenPreTax != null && final.breakevenPreTax !== final.breakeven ? (
              <span>
                {t("exitTax.crossoverMove", { pre: final.breakevenPreTax, post: final.breakeven ?? "—" })}
              </span>
            ) : null}
          </p>
        </div>
      ) : null}
    </section>
  );
}
