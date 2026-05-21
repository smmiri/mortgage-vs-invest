import test from "node:test";
import assert from "node:assert/strict";
import {
  PROVINCE_CODES,
  computeClosingCosts,
  computeGstHstOnNewHome,
  computeLandTransferTax,
  computePstOnCmhc,
} from "./closing-costs.js";

const approx = (a, b, tol = 1) =>
  assert.ok(
    Math.abs(a - b) <= tol,
    `expected ${a} ≈ ${b} (tolerance ${tol})`,
  );

// ---------------------------------------------------------------------------
// Land Transfer Tax — bracket math + first-time buyer programs
// ---------------------------------------------------------------------------

test("BC PTT: $1.05M, no FTB — 1% on first $200k + 2% on remainder", () => {
  // 200k × 1% = 2,000; (1.05M − 200k) × 2% = 17,000; total 19,000
  const r = computeLandTransferTax({ price: 1_050_000, province: "BC" });
  approx(r.total, 19_000);
});

test("BC PTT: FTB on $800k resale — full exemption (≤ $835k)", () => {
  const r = computeLandTransferTax({
    price: 800_000,
    province: "BC",
    firstTimeBuyer: true,
  });
  assert.equal(r.total, 0);
  assert.ok(r.lines.some((l) => l.includes("FTB")));
});

test("BC PTT: FTB on $847,500 — partial exemption (halfway through phase-out)", () => {
  const r = computeLandTransferTax({
    price: 847_500,
    province: "BC",
    firstTimeBuyer: true,
  });
  // Full at $835k = 200k×1% + (835k-200k)×2% = 2,000 + 12,700 = 14,700
  // Partial exemption at $847,500 = 14,700 × (860,000 − 847,500) / 25,000
  //                                = 14,700 × 12,500 / 25,000 = 7,350
  // Gross PTT at $847,500 = 2,000 + (847,500 - 200,000)*0.02 = 2,000 + 12,950 = 14,950
  // Net = 14,950 − 7,350 = 7,600
  approx(r.total, 7_600);
});

test("BC PTT: FTB on $900k — no exemption (price > $860k cap)", () => {
  const r = computeLandTransferTax({
    price: 900_000,
    province: "BC",
    firstTimeBuyer: true,
  });
  // Gross = 200k×1% + 700k×2% = 16,000
  approx(r.total, 16_000);
});

test("BC PTT: Newly Built Home Exemption — full at $1.0M", () => {
  const r = computeLandTransferTax({
    price: 1_000_000,
    province: "BC",
    newConstruction: true,
  });
  assert.equal(r.total, 0);
  assert.ok(r.lines.some((l) => l.includes("Newly Built")));
});

test("ON LTT: $1.05M — closed-form check", () => {
  const r = computeLandTransferTax({ price: 1_050_000, province: "ON" });
  // 55k×0.5% + 195k×1% + 150k×1.5% + 650k×2%
  // = 275 + 1,950 + 2,250 + 13,000 = 17,475
  approx(r.total, 17_475);
});

test("ON LTT: FTB caps rebate at $4,000", () => {
  const r = computeLandTransferTax({
    price: 1_050_000,
    province: "ON",
    firstTimeBuyer: true,
  });
  approx(r.total, 17_475 - 4_000);
});

test("Toronto MLTT: doubles tax at typical prices, with separate $4,475 FTB rebate", () => {
  const r = computeLandTransferTax({
    price: 1_050_000,
    province: "ON",
    firstTimeBuyer: true,
    includeTorontoLtt: true,
  });
  // Provincial: 17,475 - 4,000 = 13,475
  // Municipal: same brackets through $2M = 17,475 - 4,475 = 13,000
  approx(r.total, 13_475 + 13_000);
});

test("Alberta: no LTT", () => {
  const r = computeLandTransferTax({ price: 1_050_000, province: "AB" });
  assert.equal(r.total, 0);
});

test("PEI: FTB resale ≤ $200k is fully exempt", () => {
  const r = computeLandTransferTax({
    price: 180_000,
    province: "PE",
    firstTimeBuyer: true,
  });
  assert.equal(r.total, 0);
});

// ---------------------------------------------------------------------------
// GST / HST on new construction
// ---------------------------------------------------------------------------

test("GST/HST: resale (newConstruction=false) returns zero", () => {
  const r = computeGstHstOnNewHome({
    price: 1_050_000,
    province: "ON",
    newConstruction: false,
  });
  assert.equal(r.total, 0);
  assert.equal(r.applies, false);
});

test("Federal FTB GST Rebate: $1.0M new home — full GST refunded", () => {
  const r = computeGstHstOnNewHome({
    price: 1_000_000,
    province: "BC", // GST-only province; isolates federal math
    firstTimeBuyer: true,
    newConstruction: true,
  });
  // Federal GST = 50,000; rebate = 50,000 → net federal = 0
  approx(r.federalGross, 50_000);
  approx(r.federalRebate, 50_000);
  approx(r.total, 0);
});

