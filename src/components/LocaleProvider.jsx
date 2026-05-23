import { I18nextProvider } from "react-i18next";
import i18n from "../i18n/index.js";

export default function LocaleProvider({ children }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
