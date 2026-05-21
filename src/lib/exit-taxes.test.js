import { test } from "node:test";
import assert from "node:assert/strict";
import {
  annualCapitalGainsTaxRate,
  computeExitTaxes,
  computeHomeSaleTax,
  settleAnnualPortfolioTax,
} from "./exit-taxes.js";

test("annualCapitalGainsTaxRate combines inclusion and marginal", () => {
  assert.equal(annualCapitalGainsTaxRate(40, 50), 0.2);
});

test("settleAnnualPortfolioTax taxes year gain net of contributions", () => {
  const r = settleAnnualPortfolioTax({
    startValue: 100_000,
    endValue: 115_000,
    contributions: 5_000,
    costBasis: 100_000,
    taxRate: 0.2,
  });
  assert.equal(r.yearGain, 10_000);
  assert.equal(r.tax, 2_000);
  assert.equal(r.afterTax, 113_000);
  assert.equal(r.newCostBasis, 115_000);
});

test("settleAnnualPortfolioTax: loss year pays no tax", () => {
  const r = settleAnnualPortfolioTax({
    startValue: 100_000,
    endValue: 90_000,
    contributions: 0,
    costBasis: 100_000,
    taxRate: 0.2,
  });
  assert.equal(r.tax, 0);
  assert.equal(r.afterTax, 90_000);
});

test("full PRE: no tax on home sale gain", () => {
  const r = computeHomeSaleTax({
    applySaleCost: true,
    propertyPrice: 1_000_000,
    propertyValueAtExit: 1_300_000,
    saleCostPct: 5,
    yearsOwned: 10,
    preExemption: "full",
    marginalTaxRate: 40,
    capitalGainsInclusionRate: 50,
  });
  assert.equal(r.buyTax, 0);
  assert.ok(r.buyGain > 0);
});

test("none PRE: taxes full home gain", () => {
  const r = computeHomeSaleTax({
    applySaleCost: true,
    propertyPrice: 1_000_000,
    propertyValueAtExit: 1_300_000,
    saleCostPct: 5,
    preExemption: "none",
    marginalTaxRate: 40,
    capitalGainsInclusionRate: 50,
  });
  const proceeds = 1_300_000 * 0.95;
  const gain = proceeds - 1_000_000;
  assert.equal(r.buyTax, Math.round(gain * 0.5 * 0.4));
});

test("computeExitTaxes uses supplied annual portfolio tax totals", () => {
  const r = computeExitTaxes({
    modelExitTaxes: true,
    applySaleCost: false,
    propertyPrice: 1_000_000,
    propertyValueAtExit: 1_200_000,
    rentTaxPaidAnnually: 12_345,
    buyerPortfolioTaxPaidAnnually: 0,
    renterPortfolio: 500_000,
    renterCostBasis: 200_000,
    marginalTaxRate: 40,
    capitalGainsInclusionRate: 50,
  });
  assert.equal(r.rentTax, 12_345);
  assert.equal(r.buyTax, 0);
});
