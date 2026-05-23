// Closing-cost math for Canadian real estate.
//
// Two large items dominate the cash a buyer hands over at closing:
//
//   1. Property / Land Transfer Tax (LTT, PTT, "welcome tax", "mutation tax").
//      Province-specific brackets; major provinces have a first-time buyer
//      rebate or exemption.
//
//   2. GST / HST on new construction (resale homes are exempt). The federal
//      government's GST New Housing Rebate refunds part of the federal 5%
//      GST. The 2025 First-Time Home Buyer GST Rebate raised the cap from
//      $450k to $1.5M for FTBs. Some provinces also rebate part of the
//      provincial portion of HST.
//
// Plus smaller items (legal fees, title insurance, inspection, PST on CMHC)
// captured as `otherClosingCosts`.
//
// Sources
//   - CRA RC4028 — GST/HST New Housing Rebate (federal):
//     https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4028.html
//     (linked from https://www.canada.ca/en/services/benefits/housing.html)
//   - 2025 Federal First-Time Home Buyer GST Rebate.
//   - BC Property Transfer Tax + post-April-2024 FTB / Newly Built exemption
//     thresholds.
//   - Ontario Land Transfer Tax + Toronto Municipal Land Transfer Tax + FTB
//     rebates ($4,000 ON, $4,475 Toronto).
//   - Quebec Loi sur les droits sur les mutations immobilières + Montréal
//     surtaxes.
//
// These numbers are model estimates as of mid-2025. They change with
// provincial budgets and indexing. Treat as a starting point — confirm with
// a real-estate lawyer before signing.

export const PROVINCES = {
  BC: { name: "British Columbia", hasHST: false, taxRegime: "GST" },
  AB: { name: "Alberta", hasHST: false, taxRegime: "GST" },
  SK: { name: "Saskatchewan", hasHST: false, taxRegime: "GST" },
  MB: { name: "Manitoba", hasHST: false, taxRegime: "GST" },
  ON: { name: "Ontario", hasHST: true, taxRegime: "HST", provincialHstRate: 0.08 },
  QC: { name: "Quebec", hasHST: false, taxRegime: "GST_QST" },
  NB: { name: "New Brunswick", hasHST: true, taxRegime: "HST", provincialHstRate: 0.10 },
  NS: { name: "Nova Scotia", hasHST: true, taxRegime: "HST", provincialHstRate: 0.10 },
  NL: { name: "Newfoundland & Labrador", hasHST: true, taxRegime: "HST", provincialHstRate: 0.10 },
  PE: { name: "Prince Edward Island", hasHST: true, taxRegime: "HST", provincialHstRate: 0.10 },
  YT: { name: "Yukon", hasHST: false, taxRegime: "GST" },
  NT: { name: "Northwest Territories", hasHST: false, taxRegime: "GST" },
  NU: { name: "Nunavut", hasHST: false, taxRegime: "GST" },
};

export const PROVINCE_CODES = Object.keys(PROVINCES);

// ---------------------------------------------------------------------------
// Land Transfer Tax (LTT, PTT, welcome tax). Bracket arrays are
// [threshold, rate] pairs interpreted as marginal rates on the portion of
// price within that bracket.
// ---------------------------------------------------------------------------

