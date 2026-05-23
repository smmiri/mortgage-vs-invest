// Pure financial model for buy-vs-rent-and-invest comparison.
// Designed for Canadian mortgages (semi-annual compounding, CMHC tiers) but
// usable elsewhere with `mortgageRate` interpreted accordingly.
//
// Framing — cash conservation
// ---------------------------
// Both paths start with the SAME cash on hand: `downPayment + closingCosts`.
// The buyer commits that cash to the property (the down payment becomes equity,
// closing costs are sunk to land transfer tax, legal, title, inspection, and
// any PST on CMHC). The renter invests the same total cash in a market
// portfolio at the chosen return rate.
//
// Each month, both paths spend `max(owning_cost, rent)` on housing — the
// renter's "investment top-up" is the difference between that monthly housing
// budget and the rent they actually paid. When owning costs more, the renter
// invests the surplus. When renting costs more (e.g. paid-off mortgage), the
// buyer compounds the surplus into a side portfolio. The renter's top-up is
// floored at zero in either direction (no negative investing).
//
// References
// - CMHC mortgage loan insurance premiums:
//   https://www.cmhc-schl.gc.ca/professionals/project-funding-and-mortgage-financing/mortgage-loan-insurance/mortgage-loan-insurance-homeownership-programs/cmhc-mortgage-loan-insurance-cost
// - Canada Interest Act s.6 — interest on mortgages compounded "not more than
//   half-yearly". Lenders quote a nominal annual rate compounded semi-annually,
//   so the effective monthly rate is `(1 + nominal/2)^(2/12) - 1`. This is the
//   same convention realtor.ca, RBC, and TD use in their consumer calculators.

export const CMHC_TIERS = [
  { minDown: 0.15, max: 0.1999, rate: 0.028 },
  { minDown: 0.1, max: 0.1499, rate: 0.031 },
  { minDown: 0.05, max: 0.0999, rate: 0.04 },
];

// Extended amortization (>25y) on an insured mortgage adds a surcharge.
// Current CMHC standard: +0.20%.
export const CMHC_LONG_AMORT_SURCHARGE = 0.002;

// Minimum down payment policy in Canada:
// 5% on the first $500k, 10% on the portion $500k–$1.5M, 20% above $1.5M.
export const CMHC_TIER_BREAKS = [
  { upTo: 500_000, rate: 0.05 },
  { upTo: 1_500_000, rate: 0.1 },
];

export function minDownPayment(propertyPrice) {
  if (propertyPrice <= 0) return 0;
  if (propertyPrice > 1_500_000) return propertyPrice * 0.2;
  let min = 0;
  let remaining = propertyPrice;
  let prev = 0;
  for (const t of CMHC_TIER_BREAKS) {
    const sliceCap = Math.min(propertyPrice, t.upTo) - prev;
    if (sliceCap <= 0) break;
    min += sliceCap * t.rate;
    remaining -= sliceCap;
    prev = t.upTo;
    if (remaining <= 0) break;
  }
  return min;
}

export function cmhcRate(downPayment, propertyPrice, amortization) {
  if (downPayment <= 0 || propertyPrice <= 0) return 0;
  if (propertyPrice > 1_500_000) return 0; // not insurable
  const pct = downPayment / propertyPrice;
  if (pct >= 0.2) return 0;
  let rate = 0;
  for (const tier of CMHC_TIERS) {
    if (pct >= tier.minDown) {
      rate = tier.rate;
      break;
    }
  }
  if (rate === 0 && pct < 0.05) rate = 0.04; // below policy minimum; flag separately
  if (amortization > 25) rate += CMHC_LONG_AMORT_SURCHARGE;
  return rate;
}

// Canadian effective monthly rate from a nominal annual rate compounded
// semi-annually. (1 + r_nom/2)^(2/12) - 1.
export function canadianMonthlyRate(annualPct) {
  if (annualPct <= 0) return 0;
  return Math.pow(1 + annualPct / 200, 2 / 12) - 1;
}

