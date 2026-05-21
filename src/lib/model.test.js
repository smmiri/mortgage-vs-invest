import { test } from "node:test";
import assert from "node:assert/strict";
import { canadianMonthlyRate, cmhcRate, minDownPayment, monthlyPaymentAmount, simulate } from "./model.js";
import { DEFAULT_INPUTS } from "./defaults.js";

test("canadianMonthlyRate uses semi-annual compounding", () => {
  // 1.0175^(1/6) - 1 ≈ 0.00289562
  const r = canadianMonthlyRate(3.5);
  assert.ok(Math.abs(r - 0.00289562) < 1e-6, `got ${r}`);
});

test("canadianMonthlyRate returns 0 for zero rate", () => {
  assert.equal(canadianMonthlyRate(0), 0);
});

test("monthlyPaymentAmount falls back to principal/n at zero rate", () => {
  assert.equal(monthlyPaymentAmount(120, 0, 12), 10);
});

test("cmhcRate respects tiers and 30y surcharge", () => {
  // 15% down -> 2.8%
  assert.equal(cmhcRate(150_000, 1_000_000, 25), 0.028);
  // 10% down -> 3.1%
  assert.equal(cmhcRate(100_000, 1_000_000, 25), 0.031);
  // 5% down -> 4.0%
  assert.equal(cmhcRate(50_000, 1_000_000, 25), 0.04);
  // 30y amortization adds 0.20%
  assert.equal(cmhcRate(150_000, 1_000_000, 30), 0.03);
  // 20% down -> no insurance
  assert.equal(cmhcRate(200_000, 1_000_000, 25), 0);
  // Above $1.5M -> not insurable
  assert.equal(cmhcRate(200_000, 2_000_000, 25), 0);
});

test("minDownPayment applies Canadian sliding scale", () => {
  // <= $500k: 5%
  assert.equal(minDownPayment(400_000), 20_000);
  // Between 500k and 1.5M: 5% on first 500k, 10% on rest
  assert.equal(minDownPayment(1_050_000), 25_000 + 55_000);
  // Above $1.5M: 20%
  assert.equal(minDownPayment(2_000_000), 400_000);
});

test("auto closing costs: buyer rebased to down payment; renter starts at cash-at-close", () => {
  const r = simulate(DEFAULT_INPUTS);
  assert.equal(r.trajectory[0].year, 0);
  assert.equal(r.trajectory[0].buyWealth, DEFAULT_INPUTS.downPayment);
  assert.equal(r.trajectory[0].rentWealth, r.cashAtClose);
  assert.ok(r.closingCosts > 0, "default Ontario resale should produce positive closing costs");
});

test("year-0 renter advantage equals computed closing costs (no compounding yet)", () => {
  const r = simulate(DEFAULT_INPUTS);
  assert.equal(r.trajectory[0].rentWealth - r.trajectory[0].buyWealth, r.closingCosts);
});

test("manual closing costs mode honors the manual override", () => {
  const r = simulate({ ...DEFAULT_INPUTS, closingCostsMode: "manual", closingCostsManual: 0 });
  assert.equal(r.trajectory[0].buyWealth, DEFAULT_INPUTS.downPayment);
  assert.equal(r.trajectory[0].rentWealth, DEFAULT_INPUTS.downPayment);
  assert.equal(r.closingCosts, 0);
});

test("higher manual closing costs raise the renter's portfolio at every year", () => {
  const cheap = simulate({ ...DEFAULT_INPUTS, closingCostsMode: "manual", closingCostsManual: 0 });
  const expensive = simulate({ ...DEFAULT_INPUTS, closingCostsMode: "manual", closingCostsManual: 50_000 });
  for (let i = 0; i < cheap.trajectory.length; i++) {
    assert.ok(
      expensive.trajectory[i].rentWealth > cheap.trajectory[i].rentWealth,
      `year ${i}: expensive rent ${expensive.trajectory[i].rentWealth} should beat cheap ${cheap.trajectory[i].rentWealth}`,
    );
  }
});

test("cashAtClose equals down payment plus computed closing costs", () => {
  const r = simulate(DEFAULT_INPUTS);
  assert.equal(r.cashAtClose, DEFAULT_INPUTS.downPayment + r.closingCosts);
});

test("first-time buyer in Ontario reduces LTT by up to $4,000", () => {
  const base = simulate(DEFAULT_INPUTS);
  const ftb = simulate({ ...DEFAULT_INPUTS, firstTimeBuyer: true });
  const drop = base.closingCosts - ftb.closingCosts;
  assert.ok(drop > 3_900 && drop <= 4_000, `expected ~$4k FTB savings, got ${drop}`);
});

test("Ontario new construction adds large GST/HST line; FTB reduces it sharply", () => {
  const resale = simulate({ ...DEFAULT_INPUTS, newConstruction: false });
  const newBuild = simulate({ ...DEFAULT_INPUTS, newConstruction: true });
  const newBuildFtb = simulate({ ...DEFAULT_INPUTS, newConstruction: true, firstTimeBuyer: true });
  assert.ok(
    newBuild.closingCosts - resale.closingCosts > 100_000,
    "Ontario new construction should add > $100k vs resale at $1.05M",
  );
  assert.ok(
    newBuild.closingCosts - newBuildFtb.closingCosts > 40_000,
    "FTB GST rebate should save > $40k at $1.05M",
  );
});

