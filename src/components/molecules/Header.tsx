import React, { type ReactNode } from "react";
import { AppIcon } from "@/components/atoms/AppIcon";
import { useTranslation } from "react-i18next";
import { AppHeader, AppAccountControls, getDisplayName } from "@jordiorriols/ui";
import { useData } from "@/data/DataProvider";
import { useAuthDialogProps } from "./LoginDialog";
import { useHeaderLanguage } from "./LanguageSelector";

export function useAppHeaderProps() {
  const { t } = useTranslation();
  const language = useHeaderLanguage();
  const { authEnabled, authError, user } = useData();
  const auth = useAuthDialogProps();
  return {
    projectSwitcherLabel: t("header.projectSwitcher"),
    title: t("header.title"),
    subtitle: t("header.subtitle"),
    language,
    actions: (
      <AppAccountControls
        {...auth}
        projectId="ladders"
        enabled={authEnabled}
        signedIn={!!user}
        authError={authError}
        signOutLabel={t("auth.signOut")}
        accountTitle={getDisplayName({
          accountName: user?.user_metadata?.["full_name"] ?? user?.user_metadata?.["name"],
          email: user?.email ?? "",
        })}
      />
    ),
  };
}

export function Header({ navigation }: { navigation?: ReactNode } = {}) {
  const header = useAppHeaderProps();
  return (
    <AppHeader
      projectId="ladders"
      {...header}
      icon={<AppIcon />}
      {...(navigation ? { navigation } : {})}
    />
  );
}
