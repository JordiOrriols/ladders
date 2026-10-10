import React from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelector as LanguageSelectorView } from "@jordiorriols/ui";

export function LanguageSelector() {
  const { t, i18n } = useTranslation();
  return (
    <LanguageSelectorView
      value={i18n.language}
      onValueChange={(language) => void i18n.changeLanguage(language)}
      label={t("header.language")}
      className="inline-flex"
    />
  );
}
