const TONE = {
  error: "border-rose-200 bg-rose-50 text-rose-900",
  warn: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

export default function Warnings({ items }) {
  if (!items?.length) return null;
  return (
    <ul aria-label="Model warnings" className="space-y-2">
      {items.map((w, i) => (
        <li
          key={`${w.level}-${i}`}
          className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${TONE[w.level] ?? TONE.info}`}
        >
          <span className="font-semibold uppercase tracking-wide opacity-70">{w.level}</span>
          <span className="ml-2">{w.text}</span>
        </li>
      ))}
    </ul>
  );
}
