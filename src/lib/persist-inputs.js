import { DEFAULT_INPUTS } from "./defaults.js";

/** First-party cookie storing calculator assumptions (JSON, URI-encoded). */
export const INPUTS_COOKIE_NAME = "rvb_inputs";
export const INPUTS_COOKIE_MAX_AGE_DAYS = 365;
/** Stay under typical 4KB cookie limit with margin. */
export const INPUTS_COOKIE_MAX_BYTES = 3800;

const STRING_FIELDS = {
  preExemption: new Set(["full", "partial", "none"]),
  closingCostsMode: new Set(["auto", "manual"]),
  province: null, // any non-empty string up to 8 chars
};

/**
 * Merge saved values onto defaults, keeping only known keys with valid types.
 */
export function mergeSavedInputs(saved, defaults = DEFAULT_INPUTS) {
  if (!saved || typeof saved !== "object") return { ...defaults };

  const out = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (!(key in saved)) continue;
    const value = saved[key];
    const expected = defaults[key];

    if (typeof expected === "boolean") {
      if (typeof value === "boolean") out[key] = value;
      continue;
    }
    if (typeof expected === "number") {
      if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
      continue;
    }
    if (typeof expected === "string") {
      if (typeof value !== "string") continue;
      const allowed = STRING_FIELDS[key];
      if (allowed && !allowed.has(value)) continue;
      if (key === "province" && (value.length < 2 || value.length > 8)) continue;
      out[key] = value;
    }
  }
  return out;
}

export function serializeInputs(inputs) {
  const payload = {};
  for (const key of Object.keys(DEFAULT_INPUTS)) {
    payload[key] = inputs[key];
  }
  return encodeURIComponent(JSON.stringify(payload));
}

/**
 * Parse a raw cookie value (already the value for INPUTS_COOKIE_NAME, not full document.cookie).
 */
export function parseInputsCookieValue(raw, defaults = DEFAULT_INPUTS) {
  if (!raw || typeof raw !== "string") return null;
  try {
    const json = decodeURIComponent(raw.trim());
    if (json.length > INPUTS_COOKIE_MAX_BYTES) return null;
    const saved = JSON.parse(json);
    return mergeSavedInputs(saved, defaults);
  } catch {
    return null;
  }
}

export function readCookieValue(name) {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    if (part.startsWith(prefix)) return part.slice(prefix.length);
  }
  return null;
}

export function loadInputsFromCookie(defaults = DEFAULT_INPUTS) {
  const raw = readCookieValue(INPUTS_COOKIE_NAME);
  return parseInputsCookieValue(raw, defaults);
}

export function writeInputsToCookie(inputs) {
  if (typeof document === "undefined") return false;
  const encoded = serializeInputs(inputs);
  if (encoded.length > INPUTS_COOKIE_MAX_BYTES) return false;

  const maxAge = INPUTS_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  const secure = typeof location !== "undefined" && location.protocol === "https:";
  let cookie = `${INPUTS_COOKIE_NAME}=${encoded}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  if (secure) cookie += "; Secure";
  document.cookie = cookie;
  return true;
}

export function clearInputsCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${INPUTS_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}
