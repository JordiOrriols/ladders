import React, { type ReactNode } from "react";
import { AppShell } from "@jordiorriols/ui";
import { useTranslation } from "react-i18next";
import { useAppHeaderProps } from "./molecules/Header";

export function AppLayout({
  children,
  navigation,
  mainClassName,
}: {
  children: ReactNode;
  navigation?: ReactNode;
  mainClassName?: string;
}) {
  const { t } = useTranslation();
  const header = useAppHeaderProps();
  return (
    <AppShell
      projectId="ladders"
      header={{ ...header, ...(navigation ? { navigation } : {}) }}
      footer={{ text: t("footer.attribution") }}
      {...(mainClassName ? { mainClassName } : {})}
    >
      {children}
    </AppShell>
  );
}
