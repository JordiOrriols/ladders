import type { TFunction } from "i18next";

const messages: [RegExp, string][] = [
  [/invalid login credentials|invalid_credentials|invalid_grant/i, "invalidCredentials"],
  [/email not confirmed/i, "emailNotConfirmed"],
  [/already registered|already been registered|user_already_exists/i, "accountExists"],
  [/weak_password|password.*(?:short|least|weak)|same_password/i, "password"],
  [/rate.limit|too many requests|after \d+ seconds/i, "rateLimit"],
  [/session.*(?:expired|missing)|refresh.token|jwt expired|authentication required/i, "session"],
  [/not configured|configured backend/i, "configuration"],
  [/network|fetch|offline/i, "network"],
  [/save the member first/i, "saveMember"],
  [/invalid (?:view )?link/i, "invalidLink"],
  [/user not found or cannot share team/i, "shareUser"],
  [/default team cannot be deleted/i, "defaultTeam"],
  [/team is not empty/i, "teamNotEmpty"],
  [/progress must be between/i, "progress"],
  [/comment must contain/i, "comment"],
  [/choose an existing competency comment/i, "chooseComment"],
  [
    /access|permission|not allowed|only the team owner|personal links cannot|row.level security/i,
    "access",
  ],
];

/** Never expose untranslated service messages or their potentially sensitive details in the UI. */
export function localizeError(error: unknown, t: TFunction): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if ([t("auth.passwordTooShort"), t("auth.passwordsDoNotMatch")].includes(message)) {
    return message;
  }
  const key = messages.find(([pattern]) => pattern.test(message))?.[1] ?? "generic";
  return t(`errors.${key}`);
}
