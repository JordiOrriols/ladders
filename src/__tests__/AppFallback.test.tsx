import React from "react";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import App from "../App";
import i18n from "../i18n";

vi.mock("../pages/PlatformTeams", () => ({
  default: () => {
    throw new Error("Private service failure");
  },
}));

afterEach(() => vi.restoreAllMocks());

it("keeps the root failure employee-safe inside one shared frame and footer", () => {
  const diagnostics = vi.spyOn(console, "error").mockImplementation(() => {});
  render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </MemoryRouter>
  );
  expect(screen.getAllByRole("banner")).toHaveLength(1);
  expect(screen.getAllByRole("main")).toHaveLength(1);
  expect(screen.getAllByTestId("app-footer")).toHaveLength(1);
  expect(screen.getByRole("alert")).toHaveTextContent(i18n.t("errors.generic"));
  expect(screen.queryByText("Private service failure")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: i18n.t("errors.retry") })).toBeVisible();
  expect(diagnostics).toHaveBeenCalled();
});
