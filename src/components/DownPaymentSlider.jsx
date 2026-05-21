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
          <label htmlFor={id} className="text-sm font-medium text-label">
            {meta.label}
          </label>
          {meta.help ? <InfoTip text={meta.help} /> : null}
        </div>
        <div className="flex items-center rounded-md border input-shell text-sm">
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
            className="w-16 bg-transparent py-1 pl-2 text-right tabular-nums text-heading focus:outline-none"
          />
          <span className="pr-2 text-xs font-medium text-caption">%</span>
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
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-caption">
        <span>
          {min}%
        </span>
        <span>
          {max}%
        </span>
      </div>
      <p className="mt-1.5 text-xs tabular-nums text-body">
        <span className="font-medium text-heading">{formatCurrency(downPayment)}</span>
        <span className="text-muted"> cash at closing</span>
        {price > 0 ? (
          <span className="text-muted">
            {" "}
            · {formatCurrency(price - downPayment)} financed
          </span>
        ) : null}
      </p>
    </div>
  );
}
