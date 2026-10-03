import React, { useState } from "react";
import { Cloud, LayoutGrid, Users, Share2 } from "@jordiorriols/ui/icons";
import { useTranslation } from "react-i18next";
import { LoginDialog } from "@/components/molecules/LoginDialog";
import { WelcomeScreen } from "@jordiorriols/ui";
import { useData } from "@/data/DataProvider";

export function WelcomePage() {
  const { t } = useTranslation();
  const { authEnabled } = useData();
  const [authMode, setAuthMode] = useState<"signIn" | "signUp" | null>(null);

  return (
    <WelcomeScreen
      brand={t("welcome.eyebrow")}
      icon={<LayoutGrid />}
      title={t("welcome.title")}
      description={t("welcome.description")}
      features={[
        { icon: <Users />, label: t("welcome.features.team") },
        { icon: <Cloud />, label: t("welcome.features.account") },
        { icon: <Share2 />, label: t("welcome.features.sharing") },
      ]}
      signInLabel={t("auth.signIn")}
      signUpLabel={t("auth.signUp")}
      disabled={!authEnabled}
      onSignIn={() => setAuthMode("signIn")}
      onSignUp={() => setAuthMode("signUp")}
      notice={!authEnabled && <p role="alert">{t("welcome.authUnavailable")}</p>}
    >
      <LoginDialog
        isOpen={authMode !== null}
        initialMode={authMode ?? "signIn"}
        onClose={() => setAuthMode(null)}
      />
    </WelcomeScreen>
  );
}
