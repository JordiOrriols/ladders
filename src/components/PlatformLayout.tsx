import React, { type ReactNode } from "react";
import { AppShell } from "@jordiorriols/ui";
import { useTranslation } from "react-i18next";
import { useHeaderLanguage } from "./molecules/LanguageSelector";

export function PlatformLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const language = useHeaderLanguage();
  return (
    <AppShell
      projectId="ladders"
      header={{ title: t("header.title"), subtitle: t("header.subtitle"), language }}
      footer={{ text: t("footer.attribution") }}
    >
      {children}
    </AppShell>
  );
}
