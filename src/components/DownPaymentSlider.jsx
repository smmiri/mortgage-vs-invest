import InfoTip from "./InfoTip.jsx";
import { formatCurrency } from "../lib/format.js";

/**
 * Down payment as % of property price. The model still stores dollars;
 * this control reads/writes `downPayment` via the percentage.
 */
export default function DownPaymentSlider({ propertyPrice, downPayment, meta, onChange }) {
  const id = "field-downPayment";
  const min = meta.min ?? 0;
  const max = meta.max ?? 100;
  const step = meta.step ?? 0.5;
  const price = Math.max(0, propertyPrice || 0);

  const pct =
    price > 0 && Number.isFinite(downPayment)
      ? Math.min(max, Math.max(min, (downPayment / price) * 100))
      : min;

  const setPct = (nextPct) => {
    const clamped = Math.min(max, Math.max(min, nextPct));
    onChange(Math.round((price * clamped) / 100));
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <label htmlFor={id} className="text-sm font-medium text-slate-700">
            {meta.label}
          </label>
          {meta.help ? <InfoTip text={meta.help} /> : null}
        </div>
        <div className="flex items-center rounded-md border border-slate-200 bg-white text-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
          <input
            type="number"
            value={Number.isFinite(pct) ? Number(pct.toFixed(2)) : ""}
            onChange={(e) => {
              const parsed = parseFloat(e.target.value);
              setPct(Number.isFinite(parsed) ? parsed : min);
            }}
            step={step}
            min={min}
            max={max}
            inputMode="decimal"
            aria-label={`${meta.label} percent`}
            className="w-16 bg-transparent py-1 pl-2 text-right tabular-nums text-slate-900 focus:outline-none"
          />
          <span className="pr-2 text-xs font-medium text-slate-400">%</span>
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={pct}
        onChange={(e) => setPct(parseFloat(e.target.value))}
        className="w-full cursor-grab accent-indigo-600"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={pct}
        aria-valuetext={`${pct}% (${formatCurrency(downPayment)})`}
      />
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-slate-400">
        <span>
          {min}%
        </span>
        <span>
          {max}%
        </span>
      </div>
      <p className="mt-1.5 text-xs tabular-nums text-slate-600">
        <span className="font-medium text-slate-900">{formatCurrency(downPayment)}</span>
        <span className="text-slate-500"> cash at closing</span>
        {price > 0 ? (
          <span className="text-slate-500">
            {" "}
            · {formatCurrency(price - downPayment)} financed
          </span>
        ) : null}
      </p>
    </div>
  );
}
