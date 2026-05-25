import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
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

const CASHFLOW_COLORS = {
  buyPrincipal: "#1e3a8a",
  buyInterest: "#3b82f6",
  buyFixed: "#93c5fd",
  rentPaid: "#047857",
  rentTopUp: "#6ee7b7",
};

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

const CASHFLOW_KEYS = [
  "buyPrincipal",
  "buyInterest",
  "buyFixed",
  "rentPaid",
  "rentTopUp",
];

function maxWealthValue(data) {
  let max = 0;
  for (const d of data) {
    max = Math.max(max, d.buy ?? 0, d.rent ?? 0);
  }
  return max;
}

function maxCashflowStack(data) {
  let max = 0;
  for (const d of data) {
    const buy = (d.buyPrincipal ?? 0) + (d.buyInterest ?? 0) + (d.buyFixed ?? 0);
    const rent = (d.rentPaid ?? 0) + (d.rentTopUp ?? 0);
    max = Math.max(max, buy, rent);
  }
  return max;
}

function niceAxisMax(value, pad = 0.08) {
  if (value <= 0) return 1;
  const padded = value * (1 + pad);
  const magnitude = Math.pow(10, Math.floor(Math.log10(padded)));
  const normalized = padded / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export default function WealthChart({ results }) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const { resolved } = useTheme();
  const colors = CHART_THEME[resolved];
  const { trajectory, final, inputs } = results;
  const afterTax = inputs.modelExitTaxes !== false;

  const data = trajectory.map((p) => {
    const cf = p.annualCashflow;
    return {
      year: p.year,
      buy: afterTax ? p.buyWealthAfterTax : p.buyWealth,
      rent: afterTax ? p.rentWealthAfterTax : p.rentWealth,
      buyPreTax: p.buyWealth,
      rentPreTax: p.rentWealth,
      buyPrincipal: cf?.buyPrincipal ?? 0,
      buyInterest: cf?.buyInterest ?? 0,
      buyFixed: cf?.buyFixed ?? 0,
      rentPaid: cf?.rentPaid ?? 0,
      rentTopUp: cf?.rentTopUp ?? 0,
    };
  });

  const breakeven = final.breakeven;
  const wealthMax = niceAxisMax(maxWealthValue(data));
  const cashflowMax = niceAxisMax(maxCashflowStack(data));

  return (
    <figure
      aria-label="Wealth over time"
      className="rounded-2xl border border-default bg-surface-card p-5 shadow-sm sm:p-6"
    >
      <figcaption className="flex flex-col gap-3 pb-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-heading">
              {afterTax ? t("chart.titleAfterTax") : t("chart.title")}
            </h2>
            <p className="text-xs text-muted">
              {afterTax
                ? t("chart.afterTaxCaption", { year: inputs.years })
                : t("chart.preTaxCaption")}
            </p>
            <p className="mt-1 text-xs text-muted">{t("chart.cashflowCaption")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-body">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
              {t("chart.buy")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" />
              {t("chart.rent")}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted">
          <span className="font-medium text-label">{t("chart.cashflowLegendBuy")}</span>
          {(["buyPrincipal", "buyInterest", "buyFixed"]).map((key) => (
            <span key={key} className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ backgroundColor: CASHFLOW_COLORS[key] }}
              />
              {t(`chart.${key}`)}
            </span>
          ))}
          <span className="font-medium text-label">{t("chart.cashflowLegendRent")}</span>
          {(["rentPaid", "rentTopUp"]).map((key) => (
            <span key={key} className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ backgroundColor: CASHFLOW_COLORS[key] }}
              />
              {t(`chart.${key}`)}
            </span>
          ))}
        </div>
      </figcaption>

      <div className="chart-ltr h-80 w-full overflow-visible sm:h-[28rem]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            barCategoryGap="18%"
            barGap={4}
            margin={{ top: 28, right: 12, left: 4, bottom: 4 }}
          >
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
              padding={{ left: 12, right: 28 }}
            />
            <YAxis
              yAxisId="left"
              domain={[0, wealthMax]}
              tickFormatter={(v) => fmt.formatCompactCurrency(v)}
              tick={{ fontSize: 12, fill: colors.tick }}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, cashflowMax]}
              tickFormatter={(v) => fmt.formatCompactCurrency(v)}
              tick={{ fontSize: 11, fill: colors.tick }}
              axisLine={false}
              tickLine={false}
              width={64}
              tickMargin={10}
            />
            <Tooltip
              cursor={{ stroke: colors.cursor, strokeWidth: 1 }}
              content={<ChartTooltip afterTax={afterTax} colors={colors} fmt={fmt} t={t} />}
            />
            {breakeven != null ? (
              <ReferenceLine
                yAxisId="left"
                x={breakeven}
                stroke={colors.ref}
                strokeDasharray="4 4"
                label={{
                  position: "insideTop",
                  value: t("chart.crossover", { year: breakeven }),
                  fill: colors.refLabel,
                  fontSize: 11,
                  offset: 6,
                }}
              />
            ) : null}
            <Bar
              yAxisId="right"
              dataKey="buyPrincipal"
              name={t("chart.buyPrincipal")}
              stackId="buy"
              fill={CASHFLOW_COLORS.buyPrincipal}
              fillOpacity={0.55}
              maxBarSize={36}
              isAnimationActive={false}
            />
            <Bar
              yAxisId="right"
              dataKey="buyInterest"
              name={t("chart.buyInterest")}
              stackId="buy"
              fill={CASHFLOW_COLORS.buyInterest}
              fillOpacity={0.55}
              maxBarSize={36}
              isAnimationActive={false}
            />
            <Bar
              yAxisId="right"
              dataKey="buyFixed"
              name={t("chart.buyFixed")}
              stackId="buy"
              fill={CASHFLOW_COLORS.buyFixed}
              fillOpacity={0.55}
              maxBarSize={36}
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              yAxisId="right"
              dataKey="rentPaid"
              name={t("chart.rentPaid")}
              stackId="rent"
              fill={CASHFLOW_COLORS.rentPaid}
              fillOpacity={0.55}
              maxBarSize={36}
              isAnimationActive={false}
            />
            <Bar
              yAxisId="right"
              dataKey="rentTopUp"
              name={t("chart.rentTopUp")}
              stackId="rent"
              fill={CASHFLOW_COLORS.rentTopUp}
              fillOpacity={0.55}
              maxBarSize={36}
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
            <Line
              yAxisId="left"
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
              yAxisId="left"
              type="monotone"
              dataKey="rent"
              name={t("chart.rent")}
              stroke={RENT_COLOR}
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 0, fill: RENT_COLOR }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