const LTT_BRACKETS = {
  BC: [
    [200_000, 0.01],
    [2_000_000, 0.02],
    [3_000_000, 0.03],
    [Infinity, 0.05], // 3% + 2% additional residential surtax
  ],
  ON: [
    [55_000, 0.005],
    [250_000, 0.01],
    [400_000, 0.015],
    [2_000_000, 0.02],
    [Infinity, 0.025],
  ],
  // Toronto MLTT — same as ON up to $2M, escalating thereafter for luxury.
  // Brackets > $3M ignored for typical scenarios but kept for completeness.
  TORONTO_MLTT: [
    [55_000, 0.005],
    [250_000, 0.01],
    [400_000, 0.015],
    [2_000_000, 0.02],
    [3_000_000, 0.025],
    [4_000_000, 0.035],
    [5_000_000, 0.045],
    [10_000_000, 0.055],
    [20_000_000, 0.065],
    [Infinity, 0.075],
  ],
  // Quebec provincial baseline; municipalities may add brackets above. We
  // approximate Montreal extras separately below.
  QC: [
    [58_900, 0.005],
    [294_600, 0.01],
    [500_000, 0.015],
    [1_000_000, 0.02],
    [Infinity, 0.025],
  ],
  MB: [
    [30_000, 0],
    [90_000, 0.005],
    [150_000, 0.01],
    [200_000, 0.015],
    [Infinity, 0.02],
  ],
  // Flat-rate provinces.
  NB: [[Infinity, 0.01]],
  NS: [[Infinity, 0.015]],
  NL: [[Infinity, 0.004]],
  PE: [[Infinity, 0.01]],
  // Effectively zero (small registration fees only — modeled as 0%).
  AB: [[Infinity, 0]],
  SK: [[Infinity, 0]],
  YT: [[Infinity, 0]],
  NT: [[Infinity, 0]],
  NU: [[Infinity, 0]],
};

// Montreal welcome-tax extra brackets (in addition to provincial baseline,
// not on top — they override above their threshold). Indexed annually.
const MONTREAL_LTT = [
  [58_900, 0.005],
  [294_600, 0.01],
  [500_000, 0.015],
  [1_000_000, 0.02],
  [2_059_900, 0.025],
  [Infinity, 0.035],
];

function bracketedTax(price, brackets) {
  if (price <= 0) return 0;
  let owed = 0;
  let prev = 0;
  for (const [threshold, rate] of brackets) {
    if (price <= threshold) {
      owed += (price - prev) * rate;
      return owed;
    }
    owed += (threshold - prev) * rate;
    prev = threshold;
  }
  return owed;
}

/**
 * Compute land transfer tax (PTT / LTT / welcome tax) for a price + province.
 *
 * Returns {
 *   provincialGross, provincialRebate, provincialNet,
 *   municipalGross, municipalRebate, municipalNet,
 *   total, lines: string[]
 * }
 *
 * BC: full FTB exemption for resale ≤ $835k, partial to $860k.
 *     Newly built exemption full ≤ $1.1M, partial to $1.15M.
 * ON: $4,000 FTB rebate (full LTT on first ~$368k).
 * Toronto MLTT (when includeTorontoLtt): $4,475 FTB rebate.
 * PE: full FTB exemption ≤ $200k. No other province-level FTB programs
 *     consequential at typical prices.
 */
