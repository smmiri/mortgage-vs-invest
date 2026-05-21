import { useMemo } from "react";
import { DEFAULT_INPUTS } from "../lib/defaults.js";
import {
  canadianMonthlyRate,
  cmhcRate,
  monthlyPaymentAmount,
  monthlyToEffectiveAnnual,
  simulate,
} from "../lib/model.js";
import { formatCurrency, formatCurrencyDecimal, formatPercent } from "../lib/format.js";

export default function Methodology() {
  const example = useMemo(() => buildWorkedExample(DEFAULT_INPUTS), []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold text-slate-900">How the math works</h2>
      <p className="mt-2 text-sm text-slate-600">
        Every number on this page is computed in your browser by a pure function: input → trajectory of monthly cash
        flows, mortgage paydown, and portfolio compounding. Nothing leaves your device. The model uses the same
        Canadian mortgage conventions as realtor.ca, RBC, and TD consumer calculators (semi-annual compounding,
        CMHC tiers).
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Block title="1. Mortgage payment">
          <p>
            From a quoted nominal annual rate <Code>r</Code>, the effective monthly rate under the Canadian
            semi-annual convention is
          </p>
          <Formula>r_m = (1 + r / 2)^(1/6) − 1</Formula>
          <p>
            That is slightly less than <Code>r / 12</Code>. The monthly payment for a principal <Code>P</Code> over
            <Code>n</Code> months is the standard amortization formula
          </p>
          <Formula>P · r_m · (1 + r_m)ⁿ / ((1 + r_m)ⁿ − 1)</Formula>
          <p>
            CMHC default insurance (added to <Code>P</Code> when down payment is below 20%): 2.8% for 15–19.99% down,
            3.1% for 10–14.99%, 4.0% for 5–9.99%, plus 0.20% if amortization exceeds 25 years.
          </p>
        </Block>

        <Block title="2. The monthly cash flow">
          <p>
            Each month the model assumes both paths spend the same on housing —
            <Code>max(owning_cost, rent)</Code> — so the comparison is apples to apples. Whichever side is cheaper
            invests the difference at the market return.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              When ownership is more expensive (the common case), the renter invests
              <Code>own_cost − rent</Code> every month. <strong>This is where the renter's top-up comes from:</strong>
              the implicit housing budget set by the buyer's payment.
            </li>
            <li>
              When renting is more expensive (e.g. paid-off mortgage), the buyer compounds
              <Code>rent − own_cost</Code> in a side portfolio.
            </li>
          </ul>
          <p>
            The renter's contribution is never negative — if rent exceeds the budget on the buy side, the renter just
            compounds what's already in the portfolio without drawing from it.
          </p>
        </Block>

        <Block title="3. Cash to close — province-aware">
          <p>
            Closing costs are computed from your province, first-time-buyer status, and whether the home is newly
            built. Three lines stack into the total the buyer hands over above the down payment:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Land / property transfer tax.</strong> BC PTT (1/2/3/5% brackets), Ontario LTT (0.5–2.5%) plus
              optional Toronto MLTT, Quebec welcome tax (with Montreal extras), Manitoba bracketed, flat / negligible
              in AB/SK/Atlantic/territories. First-time buyers get exemptions or rebates: BC full-PTT exemption up to
              $835k (partial to $860k), Ontario $4,000 rebate, Toronto MLTT $4,475 rebate, PEI full exemption ≤ $200k.
              BC also has a Newly Built Home exemption (full ≤ $1.1M, partial to $1.15M).
            </li>
            <li>
              <strong>GST / HST on new construction.</strong> Resale is exempt. New homes incur federal GST 5%; in
              HST provinces (ON / NB / NS / NL / PE) the provincial portion also applies. Ontario rebates 75% of the
              provincial portion up to $24,000. The 2025 federal <em>First-Time Home Buyer GST Rebate</em> refunds
              100% of GST on new homes ≤ $1M for FTBs, with a linear phase-out to $0 at $1.5M. Quebec uses GST + QST
              with its own rebate.
            </li>
            <li>
              <strong>PST on the CMHC premium</strong> in ON / QC / SK / MB (the CMHC premium itself is rolled into
              the mortgage; the provincial sales tax on that premium is cash at closing).
            </li>
            <li>
              <strong>Legal, title, inspection</strong> — a non-tax line, default $2,500.
            </li>
          </ul>
          <p>
            The buyer's down payment becomes equity; closing costs are sunk to third parties. The renter is treated
            as having the <em>same</em> total cash — <Code>down_payment + closing_costs</Code> — invested in the
            market portfolio at year 0. The visible year-0 gap between the two lines equals <Code>closing_costs</Code>
            exactly.
          </p>
          <p className="text-xs text-slate-500">
            Sources: CRA{" "}
            <a className="text-indigo-600 hover:underline" href="https://www.canada.ca/en/services/benefits/housing.html" target="_blank" rel="noreferrer noopener">
              Housing benefits
            </a>{" "}
            (GST/HST New Housing Rebate, FHSA, HBP), 2025 federal First-Time Home Buyer GST Rebate announcement,
            BC PTT post-April-2024 thresholds, Ontario LTT + Toronto MLTT schedules. Tax rules change — confirm with a
            real-estate lawyer.
          </p>
        </Block>

        <Block title="4. Sale costs (optional)">
          <p>
            If you plan to sell at the end of the horizon, the buyer's liquid value at year <Code>t</Code> is
          </p>
          <Formula>property_value(t) · (1 − sale_cost%) − mortgage_balance(t)</Formula>
          <p>
            Realtor + legal + discharge usually runs 4–6% of sale price in Canada. Turn the toggle off if you intend
            to keep the property; the buy line then reflects paper equity (property minus mortgage).
          </p>
        </Block>

        <Block title="5. Year 0 baseline">
          <p>
            The buy line is rebased to the down payment at year 0 so the curves are visually comparable. Behind the
            scenes the buy line evolves as
          </p>
          <Formula>
            buy(t) = down_payment + (liquid_value(t) − liquid_value(0)) + buyer_side_portfolio(t)
          </Formula>
          <p>
            The rebase absorbs the CMHC premium and the immediate sale-cost haircut into the baseline. The renter's
            line is the actual portfolio value, starting at <Code>down_payment + closing_costs</Code>.
          </p>
        </Block>

        <Block title="6. What is not modeled">
          <ul className="list-disc space-y-1 pl-5">
            <li>Tax treatment: principal-residence capital gains exemption, marginal tax on investment returns, TFSA / RRSP shelters.</li>
            <li>Income variability, refinancing, mortgage renewals at different rates over the amortization.</li>
            <li>Major capital expenditure on the home beyond the monthly maintenance figure.</li>
            <li>Renter's insurance, security deposits, moving costs.</li>
            <li>Rent control and provincial guideline caps (apply your own ceiling on the rent-increase input).</li>
          </ul>
          <p>Treat results as directional. The model is most useful as a sensitivity tool — change one input at a time and watch the crossover year shift.</p>
        </Block>
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">Worked example — the default scenario</h3>
        <p className="mt-1 text-sm text-slate-600">
          Plug the defaults into the formulas above. Numbers update live with your inputs.
        </p>
        <ol className="mt-4 space-y-3 text-sm text-slate-700">
          <Step n={1} title="CMHC tier">
            Down payment {formatPercent(example.dpPct, 1)} of price → premium rate{" "}
            <strong>{formatPercent(example.cmhcRate, 2)}</strong> →{" "}
            CMHC <strong>{formatCurrency(example.cmhcPremium)}</strong>.
          </Step>
          <Step n={2} title="Principal financed">
            {formatCurrency(example.baseMortgage)} + CMHC {formatCurrency(example.cmhcPremium)} ={" "}
            <strong>{formatCurrency(example.totalPrincipal)}</strong>.
          </Step>
          <Step n={3} title="Effective monthly rate">
            <Code>{`(1 + ${example.rate} / 2)^(1/6) − 1`}</Code> ={" "}
            <strong>{formatPercent(example.monthlyRate, 4)}</strong> per month (effective annual{" "}
            <strong>{formatPercent(example.ear, 4)}</strong>).
          </Step>
          <Step n={4} title="Monthly P&I">
            <Code>{`${example.totalPrincipal.toLocaleString()} · ${example.monthlyRate.toFixed(6)} · (1 + r_m)^${example.n} / ((1 + r_m)^${example.n} − 1)`}</Code>{" "}
            = <strong>{formatCurrencyDecimal(example.monthlyPayment)}</strong>.
          </Step>
          <Step n={5} title="Cash at closing">
            Down payment {formatCurrency(example.downPayment)} + closing costs{" "}
            {formatCurrency(example.closingCosts)} ={" "}
            <strong>{formatCurrency(example.cashAtClose)}</strong>. Both paths "start" with this cash; the renter
            invests all of it, the buyer puts only the down payment into equity.
          </Step>
          <Step n={6} title="Year 1 housing budget">
            Ownership ({formatCurrencyDecimal(example.monthlyPayment)} P&amp;I +{" "}
            {formatCurrency(example.fixedExpenses)} ownership costs) ={" "}
            <strong>{formatCurrencyDecimal(example.monthlyPayment + example.fixedExpenses)}</strong>; rent{" "}
            {formatCurrency(example.initialRent)}. The renter invests the difference,{" "}
            <strong>
              {formatCurrencyDecimal(example.monthlyPayment + example.fixedExpenses - example.initialRent)}
            </strong>{" "}
            / month at the market return.
          </Step>
        </ol>
        <p className="mt-4 text-xs text-slate-500">
          You can verify the monthly P&amp;I against the
          {" "}
          <a className="text-indigo-600 hover:underline" href="https://www.realtor.ca/calculator" target="_blank" rel="noreferrer noopener">
            realtor.ca payment calculator
          </a>
          : same property price, same down payment, same amortization, same rate. Differences are usually because
          they report total payment (including monthly property tax and condo fees) while we report P&amp;I only and
          break out ownership expenses separately.
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
  const ear = monthlyToEffectiveAnnual(monthlyRate);
  return {
    dpPct,
    rate,
    monthlyRate,
    ear,
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

function Block({ title, children }) {
  return (
    <article className="space-y-3 text-sm leading-relaxed text-slate-600">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </article>
  );
}

function Code({ children }) {
  return (
    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[12px] text-slate-700">{children}</code>
  );
}

function Formula({ children }) {
  return (
    <div className="my-2 rounded-md bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">{children}</div>
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
