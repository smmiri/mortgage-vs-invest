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
import { formatCompactCurrency, formatCurrency } from "../lib/format.js";

const BUY_COLOR = "#2563eb"; // blue-600
const RENT_COLOR = "#059669"; // emerald-600

export default function WealthChart({ results }) {
  const { trajectory, final } = results;
  const data = trajectory.map((p) => ({
    year: p.year,
    buy: p.buyWealth,
    rent: p.rentWealth,
  }));

  return (
    <figure
      aria-label="Wealth over time"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <figcaption className="flex flex-col gap-1 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Wealth trajectory</h2>
          <p className="text-xs text-slate-500">
            Both paths start with the same cash stake (the down payment). The buy line tracks the change in liquid
            equity plus any monthly surplus invested. The rent line tracks the down payment compounded at the market
            return plus monthly surplus.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
            Buy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" />
            Rent &amp; invest
          </span>
        </div>
      </figcaption>

      <div className="h-72 w-full sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="year"
              tickFormatter={(y) => (y === 0 ? "Today" : `Y${y}`)}
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              type="number"
              domain={[0, "dataMax"]}
              allowDecimals={false}
            />
            <YAxis
              tickFormatter={(v) => formatCompactCurrency(v).replace("$", "$")}
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <Tooltip
              cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }}
              content={<ChartTooltip />}
            />
            {final.breakeven != null ? (
              <ReferenceLine
                x={final.breakeven}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{
                  position: "top",
                  value: `Crossover · Y${final.breakeven}`,
                  fill: "#475569",
                  fontSize: 11,
                }}
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="buy"
              name="Buy"
              stroke={BUY_COLOR}
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 0, fill: BUY_COLOR }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="rent"
              name="Rent & invest"
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

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const buy = payload.find((p) => p.dataKey === "buy")?.value ?? 0;
  const rent = payload.find((p) => p.dataKey === "rent")?.value ?? 0;
  const delta = buy - rent;
  const isToday = label === 0;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-md">
      <div className="font-semibold text-slate-700">{isToday ? "Today" : `Year ${label}`}</div>
      <div className="mt-2 grid grid-cols-[auto_auto] gap-x-3 gap-y-1 tabular-nums">
        <span className="text-slate-500">Buy</span>
        <span className="text-right font-medium text-slate-800">{formatCurrency(buy)}</span>
        <span className="text-slate-500">Rent &amp; invest</span>
        <span className="text-right font-medium text-slate-800">{formatCurrency(rent)}</span>
        <span className="text-slate-500">Difference</span>
        <span
          className={`text-right font-semibold ${delta >= 0 ? "text-emerald-700" : "text-rose-700"}`}
        >
          {delta >= 0 ? "+" : "−"}
          {formatCurrency(Math.abs(delta))}
        </span>
      </div>
    </div>
  );
}
