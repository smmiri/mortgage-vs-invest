import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FIELD_META } from "../lib/defaults.js";

/** FIELD_META with translated label and help for the active locale. */
export function useFieldMeta() {
  const { t, i18n } = useTranslation("fields");

  return useMemo(() => {
    const out = {};
    for (const [name, meta] of Object.entries(FIELD_META)) {
      out[name] = {
        ...meta,
        label: t(`${name}.label`, { defaultValue: meta.label }),
        help: t(`${name}.help`, { defaultValue: meta.help }),
      };
    }
    return out;
  }, [t, i18n.language]);
}
