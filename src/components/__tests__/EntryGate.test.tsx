import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import i18n from "@/i18n";
import { EntryGate } from "../EntryGate";

const { dataState } = vi.hoisted(() => ({
  dataState: {
    user: null as { id: string } | null,
    loading: false,
    anonymousMode: false,
    authEnabled: true,
    continueAnonymously: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
  },
}));

vi.mock("@/data/DataProvider", () => ({ useData: () => dataState }));

function renderGate(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nextProvider i18n={i18n}>
        <EntryGate>
          <p>Owned application</p>
        </EntryGate>
      </I18nextProvider>
    </MemoryRouter>
  );
}

describe("EntryGate", () => {
  beforeEach(() => {
    dataState.user = null;
    dataState.loading = false;
    dataState.anonymousMode = false;
    dataState.authEnabled = true;
    vi.clearAllMocks();
  });

  it("offers account or anonymous access on the first owned route", async () => {
    renderGate();
    expect(screen.getByRole("heading", { name: "How do you want to start?" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Continue anonymously" }));
    expect(dataState.continueAnonymously).toHaveBeenCalledOnce();
  });

  it("opens account creation directly in sign-up mode", async () => {
    renderGate();
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByRole("heading", { name: "Create an account" })).toBeInTheDocument();
  });

  it("bypasses the welcome page for remembered anonymous and authenticated users", () => {
    dataState.anonymousMode = true;
    const { rerender } = renderGate();
    expect(screen.getByText("Owned application")).toBeInTheDocument();

    dataState.anonymousMode = false;
    dataState.user = { id: "u1" };
    rerender(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <EntryGate>
            <p>Owned application</p>
          </EntryGate>
        </I18nextProvider>
      </MemoryRouter>
    );
    expect(screen.getByText("Owned application")).toBeInTheDocument();
  });

  it.each(["/e/11111111-1111-4111-8111-111111111111", "/v/11111111-1111-4111-8111-111111111111"])(
    "always lets shared route %s through",
    (path) => {
      renderGate(path);
      expect(screen.getByText("Owned application")).toBeInTheDocument();
      expect(screen.queryByText("How do you want to start?")).not.toBeInTheDocument();
    }
  );
});