export function monthlyPaymentAmount(principal, monthlyRate, totalMonths) {
  if (principal <= 0 || totalMonths <= 0) return 0;
  if (monthlyRate <= 0) return principal / totalMonths;
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

// Effective annual rate from any monthly rate. For display.
export function monthlyToEffectiveAnnual(monthlyRate) {
  return Math.pow(1 + monthlyRate, 12) - 1;
}

// Core simulation. Returns trajectory + summary stats.
//
// Framing
// - Both paths start with the same cash stake = down payment at year 0.
// - Renter invests the down payment in a market portfolio.
// - Buyer puts the down payment into the home (CMHC + closing rolled into
//   mortgage). Buyer's "asset" line is rebased to the down payment at year 0
//   so the two paths are visually comparable. The methodology section in the
//   UI is explicit about this.
// - At any month, the more-expensive path defines the monthly cash outlay.
//   The cheaper-path party invests the difference into their own portfolio.
//   This makes the comparison symmetric: it still works if owning is cheaper
//   than renting (e.g. paid-off home), in which case the buyer compounds the
//   surplus into a side portfolio.
// - When `applySaleCost` is false, the buyer's liquid value at year y is the
//   property value minus mortgage balance (no realtor / closing penalty).
//   This represents the "I keep the property" scenario where wealth is paper
//   equity.
import { computeClosingCosts } from "./closing-costs.js";
import { WARNING_CODES } from "./warning-codes.js";
import {
  annualCapitalGainsTaxRate,
  computeExitTaxes,
  computeHomeSaleTax,
  settleAnnualPortfolioTax,
} from "./exit-taxes.js";

export function simulate(inputs) {
  const {
    propertyPrice,
    downPayment,
    amortization,
    mortgageRate,
    propertyGrowth,
    fixedExpenses,
    expenseInflation,
    initialRent,
    rentIncrease,
    marketReturn,
    years,
    applySaleCost,
    saleCostPct,
    modelExitTaxes = true,
    preExemption = "full",
    yearsAsPrincipalResidence,
    marginalTaxRate = 40,
    capitalGainsInclusionRate = 50,
    closingCostsMode = "auto",
    closingCostsManual = 0,
    province = "ON",
    firstTimeBuyer = false,
    newConstruction = false,
    includeTorontoLtt = false,
    otherClosingCosts = 0,
  } = inputs;

  const safeYears = Math.max(1, Math.min(40, Math.round(years || 0)));
  const safeAmort = Math.max(1, Math.min(40, Math.round(amortization || 25)));

  const rateInfo = cmhcRate(downPayment, propertyPrice, safeAmort);
  const baseMortgage = Math.max(0, propertyPrice - downPayment);
  const cmhcPremium = baseMortgage * rateInfo;
  const totalPrincipal = baseMortgage + cmhcPremium;

  // Closing-cost breakdown — province-aware in auto mode, single number in
  // manual. Available on the result for the UI to render line items.
  const closingCostsBreakdown =
    closingCostsMode === "manual"
      ? {
          landTransferTax: {
            provincialGross: 0,
            provincialRebate: 0,
            provincialNet: 0,
            municipalGross: 0,
            municipalRebate: 0,
            municipalNet: 0,
            total: 0,
            lines: [],
          },
          gstHst: { applies: false, total: 0, lines: [] },
          pstOnCmhc: 0,
          other: Math.max(0, closingCostsManual || 0),
          total: Math.max(0, closingCostsManual || 0),
          breakdown: [
            {
              labelKey: "manualLabel",
              amount: Math.max(0, closingCostsManual || 0),
              sublabelKey: "manualSub",
            },
          ],
        }
      : computeClosingCosts({
          price: propertyPrice,
          province,
          firstTimeBuyer,
          newConstruction,
          includeTorontoLtt,
          otherClosingCosts,
          cmhcPremium,
        });
  const closingCosts = Math.round(Math.max(0, closingCostsBreakdown.total));

  const r = canadianMonthlyRate(mortgageRate);
  const n = safeAmort * 12;
  const monthlyPayment = monthlyPaymentAmount(totalPrincipal, r, n);

  const monthlyMarketRate = Math.pow(1 + (marketReturn || 0) / 100, 1 / 12) - 1;
  const monthlyExpenseGrowth = Math.pow(1 + (expenseInflation || 0) / 100, 1 / 12) - 1;
  const saleMultiplier = applySaleCost ? 1 - (saleCostPct || 0) / 100 : 1;

  const initialLiquidBuy = propertyPrice * saleMultiplier - totalPrincipal;
  const initialTopUp = monthlyPayment + (fixedExpenses || 0) - (initialRent || 0);

  let mortgageBalance = totalPrincipal;
  // Renter starts with the same cash the buyer needs at closing
  // (down payment + closing costs), all invested in the market portfolio.
  // The buyer's down payment becomes equity; closing costs are sunk.
  let renterPortfolio = downPayment + closingCosts;
  let buyerPortfolio = 0;
  let expense = fixedExpenses || 0;
  const useExitTax = modelExitTaxes !== false;
  const portfolioTaxRate = useExitTax
    ? annualCapitalGainsTaxRate(marginalTaxRate, capitalGainsInclusionRate)
    : 0;
  let renterCostBasis = downPayment + closingCosts;
  let buyerPortfolioCostBasis = 0;
  let rentTaxPaidAnnually = 0;
  let buyerPortfolioTaxPaidAnnually = 0;

  const trajectory = [
    {
      year: 0,
      // Buyer line is rebased to the down payment at year 0 (the cash that
      // converted to equity). The closing-cost gap shows up as the visible
      // delta between the two lines at year 0.
      buyWealth: Math.round(downPayment),
      rentWealth: Math.round(downPayment + closingCosts),
      propertyValue: Math.round(propertyPrice),
      mortgageBalance: Math.round(totalPrincipal),
      equity: Math.round(propertyPrice - totalPrincipal),
      liquidIfSold: Math.round(initialLiquidBuy),
      buyerSidePortfolio: 0,
      renterPortfolio: Math.round(downPayment + closingCosts),
      monthlyRent: Math.round(initialRent),
      monthlyOwningCost: Math.round(monthlyPayment + (fixedExpenses || 0)),
      monthlyDifference: Math.round(initialTopUp),
    },
  ];

  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let totalRentPaid = 0;
  let totalOwningCost = 0;

  for (let y = 1; y <= safeYears; y++) {
    const currentMonthlyRent = (initialRent || 0) * Math.pow(1 + (rentIncrease || 0) / 100, y - 1);
    const renterStartOfYear = renterPortfolio;
    const buyerPfStartOfYear = buyerPortfolio;
    let renterYearContrib = 0;
    let buyerYearContrib = 0;

    let monthOwningCost = 0;
    for (let m = 0; m < 12; m++) {
      const mortgageDue = mortgageBalance > 0 ? monthlyPayment : 0;
      const interest = mortgageBalance * r;
      const principalPayment = Math.min(mortgageDue - interest, mortgageBalance);
      mortgageBalance = Math.max(0, mortgageBalance - principalPayment);
      const interestThisMonth = Math.min(interest, mortgageDue);
      totalInterestPaid += interestThisMonth;
      totalPrincipalPaid += principalPayment;

      const owningCost = mortgageDue + expense;
      monthOwningCost += owningCost;
      totalOwningCost += owningCost;
      totalRentPaid += currentMonthlyRent;

      const cashCap = Math.max(owningCost, currentMonthlyRent);
      const buyerSurplus = cashCap - owningCost;
      const renterSurplus = cashCap - currentMonthlyRent;
      buyerPortfolio = buyerPortfolio * (1 + monthlyMarketRate) + buyerSurplus;
      renterPortfolio = renterPortfolio * (1 + monthlyMarketRate) + renterSurplus;
      renterYearContrib += renterSurplus;
      buyerYearContrib += buyerSurplus;

      expense = expense * (1 + monthlyExpenseGrowth);
    }

    const renterPreTax = renterPortfolio;
    const buyerPfPreTax = buyerPortfolio;

    if (useExitTax) {
      const rentSettle = settleAnnualPortfolioTax({
        startValue: renterStartOfYear,
        endValue: renterPortfolio,
        contributions: renterYearContrib,
        costBasis: renterCostBasis,
        taxRate: portfolioTaxRate,
      });
      renterPortfolio = rentSettle.afterTax;
      renterCostBasis = rentSettle.newCostBasis;
      rentTaxPaidAnnually += rentSettle.tax;

      const buySettle = settleAnnualPortfolioTax({
        startValue: buyerPfStartOfYear,
        endValue: buyerPortfolio,
        contributions: buyerYearContrib,
        costBasis: buyerPortfolioCostBasis,
        taxRate: portfolioTaxRate,
      });
      buyerPortfolio = buySettle.afterTax;
      buyerPortfolioCostBasis = buySettle.newCostBasis;
      buyerPortfolioTaxPaidAnnually += buySettle.tax;
    }

    const propertyValue = propertyPrice * Math.pow(1 + (propertyGrowth || 0) / 100, y);
    const liquidIfSold = propertyValue * saleMultiplier - mortgageBalance;
    const equity = propertyValue - mortgageBalance;
    const buyWealth = downPayment + (liquidIfSold - initialLiquidBuy) + buyerPfPreTax;
    const homeSale =
      useExitTax && y === safeYears && applySaleCost
        ? computeHomeSaleTax({
            applySaleCost,
            propertyPrice,
            propertyValueAtExit: propertyValue,
            saleCostPct,
            yearsOwned: safeYears,
            preExemption:
              preExemption === "partial" || preExemption === "none" ? preExemption : "full",
            yearsAsPrincipalResidence:
              yearsAsPrincipalResidence != null ? yearsAsPrincipalResidence : safeYears,
            marginalTaxRate,
            capitalGainsInclusionRate,
          })
        : { buyTax: 0 };
    const buyWealthAfterTax =
      downPayment + (liquidIfSold - initialLiquidBuy) + buyerPortfolio - (y === safeYears ? homeSale.buyTax : 0);

    trajectory.push({
      year: y,
      buyWealth: Math.round(buyWealth),
      rentWealth: Math.round(renterPreTax),
      buyWealthAfterTax: Math.round(buyWealthAfterTax),
      rentWealthAfterTax: Math.round(renterPortfolio),
      portfolioTaxYear: useExitTax
        ? Math.round(
            (y === safeYears ? homeSale.buyTax : 0) +
              (rentTaxPaidAnnually - (trajectory.at(-1)?.cumulativeRentTax ?? 0)),
          )
        : 0,
      cumulativeRentTax: Math.round(rentTaxPaidAnnually),
      propertyValue: Math.round(propertyValue),
      mortgageBalance: Math.round(mortgageBalance),
      equity: Math.round(equity),
      liquidIfSold: Math.round(liquidIfSold),
      buyerSidePortfolio: Math.round(buyerPortfolio),
      renterPortfolio: Math.round(renterPortfolio),
      monthlyRent: Math.round(currentMonthlyRent),
      monthlyOwningCost: Math.round(monthOwningCost / 12),
      monthlyDifference: Math.round(monthOwningCost / 12 - currentMonthlyRent),
    });
  }

  const finalPoint = trajectory.at(-1);
  const finalBuy = finalPoint.buyWealth;
  const finalRent = finalPoint.rentWealth;

  trajectory[0].buyWealthAfterTax = trajectory[0].buyWealth;
  trajectory[0].rentWealthAfterTax = trajectory[0].rentWealth;

  const exitTaxes = computeExitTaxes({
    modelExitTaxes: useExitTax,
    applySaleCost,
    propertyPrice,
    propertyValueAtExit: finalPoint.propertyValue,
    saleCostPct,
    yearsOwned: safeYears,
    preExemption: preExemption === "partial" || preExemption === "none" ? preExemption : "full",
    yearsAsPrincipalResidence:
      yearsAsPrincipalResidence != null ? yearsAsPrincipalResidence : safeYears,
    marginalTaxRate,
    capitalGainsInclusionRate,
    renterPortfolio: finalRent,
    renterCostBasis: renterCostBasis,
    rentTaxPaidAnnually,
    buyerPortfolioTaxPaidAnnually,
  });

  const buyAfterTax = finalPoint.buyWealthAfterTax;
  const rentAfterTax = finalPoint.rentWealthAfterTax;

  const chartTrajectory = useExitTax
    ? trajectory.map((p) => ({
        year: p.year,
        buyWealth: p.buyWealthAfterTax,
        rentWealth: p.rentWealthAfterTax,
      }))
    : trajectory;

  const breakeven = findBreakevenYear(chartTrajectory);
  const breakevenPreTax = useExitTax ? findBreakevenYear(trajectory) : breakeven;

  return {
    inputs: { ...inputs, amortization: safeAmort, years: safeYears },
    cmhcPremium,
    cmhcRateApplied: rateInfo,
    totalPrincipal,
    monthlyPayment,
    monthlyRate: r,
    initialTopUp,
    closingCosts,
    closingCostsBreakdown,
    cashAtClose: downPayment + closingCosts,
    trajectory,
    exitTaxes,
    final: {
      buy: finalBuy,
      rent: finalRent,
      delta: finalBuy - finalRent,
      buyAfterTax,
      rentAfterTax,
      deltaAfterTax: buyAfterTax - rentAfterTax,
      breakeven,
      breakevenPreTax: useExitTax ? breakevenPreTax : null,
      totalInterestPaid: Math.round(totalInterestPaid),
      totalPrincipalPaid: Math.round(totalPrincipalPaid),
      totalRentPaid: Math.round(totalRentPaid),
      totalOwningCost: Math.round(totalOwningCost),
    },
    warnings: collectWarnings(inputs, rateInfo, baseMortgage, safeYears, safeAmort),
  };
}

function findBreakevenYear(trajectory) {
  // The year at which the two curves cross (sign of buy − rent changes).
  if (trajectory.length < 2) return null;
  const initialSign = Math.sign(trajectory[0].buyWealth - trajectory[0].rentWealth) || 1;
  for (let i = 1; i < trajectory.length; i++) {
    const sign = Math.sign(trajectory[i].buyWealth - trajectory[i].rentWealth) || initialSign;
    if (sign !== initialSign) return trajectory[i].year;
  }
  return null;
}

function collectWarnings(inputs, rate, baseMortgage, years, amortization) {
  const warnings = [];
  const { propertyPrice, downPayment } = inputs;
  if (propertyPrice <= 0) {
    warnings.push({ level: "error", code: WARNING_CODES.PROPERTY_PRICE_ZERO });
    return warnings;
  }
  const dpPct = downPayment / propertyPrice;
  const minDp = minDownPayment(propertyPrice);
  if (downPayment < minDp - 1) {
    warnings.push({
      level: "warn",
      code: WARNING_CODES.DOWN_PAYMENT_BELOW_MIN,
      params: { minPct: minDp / propertyPrice, minDp },
    });
  }
  if (propertyPrice > 1_500_000 && dpPct < 0.2) {
    warnings.push({
      level: "warn",
      code: WARNING_CODES.PROPERTY_NOT_INSURABLE,
    });
  }
  if (amortization > 25 && rate > 0) {
    warnings.push({
      level: "info",
      code: WARNING_CODES.AMORTIZATION_CMHC_SURCHARGE,
    });
  }
  if (downPayment >= propertyPrice) {
    warnings.push({ level: "info", code: WARNING_CODES.CASH_PURCHASE });
  }
  if (baseMortgage > 0 && (inputs.mortgageRate || 0) <= 0) {
    warnings.push({
      level: "info",
      code: WARNING_CODES.ZERO_MORTGAGE_RATE,
    });
  }
  if (years > amortization && baseMortgage > 0) {
    warnings.push({
      level: "info",
      code: WARNING_CODES.HORIZON_EXCEEDS_AMORTIZATION,
      params: { years, amort: amortization },
    });
  }
  return warnings;
}
