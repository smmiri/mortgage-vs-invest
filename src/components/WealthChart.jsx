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
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <figcaption className="flex flex-col gap-1 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Wealth trajectory{afterTax ? " (after tax)" : ""}
          </h2>
          <p className="text-xs text-slate-500">
            {afterTax ? (
              <>
                Lines match the headline delta. Portfolio gains are taxed each year (non-registered assumption); home
                sale tax applies at year {inputs.years} only when selling.
              </>
            ) : (
              <>
                Both paths start with the same cash stake. The buy line tracks liquid equity plus any monthly surplus
                invested; the rent line tracks the market portfolio plus monthly top-ups.
              </>
            )}
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
            <Tooltip cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }} content={<ChartTooltip afterTax={afterTax} />} />
            {breakeven != null ? (
              <ReferenceLine
                x={breakeven}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{
                  position: "top",
                  value: `Crossover · Y${breakeven}`,
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

function ChartTooltip({ active, payload, label, afterTax }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const buy = payload.find((p) => p.dataKey === "buy")?.value ?? 0;
  const rent = payload.find((p) => p.dataKey === "rent")?.value ?? 0;
  const delta = buy - rent;
  const isToday = label === 0;
  const showPreTax =
    afterTax && row && (row.buy !== row.buyPreTax || row.rent !== row.rentPreTax);

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
      {showPreTax ? (
        <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
          Pre-tax at exit: buy {formatCurrency(row.buyPreTax)}, rent {formatCurrency(row.rentPreTax)}
        </p>
      ) : null}
    </div>
  );
}