export function computeLandTransferTax({
  price,
  province,
  firstTimeBuyer = false,
  newConstruction = false,
  includeTorontoLtt = false,
}) {
  if (!Number.isFinite(price) || price <= 0 || !LTT_BRACKETS[province]) {
    return emptyLtt();
  }

  let provincialGross = bracketedTax(price, LTT_BRACKETS[province]);
  let provincialRebate = 0;
  const lineKeys = [];

  if (province === "BC") {
    // FTB exemption (resale or new) — full <= $835k, partial to $860k.
    if (firstTimeBuyer) {
      if (price <= 835_000) {
        provincialRebate = provincialGross;
        lineKeys.push("bcFtbFull");
      } else if (price <= 860_000) {
        const fullAtThreshold = bracketedTax(835_000, LTT_BRACKETS.BC);
        provincialRebate = Math.max(
          0,
          (fullAtThreshold * (860_000 - price)) / 25_000,
        );
        lineKeys.push("bcFtbPartial");
      }
    }
    // Newly Built Home exemption (residential) — full <= $1.1M, partial to $1.15M.
    // Apply whichever produces the larger rebate.
    if (newConstruction) {
      let nbRebate = 0;
      if (price <= 1_100_000) {
        nbRebate = provincialGross;
      } else if (price <= 1_150_000) {
        const fullAtThreshold = bracketedTax(1_100_000, LTT_BRACKETS.BC);
        nbRebate = (fullAtThreshold * (1_150_000 - price)) / 50_000;
      }
      if (nbRebate > provincialRebate) {
        provincialRebate = nbRebate;
        lineKeys.push("bcNewlyBuilt");
      }
    }
  } else if (province === "ON") {
    if (firstTimeBuyer) {
      provincialRebate = Math.min(provincialGross, 4_000);
      lineKeys.push("onFtbRefund");
    }
  } else if (province === "QC") {
    // Montreal welcome tax is a city-only surtax. We approximate by treating
    // Toronto-like "includeTorontoLtt" flag as a Montreal flag for QC. This
    // is a UX shortcut; if you live in another QC municipality with extras,
    // override in manual mode.
    if (includeTorontoLtt) {
      provincialGross = bracketedTax(price, MONTREAL_LTT);
      lineKeys.push("qcMontreal");
    } else {
      lineKeys.push("qcProvincial");
    }
  } else if (province === "PE") {
    if (firstTimeBuyer && price <= 200_000) {
      provincialRebate = provincialGross;
      lineKeys.push("peiFtb");
    }
  }

  // Toronto Municipal Land Transfer Tax — opt-in for Ontario buyers.
  let municipalGross = 0;
  let municipalRebate = 0;
  if (province === "ON" && includeTorontoLtt) {
    municipalGross = bracketedTax(price, LTT_BRACKETS.TORONTO_MLTT);
    if (firstTimeBuyer) {
      municipalRebate = Math.min(municipalGross, 4_475);
      lineKeys.push("torontoFtb");
    } else {
      lineKeys.push("torontoMltt");
    }
  }

  const provincialNet = Math.max(0, provincialGross - provincialRebate);
  const municipalNet = Math.max(0, municipalGross - municipalRebate);
  return {
    provincialGross,
    provincialRebate,
    provincialNet,
    municipalGross,
    municipalRebate,
    municipalNet,
    total: provincialNet + municipalNet,
    lineKeys,
  };
}

function emptyLtt() {
  return {
    provincialGross: 0,
    provincialRebate: 0,
    provincialNet: 0,
    municipalGross: 0,
    municipalRebate: 0,
    municipalNet: 0,
    total: 0,
    lineKeys: [],
  };
}

/** i18n key under closing.lttLabel.* */
export function lttLabelKey(province) {
  if (province === "BC" || province === "ON" || province === "QC") return `lttLabel.${province}`;
  return "lttLabel.default";
}

// ---------------------------------------------------------------------------
// GST / HST on new construction + rebates.
// ---------------------------------------------------------------------------

const FEDERAL_GST_RATE = 0.05;

/**
 * Federal GST New Housing Rebate (standard / non-FTB).
 * 36% of GST on homes ≤ $350,000 (= max $6,300), linear phase to $0 at $450k.
 * See CRA RC4028. Applies to owner-occupied principal residences.
 */
function federalStandardRebate(price) {
  if (price <= 0) return 0;
  const federalGst = price * FEDERAL_GST_RATE;
  const fullRebate = Math.min(federalGst * 0.36, 6_300);
  if (price <= 350_000) return fullRebate;
  if (price <= 450_000) return (fullRebate * (450_000 - price)) / 100_000;
  return 0;
}

/**
 * 2025 First-Time Home Buyer GST Rebate (federal).
 * 100% refund of federal GST on new homes ≤ $1,000,000; linear phase-out to
 * $0 at $1,500,000. Eligible buyers must be FTBs (similar definition to the
 * FHSA / HBP programs) and the home must be a principal residence.
 */
function federalFtbRebate(price) {
  if (price <= 0) return 0;
  const federalGst = price * FEDERAL_GST_RATE;
  if (price <= 1_000_000) return federalGst;
  if (price <= 1_500_000) return (federalGst * (1_500_000 - price)) / 500_000;
  return 0;
}

