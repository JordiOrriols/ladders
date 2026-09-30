import React, { useState } from "react";
import { Cloud, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LoginDialog } from "@/components/molecules/LoginDialog";
import { Button } from "@/components/ui/button";
import { useData } from "@/data/DataProvider";

export function WelcomePage() {
  const { t } = useTranslation();
  const { authEnabled } = useData();
  const [authMode, setAuthMode] = useState<"signIn" | "signUp" | null>(null);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-xl">
        <header className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-semibold text-emerald-700">{t("welcome.eyebrow")}</p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            {t("welcome.title")}
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">{t("welcome.description")}</p>
        </header>

        <div>
          <section className="border-t-4 border-emerald-500 bg-white p-6 shadow-sm">
            <Cloud className="mb-5 h-6 w-6 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">{t("welcome.accountTitle")}</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
              {t("welcome.accountDescription")}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                eventId="welcome_sign_in"
                disabled={!authEnabled}
                onClick={() => setAuthMode("signIn")}
              >
                <LogIn className="h-4 w-4" />
                {t("auth.signIn")}
              </Button>
              <Button
                eventId="welcome_sign_up"
                variant="outline"
                disabled={!authEnabled}
                onClick={() => setAuthMode("signUp")}
              >
                {t("auth.signUp")}
              </Button>
            </div>
            {!authEnabled && (
              <p className="mt-3 text-xs text-amber-700">{t("welcome.authUnavailable")}</p>
            )}
          </section>
        </div>
      </div>

      <LoginDialog
        isOpen={authMode !== null}
        initialMode={authMode ?? "signIn"}
        onClose={() => setAuthMode(null)}
      />
    </main>
  );
}