function TooltipSwatch({ color, className = "" }) {
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-sm ${className}`}
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

function TooltipRow({ color, label, value, valueClassName = "" }) {
  return (
    <>
      <span className="flex min-w-0 items-center gap-1.5 text-muted">
        {color ? <TooltipSwatch color={color} /> : null}
        <span className="truncate">{label}</span>
      </span>
      <span className={`text-end font-medium text-heading ${valueClassName}`}>{value}</span>
    </>
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
  const hasCashflow = !isToday && CASHFLOW_KEYS.some((k) => (row?.[k] ?? 0) > 0);
  const buyTotal = (row?.buyPrincipal ?? 0) + (row?.buyInterest ?? 0) + (row?.buyFixed ?? 0);
  const rentTotal = (row?.rentPaid ?? 0) + (row?.rentTopUp ?? 0);
  const deltaClass =
    delta >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400";

  return (
    <div
      className="max-w-xs rounded-lg border p-3 text-xs shadow-md"
      style={{ borderColor: colors.tooltipBorder, backgroundColor: colors.tooltipBg }}
    >
      <div className="font-semibold text-label">
        {isToday ? t("chart.today") : t("chart.year", { year: label })}
      </div>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 tabular-nums numeric-ltr">
        <TooltipRow color={BUY_COLOR} label={t("chart.buy")} value={fmt.formatCurrency(buy)} />
        <TooltipRow color={RENT_COLOR} label={t("chart.rent")} value={fmt.formatCurrency(rent)} />
        <TooltipRow
          label={t("chart.difference")}
          value={`${delta >= 0 ? "+" : "−"}${fmt.formatCurrency(Math.abs(delta))}`}
          valueClassName={`font-semibold ${deltaClass}`}
        />
      </div>
      {hasCashflow ? (
        <div className="mt-2 border-t border-subtle pt-2">
          <div className="text-[10px] font-medium text-label">{t("chart.annualCashflow")}</div>
          <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 tabular-nums numeric-ltr text-[10px]">
            <span className="col-span-2 font-medium text-muted">{t("chart.cashflowLegendBuy")}</span>
            <TooltipRow
              color={CASHFLOW_COLORS.buyPrincipal}
              label={t("chart.buyPrincipal")}
              value={fmt.formatCurrency(row.buyPrincipal)}
            />
            <TooltipRow
              color={CASHFLOW_COLORS.buyInterest}
              label={t("chart.buyInterest")}
              value={fmt.formatCurrency(row.buyInterest)}
            />
            <TooltipRow
              color={CASHFLOW_COLORS.buyFixed}
              label={t("chart.buyFixed")}
              value={fmt.formatCurrency(row.buyFixed)}
            />
            <TooltipRow
              label={t("chart.buyCashflowTotal")}
              value={fmt.formatCurrency(buyTotal)}
              valueClassName="font-semibold"
            />
            <span className="col-span-2 mt-1 font-medium text-muted">{t("chart.cashflowLegendRent")}</span>
            <TooltipRow
              color={CASHFLOW_COLORS.rentPaid}
              label={t("chart.rentPaid")}
              value={fmt.formatCurrency(row.rentPaid)}
            />
            <TooltipRow
              color={CASHFLOW_COLORS.rentTopUp}
              label={t("chart.rentTopUp")}
              value={fmt.formatCurrency(row.rentTopUp)}
            />
            <TooltipRow
              label={t("chart.rentCashflowTotal")}
              value={fmt.formatCurrency(rentTotal)}
              valueClassName="font-semibold"
            />
          </div>
        </div>
      ) : null}
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
