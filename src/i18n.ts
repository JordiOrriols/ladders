import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import es from "./locales/es.json";
import ca from "./locales/ca.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import it from "./locales/it.json";

const resources = {
  en: { translation: en },
  es: { translation: es },
  ca: { translation: ca },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
};

function updateDocumentLanguage() {
  if (typeof document !== "undefined") {
    document.documentElement.lang = i18n.resolvedLanguage ?? "en";
  }
}

i18n.on("languageChanged", updateDocumentLanguage);
i18n.on("initialized", updateDocumentLanguage);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: Object.keys(resources),
    nonExplicitSupportedLngs: true,
    fallbackLng: "en",
    ns: ["translation"],
    defaultNS: "translation",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
