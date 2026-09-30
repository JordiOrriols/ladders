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
          <Route path="/SelfAssessment" element={<AssessmentPage />} />
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
    await userEvent.click(screen.getByRole("button", { name: /Publish/ }));

    await waitFor(async () => {
      const repo = createLocalRepository();
      const [member] = await repo.listMembers();
      expect(member?.name).toBe("Ada");
      expect(await repo.listEvaluations(member!.id)).toHaveLength(1);
    });
    expect(screen.queryByRole("button", { name: "Share" })).not.toBeInTheDocument();
  });

  it("renders the anonymous self-assessment with history and file actions", async () => {
    renderAt("/SelfAssessment");
    expect(await screen.findByTestId("version-panel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save draft/ })).toBeInTheDocument();
  });

  it("imports a legacy self-assessment file as a version and exports the history", async () => {
    const createObjectURL = vi.fn(() => "blob:x");
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const { container } = renderAt("/SelfAssessment");
    await screen.findByTestId("version-panel");

    const file = new File(
      [JSON.stringify({ name: "Ada", role: "Dev", currentLevels: { Technology: 3 } })],
      "a.json",
      { type: "application/json" }
    );
    await userEvent.upload(container.querySelector('input[type="file"]') as HTMLInputElement, file);
    await waitFor(() => expect(screen.getByLabelText("Name")).toHaveValue("Ada"));
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Export/ }));
    expect(createObjectURL).toHaveBeenCalled();
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
