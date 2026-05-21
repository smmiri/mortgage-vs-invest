import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_INPUTS } from "./defaults.js";
import {
  mergeSavedInputs,
  parseInputsCookieValue,
  serializeInputs,
  INPUTS_COOKIE_MAX_BYTES,
} from "./persist-inputs.js";

describe("persist-inputs", () => {
  it("mergeSavedInputs ignores unknown keys and invalid types", () => {
    const merged = mergeSavedInputs({
      propertyPrice: 900_000,
      mortgageRate: "bad",
      preExemption: "invalid",
      extra: 123,
    });
    assert.equal(merged.propertyPrice, 900_000);
    assert.equal(merged.mortgageRate, DEFAULT_INPUTS.mortgageRate);
    assert.equal(merged.preExemption, DEFAULT_INPUTS.preExemption);
    assert.equal(merged.extra, undefined);
  });

  it("mergeSavedInputs keeps valid booleans and enums", () => {
    const merged = mergeSavedInputs({
      firstTimeBuyer: true,
      closingCostsMode: "manual",
      preExemption: "partial",
      province: "BC",
    });
    assert.equal(merged.firstTimeBuyer, true);
    assert.equal(merged.closingCostsMode, "manual");
    assert.equal(merged.preExemption, "partial");
    assert.equal(merged.province, "BC");
  });

  it("round-trips through serialize and parse", () => {
    const custom = {
      ...DEFAULT_INPUTS,
      propertyPrice: 800_000,
      downPayment: 160_000,
      years: 15,
      modelExitTaxes: false,
    };
    const raw = serializeInputs(custom);
    assert.ok(raw.length < INPUTS_COOKIE_MAX_BYTES);
    const restored = parseInputsCookieValue(raw);
    assert.equal(restored.propertyPrice, 800_000);
    assert.equal(restored.downPayment, 160_000);
    assert.equal(restored.years, 15);
    assert.equal(restored.modelExitTaxes, false);
  });

  it("parseInputsCookieValue returns null for garbage", () => {
    assert.equal(parseInputsCookieValue(""), null);
    assert.equal(parseInputsCookieValue("%"), null);
    assert.equal(parseInputsCookieValue("not-json"), null);
  });
});