test("P&I matches the closed-form Canadian semi-annual formula", () => {
  const r = simulate(DEFAULT_INPUTS);
  const baseMortgage = DEFAULT_INPUTS.propertyPrice - DEFAULT_INPUTS.downPayment;
  const cmhcPremium = baseMortgage * 0.028; // 15% down -> 2.8%
  const principal = baseMortgage + cmhcPremium;
  const monthlyRate = Math.pow(1 + DEFAULT_INPUTS.mortgageRate / 200, 2 / 12) - 1;
  const months = DEFAULT_INPUTS.amortization * 12;
  const expected =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  // Should match within sub-penny precision.
  assert.ok(Math.abs(r.monthlyPayment - expected) < 0.01, `got ${r.monthlyPayment} expected ${expected}`);
});

test("simulate produces years 0..N inclusive", () => {
  const r = simulate({ ...DEFAULT_INPUTS, years: 7 });
  assert.equal(r.trajectory.length, 8);
  assert.equal(r.trajectory.at(-1).year, 7);
});

test("turning off sale cost yields a higher buy wealth than turning it on", () => {
  const off = simulate({ ...DEFAULT_INPUTS, applySaleCost: false });
  const on = simulate({ ...DEFAULT_INPUTS, applySaleCost: true });
  assert.ok(off.final.buy > on.final.buy);
  // Rent path is unchanged by the sale-cost toggle
  assert.equal(off.final.rent, on.final.rent);
});

test("cash purchase produces zero CMHC and zero mortgage payment", () => {
  const r = simulate({ ...DEFAULT_INPUTS, downPayment: DEFAULT_INPUTS.propertyPrice });
  assert.equal(r.cmhcPremium, 0);
  assert.equal(r.monthlyPayment, 0);
  assert.equal(r.totalPrincipal, 0);
});

test("buyer side portfolio grows only when renting is more expensive than owning", () => {
  const cheap = simulate({ ...DEFAULT_INPUTS, initialRent: 6_000 });
  const expensive = simulate({ ...DEFAULT_INPUTS, initialRent: 500 });
  const cheapLast = cheap.trajectory.at(-1).buyerSidePortfolio;
  const expensiveLast = expensive.trajectory.at(-1).buyerSidePortfolio;
  assert.ok(cheapLast > 0, "buyer should compound surplus when rent > own");
  assert.equal(expensiveLast, 0, "no buyer-side investing when rent < own");
});

test("breakeven crossover is reported when the lines cross", () => {
  const r = simulate({ ...DEFAULT_INPUTS, years: 30 });
  if (r.final.breakeven != null) {
    const before = r.trajectory[r.final.breakeven - 1];
    const after = r.trajectory[r.final.breakeven];
    const signBefore = Math.sign(before.buyWealth - before.rentWealth);
    const signAfter = Math.sign(after.buyWealth - after.rentWealth);
    assert.notEqual(signBefore, signAfter);
  }
});

test("warnings flag down payment below the Canadian minimum", () => {
  const r = simulate({ ...DEFAULT_INPUTS, propertyPrice: 1_000_000, downPayment: 30_000 });
  assert.ok(r.warnings.some((w) => /below Canadian minimum/i.test(w.text)));
});

test("default exit taxes: full PRE zero home tax, taxable portfolio taxed", () => {
  const r = simulate(DEFAULT_INPUTS);
  assert.equal(r.exitTaxes.buyTax, 0);
  assert.ok(r.exitTaxes.rentTax > 0);
  assert.equal(r.final.deltaAfterTax, r.final.buyAfterTax - r.final.rentAfterTax);
  assert.ok(r.exitTaxes.rentTax > 0);
  assert.ok(r.final.rentAfterTax < r.final.rent, "annual portfolio tax reduces renter wealth vs pre-tax line");
  assert.notEqual(r.final.deltaAfterTax, r.final.delta, "portfolio tax should move the headline delta");
});

test("annual portfolio tax reduces renter wealth each year when enabled", () => {
  const r = simulate(DEFAULT_INPUTS);
  for (let i = 1; i < r.trajectory.length; i++) {
    assert.ok(
      r.trajectory[i].rentWealthAfterTax <= r.trajectory[i].rentWealth,
      `year ${r.trajectory[i].year}`,
    );
  }
});

test("turning off exit taxes restores pre-tax delta", () => {
  const r = simulate({ ...DEFAULT_INPUTS, modelExitTaxes: false });
  assert.equal(r.exitTaxes.rentTax, 0);
  assert.equal(r.final.deltaAfterTax, r.final.delta);
});

test("after-tax chart points match headline delta at horizon", () => {
  const r = simulate(DEFAULT_INPUTS);
  const last = r.trajectory.at(-1);
  assert.equal(last.buyWealthAfterTax - last.rentWealthAfterTax, r.final.deltaAfterTax);
  assert.equal(last.buyWealthAfterTax, r.final.buyAfterTax);
  assert.equal(last.rentWealthAfterTax, r.final.rentAfterTax);
});

test("after mortgage payoff, owning cost excludes P&I", () => {
  const r = simulate({ ...DEFAULT_INPUTS, years: 30, amortization: 25 });
  const y26 = r.trajectory.find((p) => p.year === 26);
  assert.ok(y26, "year 26 should exist");
  assert.equal(y26.mortgageBalance, 0);
  assert.ok(
    y26.monthlyOwningCost < r.monthlyPayment,
    "post-payoff owning cost should not include full P&I",
  );
});

test("warnings when horizon exceeds amortization", () => {
  const r = simulate({ ...DEFAULT_INPUTS, years: 30, amortization: 25 });
  assert.ok(r.warnings.some((w) => /exceeds amortization/i.test(w.text)));
});
