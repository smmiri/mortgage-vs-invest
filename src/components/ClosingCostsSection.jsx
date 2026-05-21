import { PROVINCES, PROVINCE_CODES } from "../lib/closing-costs.js";
import { formatCurrency } from "../lib/format.js";
import InfoTip from "./InfoTip.jsx";
import InputField from "./InputField.jsx";
import Switch from "./Switch.jsx";
import { FIELD_META } from "../lib/defaults.js";

export default function ClosingCostsSection({ inputs, results, onChange }) {
  const isOntario = inputs.province === "ON";
  const isQuebec = inputs.province === "QC";
  const isManual = inputs.closingCostsMode === "manual";
  const isHstProvince = PROVINCES[inputs.province]?.hasHST;

  const update = (patch) => onChange({ ...inputs, ...patch });

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Cash to close</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Land transfer tax, GST/HST on new construction, and PST on the CMHC premium are computed from your
            province and first-time-buyer status.
          </p>
        </div>
        <ModeToggle
          value={inputs.closingCostsMode}
          onChange={(v) => update({ closingCostsMode: v })}
        />
      </header>

      {isManual ? (
        <InputField
          name="closingCostsManual"
          value={inputs.closingCostsManual}
          meta={FIELD_META.closingCostsManual}
          onChange={(_, v) => update({ closingCostsManual: v })}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3">
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
                    ? "Toronto's Municipal Land Transfer Tax applies to properties within the City of Toronto's boundaries (Etobicoke, North York, Scarborough, East York, York, Old Toronto). Surrounding GTA cities like Mississauga, Vaughan, Markham, Oakville, and Burlington do NOT pay MLTT regardless of price. Toronto's brackets match Ontario's up to $2M, then escalate above. FTB rebate up to $4,475 (separate from the Ontario $4,000)."
                    : "Montréal's welcome tax adds higher brackets above $500k vs the provincial Quebec baseline. Suburbs (Laval, Longueuil, Brossard) use the provincial baseline."
                }
              />
            ) : null}
          </div>

          <InputField
            name="otherClosingCosts"
            value={inputs.otherClosingCosts}
            meta={FIELD_META.otherClosingCosts}
            onChange={(_, v) => update({ otherClosingCosts: v })}
          />

          <Breakdown results={results} />
        </>
      )}
    </section>
  );
}

function ModeToggle({ value, onChange }) {
  return (
    <div role="tablist" className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-xs">
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
            value === v
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
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
      <Switch
        id={id}
        checked={checked}
        onChange={onChange}
        aria-label={label}
      />
    </div>
  );
}

function Breakdown({ results }) {
  const breakdown = results?.closingCostsBreakdown?.breakdown || [];
  const total = results?.closingCosts || 0;
  if (!breakdown.length) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Breakdown
      </div>
      <ul className="divide-y divide-slate-100 text-sm">
        {breakdown.map((line, i) => (
          <li key={i} className="flex items-start justify-between gap-3 py-1.5">
            <div>
              <div className="text-slate-700">{line.label}</div>
              {line.sublabel ? (
                <div className="text-xs text-slate-500">{line.sublabel}</div>
              ) : null}
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
        Model estimate. Tax rates and rebates are indexed annually; FTB and newly-built exemptions have eligibility
        rules (residency, principal-residence use, never having owned a home worldwide for BC PTT). Confirm with a
        real-estate lawyer before signing.
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
  if (detail.provincialGross != null && detail.provincialGross > 0 && detail.federalGross == null) {
    // Already covered above as "Provincial HST"; this branch handled by LTT path.
  }
  if (!rows.length) return null;
  return (
    <ul className="mt-1 space-y-0.5 text-[11px] tabular-nums text-slate-500">
      {rows.map(([label, amount], i) => (
        <li key={i} className="flex justify-between gap-2">
          <span>{label}</span>
          <span>{amount < 0 ? "−" : ""}{formatCurrency(Math.abs(amount))}</span>
        </li>
      ))}
    </ul>
  );
}
