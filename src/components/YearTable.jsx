import { useState } from "react";
import { formatCompactCurrency, formatCurrency, formatSignedCurrency } from "../lib/format.js";

export default function YearTable({ results }) {
  const [open, setOpen] = useState(false);
  const { trajectory } = results;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <div>
          <h2 className="text-base font-semibold text-slate-900">Year-by-year detail</h2>
          <p className="text-xs text-slate-500">Property value, mortgage balance, equity, monthly cash flow.</p>
        </div>
        <span className="text-xs font-medium text-indigo-600">{open ? "Hide" : "Show"}</span>
      </button>

      {open ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3 font-semibold">Year</th>
                <th className="py-2 pr-3 font-semibold">Property</th>
                <th className="py-2 pr-3 font-semibold">Mortgage</th>
                <th className="py-2 pr-3 font-semibold">Equity</th>
                <th className="py-2 pr-3 font-semibold">Buy wealth</th>
                <th className="py-2 pr-3 font-semibold">Rent wealth</th>
                <th className="py-2 pr-3 font-semibold">Monthly rent</th>
                <th className="py-2 pr-3 font-semibold">Monthly own</th>
                <th className="py-2 font-semibold">Delta</th>
              </tr>
            </thead>
            <tbody>
              {trajectory.map((p) => {
                const delta = p.buyWealth - p.rentWealth;
                return (
                  <tr key={p.year} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3 font-medium text-slate-700">{p.year === 0 ? "Today" : `Y${p.year}`}</td>
                    <td className="py-2 pr-3 text-slate-700">{formatCompactCurrency(p.propertyValue)}</td>
                    <td className="py-2 pr-3 text-slate-700">{formatCompactCurrency(p.mortgageBalance)}</td>
                    <td className="py-2 pr-3 text-slate-700">{formatCompactCurrency(p.equity)}</td>
                    <td className="py-2 pr-3 text-blue-700">{formatCurrency(p.buyWealth)}</td>
                    <td className="py-2 pr-3 text-emerald-700">{formatCurrency(p.rentWealth)}</td>
                    <td className="py-2 pr-3 text-slate-700">{formatCurrency(p.monthlyRent)}</td>
                    <td className="py-2 pr-3 text-slate-700">{formatCurrency(p.monthlyOwningCost)}</td>
                    <td className={`py-2 font-medium ${delta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {formatSignedCurrency(delta)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