test("Federal FTB GST Rebate: $1.25M — halfway through phase-out (50% rebate)", () => {
  const r = computeGstHstOnNewHome({
    price: 1_250_000,
    province: "BC",
    firstTimeBuyer: true,
    newConstruction: true,
  });
  // Federal GST = 62,500; rebate = 62,500 × (1.5M − 1.25M) / 500k = 31,250
  // Net federal = 31,250
  approx(r.federalGross, 62_500);
  approx(r.federalRebate, 31_250);
  approx(r.total, 31_250);
});

test("Federal FTB GST Rebate: $1.6M — no rebate (above $1.5M cap)", () => {
  const r = computeGstHstOnNewHome({
    price: 1_600_000,
    province: "BC",
    firstTimeBuyer: true,
    newConstruction: true,
  });
  // Federal GST = 80,000; rebate = 0
  approx(r.federalRebate, 0);
  approx(r.total, 80_000);
});

test("Federal standard rebate: $400k new home, non-FTB — half-way through standard phase-out", () => {
  const r = computeGstHstOnNewHome({
    price: 400_000,
    province: "AB",
    firstTimeBuyer: false,
    newConstruction: true,
  });
  // Federal GST = 20,000; full rebate at $350k = min(20k×0.36, 6,300) = 6,300
  // (capped at the $6,300 ceiling).
  // Half-phase at $400k = 6,300 × (450k − 400k) / 100k = 3,150
  // Net = 20,000 − 3,150 = 16,850
  approx(r.federalRebate, 3_150);
  approx(r.total, 16_850);
});

test("Federal rebate: $500k+ non-FTB — zero rebate", () => {
  const r = computeGstHstOnNewHome({
    price: 600_000,
    province: "AB",
    firstTimeBuyer: false,
    newConstruction: true,
  });
  approx(r.federalRebate, 0);
  approx(r.total, 30_000);
});

test("Ontario HST: provincial portion capped at $24,000 rebate", () => {
  const r = computeGstHstOnNewHome({
    price: 1_050_000,
    province: "ON",
    firstTimeBuyer: false,
    newConstruction: true,
  });
  // Federal GST = 52,500; standard rebate = 0 (price > $450k)
  // Provincial HST = 8% × 1.05M = 84,000; rebate = min(0.75 × 84k, 24k) = 24,000
  // Total = 52,500 + 84,000 − 24,000 = 112,500
  approx(r.federalGross, 52_500);
  approx(r.federalRebate, 0);
  approx(r.provincialGross, 84_000);
  approx(r.provincialRebate, 24_000);
  approx(r.total, 112_500);
});

test("Ontario HST + FTB: federal rebate kicks in too", () => {
  const r = computeGstHstOnNewHome({
    price: 1_050_000,
    province: "ON",
    firstTimeBuyer: true,
    newConstruction: true,
  });
  // Federal: GST 52,500; FTB rebate at $1.05M = 52,500 × (1.5M − 1.05M) / 500k = 47,250
  // Net federal = 5,250
  // Provincial: 84,000 − 24,000 = 60,000
  // Total = 5,250 + 60,000 = 65,250
  approx(r.federalRebate, 47_250);
  approx(r.provincialRebate, 24_000);
  approx(r.total, 65_250);
});

// ---------------------------------------------------------------------------
// PST on CMHC premium
// ---------------------------------------------------------------------------

test("PST on CMHC: Ontario charges 8%", () => {
  approx(computePstOnCmhc(24_990, "ON"), 24_990 * 0.08);
});

test("PST on CMHC: BC does not", () => {
  approx(computePstOnCmhc(24_990, "BC"), 0);
});

// ---------------------------------------------------------------------------
// Top-level roll-up
// ---------------------------------------------------------------------------

test("Roll-up: Ontario resale $1.05M, FTB, with Toronto MLTT", () => {
  const r = computeClosingCosts({
    price: 1_050_000,
    province: "ON",
    firstTimeBuyer: true,
    newConstruction: false,
    includeTorontoLtt: true,
    otherClosingCosts: 2_500,
    cmhcPremium: 24_990,
  });
  // LTT: provincial 13,475 + Toronto 13,000 = 26,475
  // GST: 0 (resale)
  // PST on CMHC: 24,990 × 0.08 = 1,999.20
  // Other: 2,500
  // Total ≈ 30,974
  approx(r.landTransferTax.total, 26_475);
  approx(r.gstHst.total, 0);
  approx(r.pstOnCmhc, 1_999.2);
  approx(r.other, 2_500);
  approx(r.total, 30_974, 2);
});

test("Roll-up: BC resale $800k, FTB — only `other` line non-zero", () => {
  const r = computeClosingCosts({
    price: 800_000,
    province: "BC",
    firstTimeBuyer: true,
    otherClosingCosts: 2_500,
  });
  approx(r.landTransferTax.total, 0);
  approx(r.gstHst.total, 0);
  approx(r.pstOnCmhc, 0);
  approx(r.total, 2_500);
});

test("All provinces parse without throwing", () => {
  for (const code of PROVINCE_CODES) {
    const r = computeClosingCosts({ price: 800_000, province: code });
    assert.ok(Number.isFinite(r.total), `province ${code} produced NaN total`);
  }
});
