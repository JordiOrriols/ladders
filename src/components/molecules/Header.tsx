import React, { useState } from "react";
import { LayoutGrid } from "@jordiorriols/ui/icons";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@jordiorriols/ui";
import { useAsyncAction } from "@jordiorriols/ui/hooks";
import { useData } from "@/data/DataProvider";
import { LoginDialog } from "./LoginDialog";
import { LanguageSelector } from "./LanguageSelector";

export function Header() {
  const { t } = useTranslation();
  const { authEnabled, user, signOut } = useData();
  const [showLogin, setShowLogin] = useState(false);
  const { run, busy, error } = useAsyncAction();
  return (
    <AppHeader
      title={t("header.title")}
      subtitle={t("header.subtitle")}
      icon={<LayoutGrid className="w-5 h-5 text-white" />}
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
              {error}
            </p>
          )}
        </>
      }
    >
      <LoginDialog isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </AppHeader>
  );
}
