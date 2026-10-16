export function buildShareLink(route: string): string {
  const sanitizedRoute = route.replace(/^#?\/?/, "");
  const base = `${window.location.origin}${window.location.pathname}`.replace(/#.*$/, "");
  return `${base}#/${sanitizedRoute}`;
}

// Local Ladders links to the local Planner dev server (the e2e suite relies on it).
const LOCAL_PLANNER_URL = "http://127.0.0.1:5176/";

export function buildVacationLink(token: string): string {
  const local = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const url = new URL(local ? LOCAL_PLANNER_URL : getProjectUrl("planner"));
  url.hash = `/vacations/${encodeURIComponent(token)}`;
  return url.href;
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
import { getProjectUrl } from "@jordiorriols/ui";
