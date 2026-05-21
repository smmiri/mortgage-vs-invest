import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PROVINCE_CODES } from "../lib/closing-costs.js";
import { describeBreakdownLine, describeDetailRows } from "../lib/translate-breakdown.js";
import { useFieldMeta } from "../hooks/useFieldMeta.js";
import { useFormat } from "../hooks/useFormat.js";
import InfoTip from "./InfoTip.jsx";
import InputField from "./InputField.jsx";
import Switch from "./Switch.jsx";

export default function ClosingCostsSection({
  inputs,
  results,
  onChange,
  layout = "fullWidth",
  id,
}) {
  const { t } = useTranslation();
  const { t: tClosing } = useTranslation("closing");
  const { t: tProvinces } = useTranslation("provinces");
  const fmt = useFormat();
  const FIELD_META = useFieldMeta();

  const isOntario = inputs.province === "ON";
  const isQuebec = inputs.province === "QC";
  const isManual = inputs.closingCostsMode === "manual";
  const total = results?.closingCosts ?? 0;
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const update = (patch) => onChange({ ...inputs, ...patch });

  const breakdown = results?.closingCostsBreakdown?.breakdown || [];
  const hasBreakdown = !isManual && breakdown.length > 0;
  const showMunicipalLtt = isOntario || isQuebec;

  return (
    <section
      id={id}
      className="overflow-hidden rounded-2xl border border-default bg-surface-muted shadow-sm"
    >
      <header className="panel-header flex flex-wrap items-start justify-between gap-3 px-4 py-3 sm:px-5">
        <div>
          <h3 className="text-sm font-semibold text-heading">{t("closing.title")}</h3>
          <p className="mt-0.5 text-xs text-muted">{t("closing.caption")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-end">
            <div className="text-[11px] font-medium uppercase tracking-wide text-caption">{t("closing.total")}</div>
            <div className="text-lg font-semibold tabular-nums text-heading numeric-ltr">{fmt.formatCurrency(total)}</div>
          </div>
          <ModeToggle value={inputs.closingCostsMode} onChange={(v) => update({ closingCostsMode: v })} t={t} />
        </div>
      </header>

      <div className="space-y-4 p-4 sm:p-5">
        {isManual ? (
          <InputField
            name="closingCostsManual"
            value={inputs.closingCostsManual}
            meta={FIELD_META.closingCostsManual}
            onChange={(_, v) => update({ closingCostsManual: v })}
          />
        ) : (
          <>
            <div
              className={
                layout === "fullWidth"
                  ? `grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 ${
                      showMunicipalLtt ? "lg:grid-cols-4" : "lg:grid-cols-3"
                    }`
                  : "grid grid-cols-1 items-stretch gap-3"
              }
            >
              <ProvinceField
                value={inputs.province}
                onChange={(province) => update({ province })}
                t={t}
                tProvinces={tProvinces}
              />

              <ToggleRow
                checked={inputs.firstTimeBuyer}
                onChange={(v) => update({ firstTimeBuyer: v })}
                label={t("closing.ftb")}
                help={t("closing.ftbHelp")}
              />
              <ToggleRow
                checked={inputs.newConstruction}
                onChange={(v) => update({ newConstruction: v })}
                label={t("closing.newBuildLabel")}
                help={t("closing.newBuildHelp")}
              />
              {showMunicipalLtt ? (
                <ToggleRow
                  checked={inputs.includeTorontoLtt}
                  onChange={(v) => update({ includeTorontoLtt: v })}
                  label={isOntario ? t("closing.torontoLabel") : t("closing.montrealLabel")}
                  help={isOntario ? t("closing.torontoHelp") : t("closing.montrealHelp")}
                />
              ) : null}
            </div>

            <InputField
              name="otherClosingCosts"
              value={inputs.otherClosingCosts}
              meta={FIELD_META.otherClosingCosts}
              onChange={(_, v) => update({ otherClosingCosts: v })}
            />

            {hasBreakdown ? (
              <div className="rounded-lg border border-default bg-surface-card">
                <button
                  type="button"
                  onClick={() => setBreakdownOpen((o) => !o)}
                  aria-expanded={breakdownOpen}
                  className="flex w-full items-center justify-between px-4 py-3 text-start text-sm font-medium text-heading hover:bg-surface-inset"
                >
                  <span>{t("closing.lineItemBreakdown")}</span>
                  <span className="text-xs font-medium link-accent">
                    {breakdownOpen ? t("closing.breakdownHide") : t("closing.breakdownShow")}
                  </span>
                </button>
                {breakdownOpen ? (
                  <Breakdown results={results} tClosing={tClosing} tProvinces={tProvinces} fmt={fmt} t={t} />
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function ModeToggle({ value, onChange, t }) {
  return (
    <div role="tablist" className="inline-flex shrink-0 rounded-md border border-default bg-surface-card p-0.5 text-xs">
      {[
        ["auto", t("closing.auto")],
        ["manual", t("closing.manual")],
      ].map(([v, label]) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={value === v}
          onClick={() => onChange(v)}
          className={`rounded px-2 py-1 transition-colors ${
            value === v ? "bg-indigo-600 text-white" : "tab-inactive"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const CLOSING_COST_CONTROL_CLASS =
  "flex h-full min-h-[4.5rem] rounded-md border border-default bg-surface-card px-3 py-2.5";

function ProvinceField({ value, onChange, t, tProvinces }) {
  return (
    <div className={`${CLOSING_COST_CONTROL_CLASS} flex-col justify-center gap-2`}>
      <div className="flex items-center gap-1.5">
        <label htmlFor="province-select" className="text-sm font-medium text-label">
          {t("closing.province")}
        </label>
        <InfoTip text={t("closing.provinceTip")} />
      </div>
      <select
        id="province-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select-field w-full"
      >
        {PROVINCE_CODES.map((code) => (
          <option key={code} value={code}>
            {tProvinces(code)}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleRow({ checked, onChange, label, help }) {
  const id = `toggle-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className={`${CLOSING_COST_CONTROL_CLASS} items-center justify-between gap-3`}>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <label htmlFor={id} className="text-sm leading-snug text-label">
          {label}
        </label>
        {help ? <InfoTip text={help} /> : null}
      </div>
      <Switch id={id} checked={checked} onChange={onChange} aria-label={label} />
    </div>
  );
}

function Breakdown({ results, tClosing, tProvinces, fmt, t }) {
  const breakdown = results?.closingCostsBreakdown?.breakdown || [];
  const total = results?.closingCosts || 0;
  return (
    <div className="border-t border-subtle px-4 pb-4">
      <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
        {breakdown.map((line, i) => {
          const { label, sublabel } = describeBreakdownLine(line, tClosing, tProvinces);
          return (
            <li key={i} className="flex items-start justify-between gap-3 py-1.5">
              <div>
                <div className="text-label">{label}</div>
                {sublabel ? <div className="text-xs text-muted">{sublabel}</div> : null}
                {line.detail ? (
                  <DetailLines detail={line.detail} tClosing={tClosing} formatCurrency={fmt.formatCurrency} />
                ) : null}
              </div>
              <div className="shrink-0 tabular-nums text-heading numeric-ltr">{fmt.formatCurrency(line.amount)}</div>
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex items-center justify-between border-t border-default pt-2 text-sm font-semibold">
        <span className="text-heading">{t("closing.totalClosing")}</span>
        <span className="tabular-nums text-heading numeric-ltr">{fmt.formatCurrency(total)}</span>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted">{t("closing.confirm")}</p>
    </div>
  );
}

function DetailLines({ detail, tClosing, formatCurrency }) {
  const rows = describeDetailRows(detail, tClosing, formatCurrency);
  if (!rows.length) return null;
  return (
    <ul className="mt-1 space-y-0.5 text-[11px] tabular-nums text-muted numeric-ltr">
      {rows.map(({ label, amount }, i) => (
        <li key={i} className="flex justify-between gap-2">
          <span>{label}</span>
          <span>{amount}</span>
        </li>
      ))}
    </ul>
  );
}
