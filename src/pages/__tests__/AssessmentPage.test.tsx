import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import i18n from "../../i18n";
import AssessmentPage from "../AssessmentPage";
import ViewPage from "../ViewPage";
import { createInMemoryRepository } from "@/data/__tests__/inMemoryRepository";
import type { Repository } from "@/data/repository";
import * as tokenApi from "@/data/tokenApi";

const { dataState } = vi.hoisted(() => ({
  dataState: { repository: null as Repository | null },
}));
vi.mock("@/data/DataProvider", () => ({
  useData: () => ({ repository: dataState.repository, loading: false, user: { id: "user" } }),
}));

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
    vi.restoreAllMocks();
    dataState.repository = createInMemoryRepository();
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("shows a blank self form without goals, history or deletion after publishing", async () => {
    vi.spyOn(tokenApi, "resolveToken").mockResolvedValue({
      linkKind: "self",
      name: "Ada",
      role: "Dev",
      templateId: null,
    });
    vi.spyOn(tokenApi, "listSelfEvaluations").mockResolvedValue([
      {
        id: "self-published",
        memberId: "member",
        kind: "self",
        status: "published",
        authorName: "Ada",
        currentLevels: { Technology: 4 },
        goalLevels: {},
        comments: { Technology: "Published answer" },
        createdAt: "2026-01-01",
      },
    ]);
    const create = vi.spyOn(tokenApi, "saveSelfEvaluation");
    renderAt("/e/11111111-1111-4111-8111-111111111111");
    expect(await screen.findByLabelText("Name")).toHaveValue("Ada");
    expect(screen.queryByRole("tab", { name: "SMART Goals" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("version-panel")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("Published answer")).not.toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
  });

  it("creates a member and its first version from /member/new", async () => {
    renderAt("/member/new");
    const nameInput = await screen.findByLabelText("Name");
    await userEvent.type(nameInput, "Ada");
    await userEvent.click(screen.getAllByRole("button", { name: "Current" })[0]!);
    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Publish" })).toBeEnabled());

    await waitFor(async () => {
      const repo = dataState.repository!;
      const [member] = await repo.listMembers();
      expect(member?.name).toBe("Ada");
      expect(await repo.listEvaluations(member!.id)).toHaveLength(1);
    });
    expect(screen.queryByRole("button", { name: "Share" })).not.toBeInTheDocument();
  });

  it("shows manager comments below competency levels", async () => {
    renderAt("/member/new");
    await userEvent.type(await screen.findByLabelText("Name"), "Ada");
    await userEvent.type(
      screen.getByPlaceholderText("Add notes for this competency"),
      "Strong architecture decisions"
    );

    expect(screen.getByTestId("comment-groups")).toHaveTextContent("Strong architecture decisions");
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
