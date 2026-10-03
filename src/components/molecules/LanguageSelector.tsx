import React from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelector as LanguageSelectorView } from "@jordiorriols/ui";

const LANGUAGES = [
  { code: "en", short: "EN", label: "English" },
  { code: "es", short: "ES", label: "Español" },
  { code: "ca", short: "CA", label: "Català" },
];

export function LanguageSelector() {
  const { t, i18n } = useTranslation();
  return (
    <LanguageSelectorView
      languages={LANGUAGES}
      value={i18n.language}
      onValueChange={(language) => void i18n.changeLanguage(language)}
      label={t("header.language")}
    />
  );
}
