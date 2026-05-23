import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "../hooks/useFormat.js";

export default function YearTable({ results }) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const [open, setOpen] = useState(false);
  const { trajectory } = results;

  return (
    <section className="rounded-2xl border border-default bg-surface-card p-5 shadow-sm sm:p-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-start"
        aria-expanded={open}
      >
        <div>
          <h2 className="text-base font-semibold text-heading">{t("yearTable.title")}</h2>
          <p className="text-xs text-muted">{t("yearTable.hint")}</p>
        </div>
        <span className="text-xs font-medium link-accent">{open ? t("yearTable.hide") : t("yearTable.show")}</span>
      </button>

      {open ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs tabular-nums">
            <thead>
              <tr className="border-b border-default text-start text-[11px] uppercase tracking-wide text-muted">
                <th className="py-2 pe-3 font-semibold">{t("yearTable.year")}</th>
                <th className="py-2 pe-3 font-semibold">{t("yearTable.property")}</th>
                <th className="py-2 pe-3 font-semibold">{t("yearTable.mortgage")}</th>
                <th className="py-2 pe-3 font-semibold">{t("yearTable.equity")}</th>
                <th className="py-2 pe-3 font-semibold">{t("yearTable.buyWealth")}</th>
                <th className="py-2 pe-3 font-semibold">{t("yearTable.rentWealth")}</th>
                <th className="py-2 pe-3 font-semibold">{t("yearTable.monthlyRent")}</th>
                <th className="py-2 pe-3 font-semibold">{t("yearTable.monthlyOwn")}</th>
                <th className="py-2 font-semibold">{t("yearTable.delta")}</th>
              </tr>
            </thead>
            <tbody>
              {trajectory.map((p) => {
                const delta = p.buyWealth - p.rentWealth;
                return (
                  <tr key={p.year} className="border-b border-subtle last:border-0">
                    <td className="py-2 pe-3 font-medium text-label">
                      {p.year === 0 ? t("yearTable.today") : `Y${p.year}`}
                    </td>
                    <td className="numeric-ltr py-2 pe-3 text-label">{fmt.formatCompactCurrency(p.propertyValue)}</td>
                    <td className="numeric-ltr py-2 pe-3 text-label">{fmt.formatCompactCurrency(p.mortgageBalance)}</td>
                    <td className="numeric-ltr py-2 pe-3 text-label">{fmt.formatCompactCurrency(p.equity)}</td>
                    <td className="numeric-ltr py-2 pe-3 text-blue-700 dark:text-blue-400">{fmt.formatCurrency(p.buyWealth)}</td>
                    <td className="numeric-ltr py-2 pe-3 text-emerald-700 dark:text-emerald-400">{fmt.formatCurrency(p.rentWealth)}</td>
                    <td className="numeric-ltr py-2 pe-3 text-label">{fmt.formatCurrency(p.monthlyRent)}</td>
                    <td className="numeric-ltr py-2 pe-3 text-label">{fmt.formatCurrency(p.monthlyOwningCost)}</td>
                    <td
                      className={`numeric-ltr py-2 font-medium ${delta >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
                    >
                      {fmt.formatSignedCurrency(delta)}
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
