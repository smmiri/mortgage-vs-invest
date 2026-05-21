export const LOCALE_STORAGE_KEY = "rvb_locale";

export const SUPPORTED_LOCALES = ["en", "fa"];

export const LOCALE_META = {
  en: { label: "English", dir: "ltr", htmlLang: "en-CA" },
  fa: { label: "فارسی", dir: "rtl", htmlLang: "fa" },
};

export function normalizeLocale(value) {
  if (value === "fa" || value === "en") return value;
  return "en";
}

export function getStoredLocale() {
  if (typeof localStorage === "undefined") return "en";
  return normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
}

export function setStoredLocale(locale) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(LOCALE_STORAGE_KEY, normalizeLocale(locale));
}

export function applyDocumentLocale(locale) {
  const meta = LOCALE_META[normalizeLocale(locale)];
  const root = document.documentElement;
  root.lang = meta.htmlLang;
  root.dir = meta.dir;
  root.dataset.locale = normalizeLocale(locale);
}
