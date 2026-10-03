export function buildShareLink(route: string): string {
  const sanitizedRoute = route.replace(/^#?\/?/, "");
  const base = `${window.location.origin}${window.location.pathname}`.replace(/#.*$/, "");
  return `${base}#/${sanitizedRoute}`;
}

export class PlannerUrlError extends Error {}

export function buildVacationLink(token: string): string {
  const configured = (import.meta.env["VITE_PLANNER_URL"] as string | undefined)?.trim();
  const local = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const base = configured || (local ? "http://127.0.0.1:5176" : "");
  try {
    const url = new URL(base);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      throw new Error("Invalid Planner URL");
    }
    url.search = "";
    url.hash = `/vacations/${encodeURIComponent(token)}`;
    return url.href;
  } catch {
    throw new PlannerUrlError(
      "Set VITE_PLANNER_URL to the absolute Planner URL, including its deployment pathname, then rebuild Ladders."
    );
  }
}

export async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}
