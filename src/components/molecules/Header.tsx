import React, { useState } from "react";
import { LayoutGrid, LogIn, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useData } from "@/data/DataProvider";
import { Button } from "../ui/button";
import { LoginDialog } from "./LoginDialog";
import { LanguageSelector } from "./LanguageSelector";

export function Header() {
  const { t } = useTranslation();
  const { authEnabled, user, signOut } = useData();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40" data-testid="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3" data-testid="header-content">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800" data-testid="header-title">
                {t("header.title")}
              </h1>
              <p className="text-xs text-slate-500" data-testid="header-subtitle">
                {t("header.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />

            {authEnabled &&
              (user ? (
                <Button
                  eventId="header_sign_out"
                  variant="ghost"
                  size="sm"
                  onClick={() => void signOut()}
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
          </div>
        </div>
      </div>
      <LoginDialog isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </header>
  );
}
