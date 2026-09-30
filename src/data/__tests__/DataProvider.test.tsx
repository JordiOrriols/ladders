import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { Header } from "@/components/molecules/Header";
import { DataProvider, useData } from "../DataProvider";

const { auth, state, migrate } = vi.hoisted(() => {
  const state: { listener?: (event: string, session: unknown) => void } = {};
  return {
    state,
    migrate: vi.fn(async () => true),
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: vi.fn((cb: (event: string, session: unknown) => void) => {
        state.listener = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signInWithPassword: vi.fn(async () => ({ error: null })),
      signUp: vi.fn(async () => ({ data: { session: null }, error: null })),
      signOut: vi.fn(async () => ({ error: null })),
    },
  };
});

vi.mock("../supabaseClient", () => ({ supabase: { auth } }));
vi.mock("../teamTransfer", () => ({ migrateLocalTeam: migrate }));

function RepoKind() {
  const { repository, loading } = useData();
  return <span data-testid="repo">{loading ? "loading" : repository.kind}</span>;
}

const renderApp = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <DataProvider>
        <Header onAddMember={vi.fn()} onShowReference={vi.fn()} />
        <RepoKind />
      </DataProvider>
    </I18nextProvider>
  );

describe("DataProvider + login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses local storage until signed in, then the remote repository", async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId("repo")).toHaveTextContent("local"));

    await userEvent.click(screen.getByTestId("sign-in-button"));
    await userEvent.type(screen.getByLabelText("Email"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "supersecret");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "a@b.co",
      password: "supersecret",
    });

    await act(async () => state.listener?.("SIGNED_IN", { user: { id: "u1", email: "a@b.co" } }));
    await waitFor(() => expect(screen.getByTestId("repo")).toHaveTextContent("remote"));
    expect(migrate).toHaveBeenCalledWith(expect.anything(), "u1");

    await userEvent.click(screen.getByTestId("sign-out-button"));
    expect(auth.signOut).toHaveBeenCalled();
  });

  it("asks to confirm the email after sign up and shows auth errors", async () => {
    renderApp();
    await userEvent.click(await screen.findByTestId("sign-in-button"));
    await userEvent.click(screen.getByText("No account? Create one"));
    await userEvent.type(screen.getByLabelText("Email"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "supersecret");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText(/Check your email/)).toBeInTheDocument();

    auth.signUp.mockResolvedValueOnce({
      data: { session: null },
      error: { message: "Weak password" },
    } as never);
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Weak password");
  });
});
