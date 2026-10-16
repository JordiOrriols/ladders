import React from "react";
import { useTranslation } from "react-i18next";
import { LoginDialog as LoginDialogView } from "@jordiorriols/ui";
import { useLoginForm } from "@jordiorriols/ui/hooks";
import { useData } from "@/data/DataProvider";
import { localizeError } from "@/utils/localizeError";

export function LoginDialog({
  isOpen,
  onClose,
  initialMode = "signIn",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signIn" | "signUp";
}) {
  const { t } = useTranslation();
  const actions = useData();
  const form = useLoginForm({
    isOpen,
    onClose,
    initialMode,
    actions,
    messages: {
      passwordResetSent: "auth.passwordResetSent",
      checkEmail: "auth.checkEmail",
    },
  });
  return (
    <LoginDialogView
      isOpen={isOpen}
      onClose={onClose}
      form={{
        ...form,
        error: form.error ? localizeError(form.error, t) : null,
        info: form.info ? t(form.info) : null,
      }}
      labels={{
        signInTitle: t("auth.signInTitle"),
        signUpTitle: t("auth.signUpTitle"),
        forgotPasswordTitle: t("auth.forgotPasswordTitle"),
        description: t("auth.description"),
        forgotPasswordDescription: t("auth.forgotPasswordDescription"),
        continueWithGitHub: t("auth.continueWithGitHub"),
        email: t("auth.email"),
        password: t("auth.password"),
        forgotPassword: t("auth.forgotPassword"),
        switchToSignUp: t("auth.switchToSignUp"),
        switchToSignIn: t("auth.switchToSignIn"),
        backToSignIn: t("auth.backToSignIn"),
        cancel: t("buttons.cancel"),
        signIn: t("auth.signIn"),
        signUp: t("auth.signUp"),
        sendResetEmail: t("auth.sendResetEmail"),
      }}
    />
  );
}
