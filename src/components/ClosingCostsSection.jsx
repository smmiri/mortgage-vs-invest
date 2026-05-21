import { useState } from "react";
import { PROVINCES, PROVINCE_CODES } from "../lib/closing-costs.js";
import { formatCurrency } from "../lib/format.js";
import InfoTip from "./InfoTip.jsx";
import InputField from "./InputField.jsx";
import Switch from "./Switch.jsx";
import { FIELD_META } from "../lib/defaults.js";

export default function ClosingCostsSection({
  inputs,
  results,
  onChange,
  layout = "fullWidth",
  id,
}) {
  const isOntario = inputs.province === "ON";
  const isQuebec = inputs.province === "QC";
  const isManual = inputs.closingCostsMode === "manual";
  const total = results?.closingCosts ?? 0;
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const update = (patch) => onChange({ ...inputs, ...patch });

  const breakdown = results?.closingCostsBreakdown?.breakdown || [];
  const hasBreakdown = !isManual && breakdown.length > 0;

  return (
    <section
      id={id}
      className="rounded-2xl border border-slate-200 bg-slate-50/80 shadow-sm"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 bg-white px-4 py-3 sm:px-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Cash to close</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Province, buyer status, and new-build flags drive LTT, GST/HST, and PST on CMHC.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Total</div>
            <div className="text-lg font-semibold tabular-nums text-slate-900">{formatCurrency(total)}</div>
          </div>
          <ModeToggle value={inputs.closingCostsMode} onChange={(v) => update({ closingCostsMode: v })} />
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
                  ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
                  : "grid grid-cols-1 gap-3"
              }
            >
              <div>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <label htmlFor="province-select" className="text-sm font-medium text-slate-700">
                    Province
                  </label>
                  <InfoTip text="Drives land transfer tax brackets, GST/HST or QST handling, and provincial new-housing rebates." />
                </div>
                <select
                  id="province-select"
                  value={inputs.province}
                  onChange={(e) => update({ province: e.target.value })}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  {PROVINCE_CODES.map((code) => (
                    <option key={code} value={code}>
                      {PROVINCES[code].name}
                    </option>
                  ))}
                </select>
              </div>

              <ToggleRow
                checked={inputs.firstTimeBuyer}
                onChange={(v) => update({ firstTimeBuyer: v })}
                label="First-time home buyer"
                help="Unlocks: BC PTT exemption (full ≤ $835k, partial to $860k), Ontario LTT $4,000 rebate, Toronto MLTT $4,475 rebate, PEI exemption ≤ $200k, and the 2025 federal First-Time Home Buyer GST Rebate on new homes (full ≤ $1M, phased to $1.5M)."
              />
              <ToggleRow
                checked={inputs.newConstruction}
                onChange={(v) => update({ newConstruction: v })}
                label="Newly built / new construction"
                help="Resale homes are GST/HST exempt. New construction is taxable: federal GST 5% (with rebates) plus any provincial portion in HST provinces. In BC, also unlocks the Newly Built Home Exemption from PTT (full ≤ $1.1M, partial to $1.15M)."
              />
              {isOntario || isQuebec ? (
                <ToggleRow
                  checked={inputs.includeTorontoLtt}
                  onChange={(v) => update({ includeTorontoLtt: v })}
                  label={
                    isOntario
                      ? "Property is inside the City of Toronto"
                      : "Property is inside the City of Montréal"
                  }
                  help={
                    isOntario
                      ? "Toronto's Municipal Land Transfer Tax applies to properties within the City of Toronto's boundaries. Surrounding GTA cities do NOT pay MLTT."
                      : "Montréal's welcome tax adds higher brackets above $500k vs the provincial Quebec baseline."
                  }
                />
              ) : (
                <div className="hidden lg:block" aria-hidden />
              )}
            </div>

            <InputField
              name="otherClosingCosts"
              value={inputs.otherClosingCosts}
              meta={FIELD_META.otherClosingCosts}
              onChange={(_, v) => update({ otherClosingCosts: v })}
            />

            {hasBreakdown ? (
              <div className="rounded-lg border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setBreakdownOpen((o) => !o)}
                  aria-expanded={breakdownOpen}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  <span>Line-item breakdown</span>
                  <span className="text-xs font-medium text-indigo-600">{breakdownOpen ? "Hide" : "Show"}</span>
                </button>
                {breakdownOpen ? <Breakdown results={results} /> : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function ModeToggle({ value, onChange }) {
  return (
    <div role="tablist" className="inline-flex shrink-0 rounded-md border border-slate-200 bg-white p-0.5 text-xs">
      {[
        ["auto", "Auto"],
        ["manual", "Manual"],
      ].map(([v, label]) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={value === v}
          onClick={() => onChange(v)}
          className={`rounded px-2 py-1 transition-colors ${
            value === v ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({ checked, onChange, label, help }) {
  const id = `toggle-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5">
      <div className="flex min-w-0 flex-1 items-start gap-1.5">
        <label htmlFor={id} className="text-sm leading-snug text-slate-700">
          {label}
        </label>
        {help ? <InfoTip text={help} /> : null}
      </div>
      <Switch id={id} checked={checked} onChange={onChange} aria-label={label} />
    </div>
  );
}

function Breakdown({ results }) {
  const breakdown = results?.closingCostsBreakdown?.breakdown || [];
  const total = results?.closingCosts || 0;
  return (
    <div className="border-t border-slate-100 px-4 pb-4">
      <ul className="divide-y divide-slate-100 text-sm">
        {breakdown.map((line, i) => (
          <li key={i} className="flex items-start justify-between gap-3 py-1.5">
            <div>
              <div className="text-slate-700">{line.label}</div>
              {line.sublabel ? <div className="text-xs text-slate-500">{line.sublabel}</div> : null}
              {line.detail ? <DetailLines detail={line.detail} /> : null}
            </div>
            <div className="shrink-0 tabular-nums text-slate-900">{formatCurrency(line.amount)}</div>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-semibold">
        <span className="text-slate-900">Total closing costs</span>
        <span className="tabular-nums text-slate-900">{formatCurrency(total)}</span>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        Model estimate. Confirm eligibility and amounts with a lawyer before signing.
      </p>
    </div>
  );
}

function DetailLines({ detail }) {
  const rows = [];
  if (detail.federalGross != null && detail.federalGross > 0) {
    rows.push(["Federal GST (5%)", detail.federalGross]);
    if (detail.federalRebate > 0) rows.push(["  − Federal rebate", -detail.federalRebate]);
  }
  if (detail.provincialGross != null && detail.provincialGross > 0) {
    rows.push(["Provincial HST", detail.provincialGross]);
    if (detail.provincialRebate > 0) rows.push(["  − Provincial rebate", -detail.provincialRebate]);
  }
  if (detail.qstGross != null && detail.qstGross > 0) {
    rows.push(["Quebec QST (9.975%)", detail.qstGross]);
    if (detail.qstRebate > 0) rows.push(["  − QST rebate", -detail.qstRebate]);
  }
  if (detail.municipalGross != null && detail.municipalGross > 0) {
    rows.push(["Municipal LTT", detail.municipalGross]);
    if (detail.municipalRebate > 0) rows.push(["  − FTB rebate (municipal)", -detail.municipalRebate]);
  }
  if (!rows.length) return null;
  return (
    <ul className="mt-1 space-y-0.5 text-[11px] tabular-nums text-slate-500">
      {rows.map(([label, amount], i) => (
        <li key={i} className="flex justify-between gap-2">
          <span>{label}</span>
          <span>
            {amount < 0 ? "−" : ""}
            {formatCurrency(Math.abs(amount))}
          </span>
        </li>
      ))}
    </ul>
  );
}
