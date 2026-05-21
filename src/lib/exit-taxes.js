/**
 * Simplified Canadian capital gains tax.
 *
 * Portfolio (renter + buyer side portfolio): tax applied annually on each
 * year's gain, assuming gains are realized and taxed in a non-registered account.
 *
 * Home: tax on sale at horizon only (principal residence exemption by default).
 *
 * Not modeled: loss carryforwards, CRA +1 PRE year, change-in-use, RRSP/FHSA,
 * dividend tax, AMT.
 */

export const PRE_EXEMPTION_MODES = ["full", "partial", "none"];

/** Effective rate on a dollar of capital gain: inclusion × marginal. */
export function annualCapitalGainsTaxRate(marginalTaxRate, capitalGainsInclusionRate) {
  return (Math.max(0, marginalTaxRate) / 100) * (Math.max(0, capitalGainsInclusionRate) / 100);
}

/**
 * Tax one portfolio for a calendar year of the simulation.
 * Gain = end value − start value − contributions; tax paid from the portfolio.
 */
export function settleAnnualPortfolioTax({ startValue, endValue, contributions, costBasis, taxRate }) {
  const yearGain = Math.max(0, endValue - startValue - contributions);
  const tax = yearGain * taxRate;
  const afterTax = endValue - tax;
  const newCostBasis = costBasis + contributions + yearGain;
  return {
    afterTax,
    newCostBasis,
    tax,
    yearGain,
  };
}

export function preExemptionFraction(preExemption, yearsOwned, yearsAsPrincipalResidence) {
  const owned = Math.max(1, yearsOwned);
  if (preExemption === "none") return 0;
  if (preExemption === "partial") {
    const designated = Math.min(Math.max(0, yearsAsPrincipalResidence ?? owned), owned);
    return designated / owned;
  }
  return 1;
}

/** Capital gains tax on home sale at exit (PRE applied). */
export function computeHomeSaleTax({
  applySaleCost,
  propertyPrice,
  propertyValueAtExit,
  saleCostPct = 0,
  yearsOwned = 1,
  preExemption = "full",
  yearsAsPrincipalResidence,
  marginalTaxRate = 0,
  capitalGainsInclusionRate = 50,
}) {
  if (!applySaleCost || propertyPrice <= 0) {
    return { buyGain: 0, buyExemptFraction: 1, buyTaxableGain: 0, buyTax: 0, buyTaxApplies: false };
  }

  const inclusionFrac = Math.max(0, capitalGainsInclusionRate) / 100;
  const marginal = Math.max(0, marginalTaxRate) / 100;
  const proceeds = propertyValueAtExit * (1 - Math.max(0, saleCostPct) / 100);
  const buyGain = Math.max(0, proceeds - propertyPrice);
  const buyExemptFraction = preExemptionFraction(
    preExemption,
    yearsOwned,
    yearsAsPrincipalResidence,
  );
  const buyTaxableGain = buyGain * (1 - buyExemptFraction);
  const buyTax = buyTaxableGain * inclusionFrac * marginal;

  return {
    buyGain: Math.round(buyGain),
    buyExemptFraction,
    buyTaxableGain: Math.round(buyTaxableGain),
    buyTax: Math.round(buyTax),
    buyTaxApplies: true,
  };
}

/**
 * Summary for UI — portfolio taxes are supplied from the simulation loop.
 */
export function computeExitTaxes(params) {
  const {
    modelExitTaxes,
    applySaleCost,
    propertyPrice,
    propertyValueAtExit,
    saleCostPct = 0,
    yearsOwned = 1,
    preExemption = "full",
    yearsAsPrincipalResidence,
    marginalTaxRate = 0,
    capitalGainsInclusionRate = 50,
    renterPortfolio = 0,
    renterCostBasis = 0,
    rentTaxPaidAnnually = 0,
    buyerPortfolioTaxPaidAnnually = 0,
  } = params;

  const home = modelExitTaxes
    ? computeHomeSaleTax({
        applySaleCost,
        propertyPrice,
        propertyValueAtExit,
        saleCostPct,
        yearsOwned,
        preExemption,
        yearsAsPrincipalResidence,
        marginalTaxRate,
        capitalGainsInclusionRate,
      })
    : { buyGain: 0, buyExemptFraction: 1, buyTaxableGain: 0, buyTax: 0, buyTaxApplies: false };

  const portfolioGain = Math.max(0, renterPortfolio - renterCostBasis);

  return {
    modelExitTaxes: Boolean(modelExitTaxes),
    taxMode: "annual",
    buyTaxApplies: home.buyTaxApplies,
    buyGain: home.buyGain,
    buyExemptFraction: home.buyExemptFraction,
    buyTaxableGain: home.buyTaxableGain,
    buyTax: home.buyTax,
    buyHomeTax: home.buyTax,
    rentCostBasis: Math.round(renterCostBasis),
    rentPortfolioGain: Math.round(portfolioGain),
    rentTax: Math.round(rentTaxPaidAnnually),
    rentTaxPaidAnnually: Math.round(rentTaxPaidAnnually),
    buyerPortfolioTaxPaidAnnually: Math.round(buyerPortfolioTaxPaidAnnually),
    totalPortfolioTax: Math.round(rentTaxPaidAnnually + buyerPortfolioTaxPaidAnnually),
    inclusionRate: capitalGainsInclusionRate,
    marginalTaxRate,
  };
}

/**
 * If TFSA/FHSA contribution room were tracked, tax-free growth would be capped:
 *   exemptGain = min(portfolioGain, remainingRoom)
 * Requires inputs: tfsaRoomAvailable, fhsaRoomAvailable (and eligibility flags).
 */
