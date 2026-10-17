const KEY = "ladders.pendingInvite";

/** Signing in (GitHub included) loses the hash route, so an opened invite waits here. */
export function rememberInvite(token: string) {
  try {
    sessionStorage.setItem(KEY, token);
  } catch {
    // Without storage the person opens the invite link again after signing in.
  }
}

export function takePendingInvite(): string | null {
  try {
    const token = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return token;
  } catch {
    return null;
  }
}
