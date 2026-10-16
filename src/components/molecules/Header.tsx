import React, { useState, type ReactNode } from "react";
import { AppIcon } from "@/components/atoms/AppIcon";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@jordiorriols/ui";
import { useAsyncAction } from "@jordiorriols/ui/hooks";
import { useData } from "@/data/DataProvider";
import { localizeError } from "@/utils/localizeError";
import { LoginDialog } from "./LoginDialog";
import { LanguageSelector } from "./LanguageSelector";

export function Header({ navigation }: { navigation?: ReactNode } = {}) {
  const { t } = useTranslation();
  const { authEnabled, user, signOut } = useData();
  const [showLogin, setShowLogin] = useState(false);
  const { run, busy, error } = useAsyncAction();
  return (
    <AppHeader
      projectId="ladders"
      projectSwitcherLabel={t("header.projectSwitcher")}
      title={t("header.title")}
      subtitle={t("header.subtitle")}
      icon={<AppIcon />}
      {...(navigation ? { navigation } : {})}
      {...(authEnabled
        ? {
            accountAction: {
              type: user ? "signOut" : "signIn",
              label: t(user ? "auth.signOut" : "auth.signIn"),
              disabled: busy,
              title: user?.email ?? "",
              onClick: user ? () => void run(signOut) : () => setShowLogin(true),
            },
          }
        : {})}
      actions={
        <>
          <LanguageSelector />
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {localizeError(error, t)}
            </p>
          )}
        </>
      }
    >
      <LoginDialog isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </AppHeader>
  );
}
