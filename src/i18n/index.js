import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { applyDocumentLocale, getStoredLocale, LOCALE_STORAGE_KEY } from "../lib/locale.js";

import enCommon from "./en/common.json";
import enFields from "./en/fields.json";
import enWarnings from "./en/warnings.json";
import enClosing from "./en/closing.json";
import enLegal from "./en/legal.json";
import enProvinces from "./en/provinces.json";

import faCommon from "./fa/common.json";
import faFields from "./fa/fields.json";
import faWarnings from "./fa/warnings.json";
import faClosing from "./fa/closing.json";
import faLegal from "./fa/legal.json";
import faProvinces from "./fa/provinces.json";

const resources = {
  en: {
    common: enCommon,
    fields: enFields,
    warnings: enWarnings,
    closing: enClosing,
    legal: enLegal,
    provinces: enProvinces,
  },
  fa: {
    common: faCommon,
    fields: faFields,
    warnings: faWarnings,
    closing: faClosing,
    legal: faLegal,
    provinces: faProvinces,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "fa"],
    ns: ["common", "fields", "warnings", "closing", "legal", "provinces"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      caches: ["localStorage"],
    },
    lng: getStoredLocale(),
  });

applyDocumentLocale(getStoredLocale());

i18n.on("languageChanged", (lng) => {
  applyDocumentLocale(lng);
});

export default i18n;
