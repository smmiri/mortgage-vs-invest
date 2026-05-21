import { useTranslation } from "react-i18next";
import { LOCALE_META, setStoredLocale } from "../lib/locale.js";

export default function LanguageToggle() {
  const { i18n, t } = useTranslation();

  const setLocale = (lng) => {
    setStoredLocale(lng);
    i18n.changeLanguage(lng);
  };

  return (
    <div
      role="group"
      aria-label={t("header.language")}
      className="inline-flex rounded-full border border-default bg-surface-card p-0.5 text-xs"
    >
      {(["en", "fa"]).map((lng) => {
        const active = i18n.language === lng;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => setLocale(lng)}
            aria-pressed={active}
            className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
              active
                ? "bg-indigo-600 text-white"
                : "text-muted hover:text-heading"
            }`}
          >
            {LOCALE_META[lng].label}
          </button>
        );
      })}
    </div>
  );
}