/**
 * Provincial portion of HST rebate, where applicable.
 *
 * Ontario:   75% of provincial portion (8% × price), capped at $24,000.
 *            Available regardless of price (just capped).
 * PEI:       50% of provincial portion (10% × price), capped at $9,000 on
 *            first $190k of price.
 * Nova Scotia: 18.75% of provincial portion, capped at $3,000 (only on first
 *            $400k).
 * NB / NL:   36% of provincial portion, capped at $6,300.
 *
 * Quebec QST has a separate rebate via Revenu Québec; modeled below.
 */
function provincialHstRebate(price, province, provincialGross) {
  if (provincialGross <= 0) return 0;
  if (province === "ON") return Math.min(provincialGross * 0.75, 24_000);
  if (province === "PE") {
    const eligible = Math.min(price, 190_000);
    return Math.min(eligible * 0.10 * 0.5, 9_000);
  }
  if (province === "NS") {
    const eligible = Math.min(price, 400_000);
    return Math.min(eligible * 0.10 * 0.1875, 3_000);
  }
  if (province === "NB" || province === "NL") {
    return Math.min(provincialGross * 0.36, 6_300);
  }
  return 0;
}

/**
 * Quebec QST New Housing Rebate. Approximation of the Revenu Québec scheme:
 * 50% of QST refunded on homes ≤ $200,000, phased to $0 at $300,000.
 */
function qstRebate(price, qstGross) {
  if (qstGross <= 0) return 0;
  if (price <= 200_000) return qstGross * 0.5;
  if (price <= 300_000) return (qstGross * 0.5 * (300_000 - price)) / 100_000;
  return 0;
}

/**
 * Compute net GST / HST owed on a new-construction home.
 *
 * Returns {
 *   applies, federalGross, federalRebate,
 *   provincialGross, provincialRebate, qstGross, qstRebate,
 *   total, lines: string[]
 * }
 *
 * Returns all zeros for resale (newConstruction = false).
 */
export function computeGstHstOnNewHome({
  price,
  province,
  firstTimeBuyer = false,
  newConstruction = false,
}) {
  if (!newConstruction || !PROVINCES[province] || !Number.isFinite(price) || price <= 0) {
    return emptyGst();
  }

  const lineKeys = [];
  const federalGross = price * FEDERAL_GST_RATE;
  let federalRebate = federalStandardRebate(price);
  if (firstTimeBuyer) {
    const ftbRebate = federalFtbRebate(price);
    if (ftbRebate > federalRebate) {
      federalRebate = ftbRebate;
      lineKeys.push("gstFtb2025");
    }
  }
  if (federalRebate > 0 && !lineKeys.length) lineKeys.push("gstStandard");

  let provincialGross = 0;
  let provincialRebate = 0;
  let qstGross = 0;
  let qstRebateAmount = 0;

  const prov = PROVINCES[province];
  if (prov.hasHST) {
    provincialGross = price * prov.provincialHstRate;
    provincialRebate = provincialHstRebate(price, province, provincialGross);
    if (provincialRebate > 0) lineKeys.push("provincialNewHousing");
  } else if (prov.taxRegime === "GST_QST") {
    qstGross = price * 0.09975;
    qstRebateAmount = qstRebate(price, qstGross);
    if (qstRebateAmount > 0) lineKeys.push("qcQstRebate");
  }

  const total =
    federalGross - federalRebate +
    provincialGross - provincialRebate +
    qstGross - qstRebateAmount;

  return {
    applies: true,
    federalGross,
    federalRebate,
    provincialGross,
    provincialRebate,
    qstGross,
    qstRebate: qstRebateAmount,
    total: Math.max(0, total),
    lineKeys,
    provincialNewHousingProvince: province,
  };
}

function emptyGst() {
  return {
    applies: false,
    federalGross: 0,
    federalRebate: 0,
    provincialGross: 0,
    provincialRebate: 0,
    qstGross: 0,
    qstRebate: 0,
    total: 0,
    lineKeys: [],
    provincialNewHousingProvince: null,
  };
}

