import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { useFormat } from "../hooks/useFormat.js";
import { useTheme } from "./ThemeProvider.jsx";

const BUY_COLOR = "#2563eb";
const RENT_COLOR = "#059669";

const CHART_THEME = {
  light: {
    grid: "#e2e8f0",
    tick: "#64748b",
    cursor: "#cbd5e1",
    ref: "#94a3b8",
    refLabel: "#475569",
    tooltipBorder: "#e2e8f0",
    tooltipBg: "#ffffff",
  },
  dark: {
    grid: "#334155",
    tick: "#94a3b8",
    cursor: "#475569",
    ref: "#64748b",
    refLabel: "#cbd5e1",
    tooltipBorder: "#475569",
    tooltipBg: "#0f172a",
  },
};

export default function WealthChart({ results }) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const { resolved } = useTheme();
  const colors = CHART_THEME[resolved];
  const { trajectory, final, inputs } = results;
  const afterTax = inputs.modelExitTaxes !== false;

  const data = trajectory.map((p) => ({
    year: p.year,
    buy: afterTax ? p.buyWealthAfterTax : p.buyWealth,
    rent: afterTax ? p.rentWealthAfterTax : p.rentWealth,
    buyPreTax: p.buyWealth,
    rentPreTax: p.rentWealth,
  }));

  const breakeven = final.breakeven;

  return (
    <figure
      aria-label="Wealth over time"
      className="rounded-2xl border border-default bg-surface-card p-5 shadow-sm sm:p-6"
    >
      <figcaption className="flex flex-col gap-1 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-heading">
            {afterTax ? t("chart.titleAfterTax") : t("chart.title")}
          </h2>
          <p className="text-xs text-muted">
            {afterTax
              ? t("chart.afterTaxCaption", { year: inputs.years })
              : t("chart.preTaxCaption")}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-body">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
            {t("chart.buy")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" />
            {t("chart.rent")}
          </span>
        </div>
      </figcaption>

      <div className="chart-ltr h-72 w-full sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
            <XAxis
              dataKey="year"
              tickFormatter={(y) => (y === 0 ? t("chart.today") : `Y${y}`)}
              tick={{ fontSize: 12, fill: colors.tick }}
              axisLine={false}
              tickLine={false}
              type="number"
              domain={[0, "dataMax"]}
              allowDecimals={false}
            />
            <YAxis
              tickFormatter={(v) => fmt.formatCompactCurrency(v)}
              tick={{ fontSize: 12, fill: colors.tick }}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip
              cursor={{ stroke: colors.cursor, strokeWidth: 1 }}
              content={<ChartTooltip afterTax={afterTax} colors={colors} fmt={fmt} t={t} />}
            />
            {breakeven != null ? (
              <ReferenceLine
                x={breakeven}
                stroke={colors.ref}
                strokeDasharray="4 4"
                label={{
                  position: "top",
                  value: t("chart.crossover", { year: breakeven }),
                  fill: colors.refLabel,
                  fontSize: 11,
                }}
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="buy"
              name={t("chart.buy")}
              stroke={BUY_COLOR}
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 0, fill: BUY_COLOR }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="rent"
              name={t("chart.rent")}
              stroke={RENT_COLOR}
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 0, fill: RENT_COLOR }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

function ChartTooltip({ active, payload, label, afterTax, colors, fmt, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const buy = payload.find((p) => p.dataKey === "buy")?.value ?? 0;
  const rent = payload.find((p) => p.dataKey === "rent")?.value ?? 0;
  const delta = buy - rent;
  const isToday = label === 0;
  const showPreTax =
    afterTax && row && (row.buy !== row.buyPreTax || row.rent !== row.rentPreTax);

  return (
    <div
      className="rounded-lg border p-3 text-xs shadow-md"
      style={{ borderColor: colors.tooltipBorder, backgroundColor: colors.tooltipBg }}
    >
      <div className="font-semibold text-label">
        {isToday ? t("chart.today") : t("chart.year", { year: label })}
      </div>
      <div className="mt-2 grid grid-cols-[auto_auto] gap-x-3 gap-y-1 tabular-nums numeric-ltr">
        <span className="text-muted">{t("chart.buy")}</span>
        <span className="text-end font-medium text-heading">{fmt.formatCurrency(buy)}</span>
        <span className="text-muted">{t("chart.rent")}</span>
        <span className="text-end font-medium text-heading">{fmt.formatCurrency(rent)}</span>
        <span className="text-muted">{t("chart.difference")}</span>
        <span
          className={`text-end font-semibold ${delta >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
        >
          {delta >= 0 ? "+" : "−"}
          {fmt.formatCurrency(Math.abs(delta))}
        </span>
      </div>
      {showPreTax ? (
        <p className="mt-2 border-t border-subtle pt-2 text-[10px] text-muted">
          {t("chart.preTaxExit", {
            buy: fmt.formatCurrency(row.buyPreTax),
            rent: fmt.formatCurrency(row.rentPreTax),
          })}
        </p>
      ) : null}
    </div>
  );
}
