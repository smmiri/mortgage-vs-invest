import { useId, useState } from "react";

export default function InfoTip({ text }) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-describedby={tipId}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500 hover:border-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        i
      </button>
      {open ? (
        <span
          id={tipId}
          role="tooltip"
          className="absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-md border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-600 shadow-sm"
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
