import InfoTip from "./InfoTip.jsx";

const TONE_STYLES = {
  neutral: "border-slate-200 bg-white",
  primary: "border-indigo-100 bg-indigo-50",
  buy: "border-blue-100 bg-blue-50",
  rent: "border-emerald-100 bg-emerald-50",
  positive: "border-emerald-200 bg-emerald-50",
  negative: "border-rose-200 bg-rose-50",
};

const VALUE_TONE = {
  positive: "text-emerald-700",
  negative: "text-rose-700",
};

export default function StatCard({ label, value, sublabel, help, tone = "neutral" }) {
  return (
    <div className={`flex flex-col gap-1 rounded-xl border p-4 ${TONE_STYLES[tone] ?? TONE_STYLES.neutral}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        {help ? <InfoTip text={help} /> : null}
      </div>
      <div className={`text-2xl font-semibold tabular-nums tracking-tight text-slate-900 ${VALUE_TONE[tone] ?? ""}`}>
        {value}
      </div>
      {sublabel ? <div className="text-xs text-slate-500">{sublabel}</div> : null}
    </div>
  );
}
