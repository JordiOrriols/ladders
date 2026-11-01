import React from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelector as LanguageSelectorView } from "@jordiorriols/ui";

export function useHeaderLanguage() {
  const { t, i18n } = useTranslation();
  return {
    value: i18n.resolvedLanguage ?? i18n.language,
    onValueChange: (language: string) => void i18n.changeLanguage(language),
    label: t("header.language"),
    className: "inline-flex",
  };
}

export function LanguageSelector() {
  const language = useHeaderLanguage();
  return <LanguageSelectorView {...language} />;
}
