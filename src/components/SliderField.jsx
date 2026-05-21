import InfoTip from "./InfoTip.jsx";

export default function SliderField({ name, value, meta, onChange }) {
  const id = `field-${name}`;
  const min = meta.min ?? 0;
  const max = meta.max ?? 100;
  const step = meta.step ?? 0.1;
  const clamp = (v) => Math.min(max, Math.max(min, v));
  const setValue = (v) => onChange(name, clamp(v));

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
            value={Number.isFinite(value) ? value : ""}
            onChange={(e) => {
              const parsed = parseFloat(e.target.value);
              setValue(Number.isFinite(parsed) ? parsed : 0);
            }}
            step={step}
            min={min}
            max={max}
            inputMode="decimal"
            aria-label={`${meta.label} precise value`}
            className="w-16 bg-transparent py-1 pl-2 text-right tabular-nums text-slate-900 focus:outline-none"
          />
          {meta.suffix ? (
            <span className="pr-2 text-xs font-medium text-slate-400">{meta.suffix}</span>
          ) : null}
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : min}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        className="w-full cursor-grab accent-indigo-600"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Number.isFinite(value) ? value : min}
        aria-valuetext={`${value}${meta.suffix ?? ""}`}
      />
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-slate-400">
        <span>
          {min}
          {meta.suffix}
        </span>
        <span>
          {max}
          {meta.suffix}
        </span>
      </div>
    </div>
  );
}
