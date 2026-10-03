import React, { useState } from "react";
import { LayoutGrid, LogIn, LogOut } from "@jordiorriols/ui/icons";
import { useTranslation } from "react-i18next";
import { AppHeader, Button } from "@jordiorriols/ui";
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
      actions={
        <>
          <LanguageSelector />
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          {authEnabled &&
            (user ? (
              <Button
                eventId="header_sign_out"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => void run(signOut)}
                title={user.email ?? ""}
                data-testid="sign-out-button"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden md:inline">{t("auth.signOut")}</span>
              </Button>
            ) : (
              <Button
                eventId="header_sign_in"
                variant="outline"
                size="sm"
                onClick={() => setShowLogin(true)}
                data-testid="sign-in-button"
              >
                <LogIn className="w-4 h-4 mr-1" />
                {t("auth.signIn")}
              </Button>
            ))}
        </>
      }
    >
      <LoginDialog isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </AppHeader>
  );
}
