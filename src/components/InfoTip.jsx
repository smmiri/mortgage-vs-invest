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
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-default text-[10px] font-semibold text-muted hover:border-slate-500 hover:text-label focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:hover:border-slate-400"
      >
        i
      </button>
      {open ? (
        <span
          id={tipId}
          role="tooltip"
          className="absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-md border border-default bg-surface-card p-3 text-xs leading-relaxed text-body shadow-md dark:shadow-black/40"
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
