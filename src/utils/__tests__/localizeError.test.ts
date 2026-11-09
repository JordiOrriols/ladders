import { describe, expect, it } from "vitest";
import { APP_LANGUAGES } from "@jordiorriols/ui";
import i18n from "@/i18n";
import { localizeError } from "../localizeError";

const errors = [
  ["Invalid login credentials", "invalidCredentials"],
  ["Email not confirmed", "emailNotConfirmed"],
  ["User already registered", "accountExists"],
  ["Password should be at least 8 characters", "password"],
  ["Weak password", "password"],
  ["Too many requests", "rateLimit"],
  ["JWT expired", "session"],
  ["Authentication is not configured", "configuration"],
  ["Failed to fetch", "network"],
  ["Save the member first", "saveMember"],
  ["invalid view link", "invalidLink"],
  ["user not found or cannot share team", "shareUser"],
  ["default team cannot be deleted", "defaultTeam"],
  ["team is not empty", "teamNotEmpty"],
  ["This account already has a member in the destination team", "memberTeamConflict"],
  ["Account already linked in the destination team", "memberTeamConflict"],
  ["Account already linked in a legacy member team", "memberTeamConflict"],
  ["Your account is already linked to a member of this team", "memberTeamConflict"],
  ["Recipient must first authenticate", "inviteRecipient"],
  ["This member is already linked to an account", "memberLinked"],
  ["Member invitation unavailable", "invitationUnavailable"],
  ["Workspace invitation unavailable", "invitationUnavailable"],
  ["members cannot move across team owners", "access"],
  ["progress must be between 0 and 100", "progress"],
  ["comment must contain 1 to 10000 characters", "comment"],
  ["Choose an existing competency comment", "chooseComment"],
  ["Team edit access required", "access"],
  ["Deletion is not allowed", "access"],
  ["Only the team owner can delete goals", "access"],
  ["Personal links cannot create goals", "access"],
] as const;

describe.each(APP_LANGUAGES.map(({ code }) => code))("localized errors: %s", (locale) => {
  const t = i18n.getFixedT(locale);

  it.each(errors)("translates %s", (message, key) => {
    expect(localizeError(new Error(message), t)).toBe(t(`errors.${key}`));
    expect(localizeError(message, t)).toBe(t(`errors.${key}`));
  });

  it("does not echo unexpected service details or user-entered content", () => {
    const message = "Unexpected backend failure for Ada's private goal";
    expect(localizeError(new Error(message), t)).toBe(t("errors.generic"));
    expect(localizeError({ message }, t)).toBe(t("errors.generic"));
    expect(localizeError(null, t)).toBe(t("errors.generic"));
  });
  it("explains workspace deletion protection and concurrent access conflicts", () => {
    expect(
      localizeError(new Error("Workspace is not empty. Remove its content from all apps first."), t)
    ).toBe(t("workspaceAccess.notEmpty"));
    expect(
      localizeError(new Error("Workspace access is busy. Retry after the current operation."), t)
    ).toBe(t("workspaceAccess.busy"));
  });

  it.each(["auth.passwordTooShort", "auth.passwordsDoNotMatch"])(
    "resolves the stable validation key %s in the current language",
    (key) => expect(localizeError(key, t)).toBe(t(key))
  );
});
