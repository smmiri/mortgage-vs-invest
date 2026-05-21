import InfoTip from "./InfoTip.jsx";

export default function InputField({ name, value, meta, onChange }) {
  const id = `field-${name}`;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {meta.label}
        </label>
        {meta.help ? <InfoTip text={meta.help} /> : null}
      </div>
      <div className="flex items-center rounded-md border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
        <input
          id={id}
          name={name}
          type="number"
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => {
            const parsed = parseFloat(e.target.value);
            onChange(name, Number.isFinite(parsed) ? parsed : 0);
          }}
          step={meta.step ?? 1}
          min={meta.min}
          max={meta.max}
          inputMode="decimal"
          className="w-full bg-transparent px-3 py-2 text-right text-sm tabular-nums text-slate-900 focus:outline-none"
        />
        {meta.suffix ? (
          <span className="px-3 text-xs font-medium text-slate-400">{meta.suffix}</span>
        ) : null}
      </div>
    </div>
  );
}
