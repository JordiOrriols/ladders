import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import i18n from "../../i18n";
import AssessmentPage from "../AssessmentPage";
import ViewPage from "../ViewPage";
import { createLocalRepository } from "@/data/localRepository";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/" element={<p>home</p>} />
          <Route path="/member/:id" element={<AssessmentPage />} />
          <Route path="/e/:token" element={<AssessmentPage />} />
          <Route path="/v/:token" element={<ViewPage />} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>
  );

describe("AssessmentPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("creates a member and its first version from /member/new", async () => {
    renderAt("/member/new");
    const nameInput = await screen.findByLabelText("Name");
    await userEvent.type(nameInput, "Ada");
    await userEvent.click(screen.getAllByRole("button", { name: "Current" })[0]!);
    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Publish" })).toBeEnabled());

    await waitFor(async () => {
      const repo = createLocalRepository();
      const [member] = await repo.listMembers();
      expect(member?.name).toBe("Ada");
      expect(await repo.listEvaluations(member!.id)).toHaveLength(1);
    });
    expect(screen.queryByRole("button", { name: "Share" })).not.toBeInTheDocument();
  });

  it("shows not found for a missing member or invalid token", async () => {
    renderAt("/member/does-not-exist");
    expect(await screen.findByText(/not valid/)).toBeInTheDocument();
  });

  it("rejects malformed share tokens without calling the backend", async () => {
    renderAt("/e/abc");
    expect(await screen.findByText(/not valid/)).toBeInTheDocument();
  });

  it("rejects malformed view tokens", async () => {
    renderAt("/v/abc");
    expect(await screen.findByText(/not valid/)).toBeInTheDocument();
  });
});
