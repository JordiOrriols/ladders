import React from "react";
import { useTranslation } from "react-i18next";
import { LoginDialog as LoginDialogView } from "@jordiorriols/ui";
import { useLoginForm } from "@jordiorriols/ui/hooks";
import { useData } from "@/data/DataProvider";
import { localizeError } from "@/utils/localizeError";

export function useAuthDialogProps() {
  const { t } = useTranslation();
  const actions = useData();
  return {
    actions,
    messages: {
      passwordResetSent: t("auth.passwordResetSent"),
      checkEmail: t("auth.checkEmail"),
    },
    formatError: (message: string) => localizeError(message, t),
    labels: {
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
    },
  };
}

export function LoginDialog(props: {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signIn" | "signUp";
}) {
  const config = useAuthDialogProps();
  const { t } = useTranslation();
  const form = useLoginForm({
    ...props,
    actions: config.actions,
    messages: { passwordResetSent: "auth.passwordResetSent", checkEmail: "auth.checkEmail" },
  });
  return (
    <LoginDialogView
      isOpen={props.isOpen}
      onClose={props.onClose}
      labels={config.labels}
      form={{
        ...form,
        error: form.error === null ? null : config.formatError(form.error),
        info: form.info === null ? null : t(form.info),
      }}
    />
  );
}
