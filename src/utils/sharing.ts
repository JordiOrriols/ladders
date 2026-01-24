export function buildShareLink(route: string): string {
  const sanitizedRoute = route.replace(/^#?\/?/, "");
  const base = `${window.location.origin}${window.location.pathname}`.replace(/#.*$/, "");
  return `${base}#/${sanitizedRoute}`;
}

export function exportJson(prefix: string, payload: unknown) {
  const safePrefix =
    prefix
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-") || "export";
  const fileName = `${safePrefix}-${Date.now()}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

type Validator<T> = (value: unknown) => value is T;

export async function importJsonFromFile<T>(file: File, validate?: Validator<T>): Promise<T> {
  const text =
    typeof file.text === "function"
      ? await file.text()
      : await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsText(file);
        });
  const data = JSON.parse(text);
  if (validate && !validate(data)) {
    throw new Error("Invalid JSON shape");
  }
  return data as T;
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
