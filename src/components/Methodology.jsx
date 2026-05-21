import { useMemo } from "react";
import { DEFAULT_INPUTS } from "../lib/defaults.js";
import {
  canadianMonthlyRate,
  cmhcRate,
  monthlyPaymentAmount,
  simulate,
} from "../lib/model.js";
import { formatCurrency, formatCurrencyDecimal, formatPercent } from "../lib/format.js";

const README_PATH = "blob/main/README.md";

export default function Methodology({ repoUrl = "https://github.com/smmiri/mortgage-vs-invest" }) {
  const example = useMemo(() => buildWorkedExample(DEFAULT_INPUTS), []);
  const readmeUrl = `${repoUrl.replace(/\/$/, "")}/${README_PATH}`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold text-slate-900">How the math works</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Everything runs in your browser; inputs never leave your device. Each month both paths share the same housing
        budget, <Code>max(owning_cost, rent)</Code>, and the cheaper side invests the difference. When owning costs more
        (typical early years), the renter&apos;s monthly top-up is that gap, funded from the same implicit budget as
        the buyer&apos;s payment.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        At year 0 the buy line shows only the down payment; the renter&apos;s line includes down payment plus closing
        costs, so the gap between curves equals cash-to-close. The chart marks the crossover year when net wealth
        flips. Formulas, CMHC tiers, provincial taxes, and exclusions are documented in the{" "}
        <a className="font-medium text-indigo-600 hover:underline" href={readmeUrl} target="_blank" rel="noreferrer noopener">
          README on GitHub
        </a>
        .
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">Worked example (default scenario)</h3>
        <p className="mt-1 text-sm text-slate-600">
          Default inputs walked through step by step. Change sliders above to see your own numbers in the chart.
        </p>
        <ol className="mt-4 space-y-3 text-sm text-slate-700">
          <Step n={1} title="CMHC tier">
            Down payment {formatPercent(example.dpPct, 1)} → premium rate{" "}
            <strong>{formatPercent(example.cmhcRate, 2)}</strong> → CMHC{" "}
            <strong>{formatCurrency(example.cmhcPremium)}</strong>.
          </Step>
          <Step n={2} title="Principal financed">
            {formatCurrency(example.baseMortgage)} + CMHC = <strong>{formatCurrency(example.totalPrincipal)}</strong>.
          </Step>
          <Step n={3} title="Monthly rate & P&amp;I">
            Canadian <Code>r_m</Code> = <strong>{formatPercent(example.monthlyRate, 4)}</strong>/mo → payment{" "}
            <strong>{formatCurrencyDecimal(example.monthlyPayment)}</strong>.
          </Step>
          <Step n={4} title="Cash at closing">
            Down {formatCurrency(example.downPayment)} + closing {formatCurrency(example.closingCosts)} ={" "}
            <strong>{formatCurrency(example.cashAtClose)}</strong> total cash (renter invests all; buyer keeps down in
            equity).
          </Step>
          <Step n={5} title="Year 1 top-up">
            Owning {formatCurrencyDecimal(example.monthlyPayment + example.fixedExpenses)}/mo vs rent{" "}
            {formatCurrency(example.initialRent)} → renter invests{" "}
            <strong>
              {formatCurrencyDecimal(example.monthlyPayment + example.fixedExpenses - example.initialRent)}
            </strong>
            /mo at market return.
          </Step>
        </ol>
        <p className="mt-4 text-xs text-slate-500">
          P&amp;I should match{" "}
          <a className="text-indigo-600 hover:underline" href="https://www.realtor.ca/calculator" target="_blank" rel="noreferrer noopener">
            realtor.ca
          </a>{" "}
          for the same price, down payment, rate, and amortization; we report P&amp;I separately from property tax and
          condo fees.
        </p>
      </div>
    </section>
  );
}

function buildWorkedExample(inputs) {
  const sim = simulate(inputs);
  const dpPct = inputs.downPayment / inputs.propertyPrice;
  const rate = inputs.mortgageRate;
  const monthlyRate = canadianMonthlyRate(rate);
  const cmhc = cmhcRate(inputs.downPayment, inputs.propertyPrice, inputs.amortization);
  const baseMortgage = inputs.propertyPrice - inputs.downPayment;
  const cmhcPremium = baseMortgage * cmhc;
  const totalPrincipal = baseMortgage + cmhcPremium;
  const n = inputs.amortization * 12;
  const monthlyPayment = monthlyPaymentAmount(totalPrincipal, monthlyRate, n);
  return {
    dpPct,
    rate,
    monthlyRate,
    cmhcRate: cmhc,
    cmhcPremium,
    baseMortgage,
    totalPrincipal,
    n,
    monthlyPayment,
    downPayment: inputs.downPayment,
    closingCosts: sim.closingCosts,
    cashAtClose: sim.cashAtClose,
    fixedExpenses: inputs.fixedExpenses,
    initialRent: inputs.initialRent,
  };
}

function Code({ children }) {
  return (
    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[12px] text-slate-700">{children}</code>
  );
}

function Step({ n, title, children }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700"
      >
        {n}
      </span>
      <div className="space-y-0.5 leading-relaxed">
        <div className="font-semibold text-slate-900">{title}</div>
        <div>{children}</div>
      </div>
    </li>
  );
}