// ---------------------------------------------------------------------------
// PST on CMHC premium. ON / QC / SK / MB charge provincial sales tax on the
// CMHC premium (rolled into the mortgage but PST itself is paid in cash at
// closing). Other provinces do not.
// ---------------------------------------------------------------------------

const PST_ON_CMHC = {
  ON: 0.08,
  QC: 0.09975,
  SK: 0.06,
  MB: 0.07,
};

export function computePstOnCmhc(cmhcPremium, province) {
  if (!cmhcPremium || cmhcPremium <= 0) return 0;
  const rate = PST_ON_CMHC[province] || 0;
  return cmhcPremium * rate;
}

// ---------------------------------------------------------------------------
// Top-level closing-cost roll-up.
// ---------------------------------------------------------------------------

/**
 * Compute the buyer's cash-to-close breakdown.
 *
 * inputs (all optional except `price`):
 *   price             — property price
 *   province          — code from PROVINCES, default "ON"
 *   firstTimeBuyer    — bool
 *   newConstruction   — bool (gates GST/HST)
 *   includeTorontoLtt — adds Toronto MLTT (or Montreal extras in QC)
 *   otherClosingCosts — flat dollar amount for legal/title/inspection/etc.
 *   cmhcPremium       — for computing PST on CMHC where applicable
 *
 * Returns {
 *   landTransferTax, gstHst, pstOnCmhc, other, total,
 *   breakdown: Array<{ label, amount, sublabel? }>
 * }
 */
export function computeClosingCosts({
  price,
  province = "ON",
  firstTimeBuyer = false,
  newConstruction = false,
  includeTorontoLtt = false,
  otherClosingCosts = 2_500,
  cmhcPremium = 0,
}) {
  const ltt = computeLandTransferTax({ price, province, firstTimeBuyer, newConstruction, includeTorontoLtt });
  const gst = computeGstHstOnNewHome({ price, province, firstTimeBuyer, newConstruction });
  const pstOnCmhc = computePstOnCmhc(cmhcPremium, province);
  const other = Math.max(0, otherClosingCosts || 0);
  const total = ltt.total + gst.total + pstOnCmhc + other;

  const breakdown = [];
  if (ltt.provincialGross > 0 || ltt.municipalGross > 0) {
    breakdown.push({
      labelKey: lttLabelKey(province),
      amount: ltt.total,
      lineKeys: ltt.lineKeys,
      sublabelKey: ltt.lineKeys.length ? null : "lttSchedule",
      sublabelParams: { province },
      detail: {
        provincialGross: ltt.provincialGross,
        provincialRebate: ltt.provincialRebate,
        municipalGross: ltt.municipalGross,
        municipalRebate: ltt.municipalRebate,
      },
    });
  } else {
    breakdown.push({
      labelKey: lttLabelKey(province),
      amount: 0,
      sublabelKey: "noProvincialLtt",
      sublabelParams: { province },
    });
  }
  if (gst.applies) {
    breakdown.push({
      labelKey: "gstHst",
      amount: gst.total,
      lineKeys: gst.lineKeys,
      sublabelKey: gst.lineKeys.length ? null : "netOfRebates",
      sublabelParams:
        gst.lineKeys.includes("provincialNewHousing") && gst.provincialNewHousingProvince
          ? { province: gst.provincialNewHousingProvince }
          : undefined,
      detail: {
        federalGross: gst.federalGross,
        federalRebate: gst.federalRebate,
        provincialGross: gst.provincialGross,
        provincialRebate: gst.provincialRebate,
        qstGross: gst.qstGross,
        qstRebate: gst.qstRebate,
      },
    });
  }
  if (pstOnCmhc > 0) {
    breakdown.push({
      labelKey: "pstCmhc",
      amount: pstOnCmhc,
      sublabelKey: "pstCmhcSub",
      sublabelParams: { province },
    });
  }
  if (other > 0) {
    breakdown.push({
      labelKey: "legalTitle",
      amount: other,
      sublabelKey: "legalSub",
    });
  }
  return { landTransferTax: ltt, gstHst: gst, pstOnCmhc, other, total, breakdown };
}
