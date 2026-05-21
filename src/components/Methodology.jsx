import { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { DEFAULT_INPUTS } from "../lib/defaults.js";
import {
  canadianMonthlyRate,
  cmhcRate,
  monthlyPaymentAmount,
  simulate,
} from "../lib/model.js";
import { useFormat } from "../hooks/useFormat.js";
import { RULES_AS_OF } from "../lib/site-meta.js";

const README_PATH = "blob/main/README.md";

export default function Methodology({ repoUrl = "https://github.com/smmiri/mortgage-vs-invest" }) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const example = useMemo(() => buildWorkedExample(DEFAULT_INPUTS), []);
  const readmeUrl = `${repoUrl.replace(/\/$/, "")}/${README_PATH}`;

  return (
    <section className="rounded-2xl border border-default bg-surface-card p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold text-heading">{t("methodology.title")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-body">{t("methodology.p1")}</p>
      <p className="mt-2 text-sm leading-relaxed text-body">
        <Trans
          i18nKey="methodology.p2"
          values={{ rulesDate: RULES_AS_OF }}
          components={{
            strong: <strong className="font-medium text-label" />,
            readme: (
              <a className="font-medium link-accent" href={readmeUrl} target="_blank" rel="noreferrer noopener" />
            ),
          }}
        />
      </p>

      <div className="mt-8 rounded-2xl border border-default bg-surface-inset p-5 sm:p-6">
        <h3 className="text-base font-semibold text-heading">{t("methodology.exampleTitle")}</h3>
        <p className="mt-1 text-sm text-body">{t("methodology.exampleHint")}</p>
        <ol className="mt-4 space-y-3 text-sm text-label">
          <Step n={1} title={t("methodology.step1Title")}>
            {t("methodology.step1", {
              dp: fmt.formatPercent(example.dpPct, 1),
              rate: fmt.formatPercent(example.cmhcRate, 2),
              premium: fmt.formatCurrency(example.cmhcPremium),
            })}
          </Step>
          <Step n={2} title={t("methodology.step2Title")}>
            {t("methodology.step2", {
              base: fmt.formatCurrency(example.baseMortgage),
              total: fmt.formatCurrency(example.totalPrincipal),
            })}
          </Step>
          <Step n={3} title={t("methodology.step3Title")}>
            <Trans
              i18nKey="methodology.step3"
              values={{
                rate: fmt.formatPercent(example.monthlyRate, 4),
                payment: fmt.formatCurrencyDecimal(example.monthlyPayment),
              }}
              components={{
                code: <Code>r_m</Code>,
                strong: <strong />,
              }}
            />
          </Step>
          <Step n={4} title={t("methodology.step4Title")}>
            {t("methodology.step4", {
              down: fmt.formatCurrency(example.downPayment),
              closing: fmt.formatCurrency(example.closingCosts),
              total: fmt.formatCurrency(example.cashAtClose),
            })}
          </Step>
          <Step n={5} title={t("methodology.step5Title")}>
            {t("methodology.step5", {
              own: fmt.formatCurrencyDecimal(example.monthlyPayment + example.fixedExpenses),
              rent: fmt.formatCurrency(example.initialRent),
              topUp: fmt.formatCurrencyDecimal(
                example.monthlyPayment + example.fixedExpenses - example.initialRent,
              ),
            })}
          </Step>
        </ol>
        <p className="mt-4 text-xs text-muted">
          <Trans
            i18nKey="methodology.realtor"
            components={{
              link: (
                <a
                  className="link-accent"
                  href="https://www.realtor.ca/calculator"
                  target="_blank"
                  rel="noreferrer noopener"
                />
              ),
            }}
          />
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
    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[12px] text-label dark:bg-slate-800">{children}</code>
  );
}

function Step({ n, title, children }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
      >
        {n}
      </span>
      <div className="space-y-0.5 leading-relaxed">
        <div className="font-semibold text-heading">{title}</div>
        <div>{children}</div>
      </div>
    </li>
  );
}
