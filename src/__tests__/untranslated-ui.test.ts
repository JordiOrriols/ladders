import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import en from "@/locales/en.json";

const sourceRoot = resolve("src");
const uiLabel =
  /^(?:aria-label|aria-description|alt|title|subtitle|placeholder|label|description|downloadLabel|ariaLabel|menuLabel|closeLabel|confirmLabel|cancelLabel)$/;
const hasCopy = (value: string) => /[A-Za-z]/.test(value) && !/^[\s·]*L\s*$/.test(value);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "__tests__" || entry.name === "locales") return [];
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(path)
      : /\.[jt]sx?$/.test(entry.name) && !/\.(?:test|spec)\./.test(entry.name)
        ? [path]
        : [];
  });
}

function untranslatedCopy(source: ts.SourceFile) {
  const violations: string[] = [];
  const report = (node: ts.Node) => {
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    violations.push(`${relative(sourceRoot, source.fileName)}:${line}: ${node.getText(source)}`);
  };
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) && hasCopy(node.text)) report(node);
    if (ts.isJsxAttribute(node) && uiLabel.test(node.name.getText(source)) && node.initializer) {
      const value = ts.isJsxExpression(node.initializer)
        ? node.initializer.expression
        : node.initializer;
      if (value && ts.isStringLiteralLike(value) && hasCopy(value.text)) report(node);
    }
    if (
      ts.isPropertyAssignment(node) &&
      uiLabel.test(node.name.getText(source).replace(/["']/g, "")) &&
      ts.isStringLiteralLike(node.initializer) &&
      hasCopy(node.initializer.text)
    ) {
      report(node);
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      /^toLocale(?:DateString|TimeString|String)$/.test(node.expression.name.text) &&
      node.arguments.length === 0
    ) {
      report(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return violations;
}

describe("UI localization source checks", () => {
  it("does not introduce literal UI copy or browser-default date formatting", () => {
    const violations = sourceFiles(sourceRoot)
      .filter((path) => /\.[jt]sx$/.test(path))
      .flatMap((path) =>
        untranslatedCopy(
          ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true)
        )
      );
    expect(violations).toEqual([]);
  });

  it("detects text and labels while permitting identifiers and translated props", () => {
    const source = ts.createSourceFile(
      "example.tsx",
      '<><p>Loading...</p><input placeholder="Name" /><button aria-label={"Go back"} /><Chart label={t("chart.description")} /><span>L</span></>',
      ts.ScriptTarget.Latest,
      true
    );
    expect(untranslatedCopy(source)).toHaveLength(3);
  });

  it("resolves every literal translation key without relying on an English inline fallback", () => {
    const missing: string[] = [];
    for (const path of sourceFiles(sourceRoot)) {
      const source = ts.createSourceFile(
        path,
        readFileSync(path, "utf8"),
        ts.ScriptTarget.Latest,
        true
      );
      const visit = (node: ts.Node) => {
        if (
          ts.isCallExpression(node) &&
          node.expression.getText(source) === "t" &&
          node.arguments[0] &&
          ts.isStringLiteralLike(node.arguments[0])
        ) {
          const key = node.arguments[0].text;
          const value = key
            .split(".")
            .reduce<unknown>(
              (value, part) =>
                typeof value === "object" && value !== null
                  ? (value as Record<string, unknown>)[part]
                  : undefined,
              en
            );
          if (
            value === undefined ||
            (node.arguments[1] && ts.isStringLiteralLike(node.arguments[1]))
          ) {
            missing.push(`${relative(sourceRoot, path)}: ${node.getText(source)}`);
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    expect(missing).toEqual([]);
  });
});
