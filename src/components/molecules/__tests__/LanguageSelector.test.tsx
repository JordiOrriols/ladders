import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { LanguageSelector } from "../LanguageSelector";

const renderSelector = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <LanguageSelector />
    </I18nextProvider>
  );

describe("LanguageSelector", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("changes language from the dropdown and shows the current code", async () => {
    await i18n.changeLanguage("en");
    renderSelector();
    await userEvent.click(screen.getByRole("button", { name: "Language" }));
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Español" }));
    expect(i18n.language).toBe("es");
    expect(screen.getByTestId("language-selector")).toHaveTextContent("ES");
  });
});
