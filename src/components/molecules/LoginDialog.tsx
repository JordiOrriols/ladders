import React, { useEffect, useState } from "react";
import { Github } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useData } from "@/data/DataProvider";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signIn" | "signUp";
};

type AuthMode = "signIn" | "signUp" | "forgotPassword";

export function LoginDialog({ isOpen, onClose, initialMode = "signIn" }: Props) {
  const { t } = useTranslation();
  const { signIn, signInWithGitHub, signUp, requestPasswordReset } = useData();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setError(null);
    setInfo(null);
    setPassword("");
  }, [initialMode, isOpen]);

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setInfo(null);
    setPassword("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "forgotPassword") {
        await requestPasswordReset(email);
        setInfo(t("auth.passwordResetSent"));
      } else if (mode === "signIn") {
        await signIn(email, password);
        onClose();
      } else {
        const { needsConfirmation } = await signUp(email, password);
        if (needsConfirmation) setInfo(t("auth.checkEmail"));
        else onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGitHub = async () => {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await signInWithGitHub();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                mode === "signIn"
                  ? "auth.signInTitle"
                  : mode === "signUp"
                    ? "auth.signUpTitle"
                    : "auth.forgotPasswordTitle"
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(mode === "forgotPassword" ? "auth.forgotPasswordDescription" : "auth.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {mode !== "forgotPassword" && (
            <Button
              eventId="auth_github"
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void handleGitHub()}
              className="w-full"
            >
              <Github className="h-4 w-4" />
              {t("auth.continueWithGitHub")}
            </Button>
          )}
          <div className="space-y-3">
            <div>
              <Label htmlFor="login-email">{t("auth.email")}</Label>
              <Input
                id="login-email"
                data-testid="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            {mode !== "forgotPassword" && (
              <div>
                <Label htmlFor="login-password">{t("auth.password")}</Label>
                <Input
                  id="login-password"
                  data-testid="login-password"
                  type="password"
                  autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
            {error && (
              <p role="alert" data-testid="login-error" className="text-sm text-red-600">
                {error}
              </p>
            )}
            {info && (
              <p className="text-sm text-emerald-700" data-testid="login-info">
                {info}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {mode === "signIn" && (
                <button
                  type="button"
                  onClick={() => changeMode("forgotPassword")}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  {t("auth.forgotPassword")}
                </button>
              )}
              <button
                type="button"
                onClick={() => changeMode(mode === "signIn" ? "signUp" : "signIn")}
                className="text-xs text-indigo-600 hover:underline"
              >
                {t(
                  mode === "signIn"
                    ? "auth.switchToSignUp"
                    : mode === "signUp"
                      ? "auth.switchToSignIn"
                      : "auth.backToSignIn"
                )}
              </button>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">{t("buttons.cancel")}</AlertDialogCancel>
            <Button
              eventId={`auth_${mode}`}
              data-testid="login-submit"
              type="submit"
              disabled={busy}
            >
              {t(
                mode === "signIn"
                  ? "auth.signIn"
                  : mode === "signUp"
                    ? "auth.signUp"
                    : "auth.sendResetEmail"
              )}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
