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
    void i18n.changeLanguage("en");
  });

  it("lets the manager share and hide each saved peer comment independently", async () => {
    const repo = dataState.repository!;
    const member = await repo.createMember({ name: "Ada", role: "Dev", templateId: null });
    const peer = await repo.createEvaluation(member.id, "peer", {
      status: "published",
      authorName: "Sam",
      currentLevels: { Technology: 3 },
      goalLevels: {},
      comments: { Technology: "Private peer feedback", People: "A separate comment" },
    });
    renderAt(`/member/${member.id}`);
    const technology = await screen.findByTestId(`comment-visibility-${peer.id}-Technology`);
    const people = screen.getByTestId(`comment-visibility-${peer.id}-People`);
    expect(technology).toHaveTextContent("Share with employee");
    await userEvent.click(technology);
    await waitFor(() => expect(technology).toHaveTextContent("Hide from employee"));
    expect(people).toHaveTextContent("Share with employee");
    expect((await repo.listEvaluations(member.id))[0]?.commentVisibility).toEqual({
      Technology: true,
    });
    await userEvent.click(technology);
    await waitFor(() => expect(technology).toHaveTextContent("Share with employee"));
    expect((await repo.listEvaluations(member.id))[0]?.comments.Technology).toBe(
      "Private peer feedback"
    );
  });

  it("reports failed moderation instead of presenting a successful toggle", async () => {
    const repo = dataState.repository!;
    const member = await repo.createMember({ name: "Ada", role: "Dev", templateId: null });
    const peer = await repo.createEvaluation(member.id, "peer", {
      status: "published",
      authorName: "Sam",
      currentLevels: {},
      goalLevels: {},
      comments: { Technology: "Private" },
    });
    vi.spyOn(repo, "setCommentVisibility").mockRejectedValue(
      new Error("Team edit access required")
    );
    renderAt(`/member/${member.id}`);
    const toggle = await screen.findByTestId(`comment-visibility-${peer.id}-Technology`);
    await userEvent.click(toggle);
    expect(await screen.findByRole("alert")).toHaveTextContent("Team edit access required");
    expect(toggle).toHaveTextContent("Share with employee");
  });

  it("preserves hidden manager comments when autosaving a new version", async () => {
    const repo = dataState.repository!;
    const member = await repo.createMember({ name: "Ada", role: "Dev", templateId: null });
    const original = await repo.createEvaluation(member.id, "manager", {
      status: "published",
      authorName: null,
      currentLevels: {},
      goalLevels: {},
      comments: { Technology: "Original private feedback" },
      commentVisibility: { Technology: false },
    });
    renderAt(`/member/${member.id}`);
    const comment = await screen.findByPlaceholderText("Add notes for this competency");
    await userEvent.clear(comment);
    await userEvent.type(comment, "Updated private feedback");
    await waitFor(async () => {
      const versions = await repo.listEvaluations(member.id);
      expect(versions.find((version) => version.id !== original.id)).toMatchObject({
        status: "draft",
        comments: { Technology: "Updated private feedback" },
        commentVisibility: { Technology: false },
      });
    });
  });

  it.each(["self", "peer"] as const)(
    "reuses language and app branding on the %s token header",
    async (kind) => {
      vi.spyOn(tokenApi, "resolveToken").mockResolvedValue({
        linkKind: kind,
        name: "Ada",
        role: "Dev",
        templateId: null,
      });
      vi.spyOn(tokenApi, "listSelfEvaluations").mockResolvedValue([]);
      renderAt("/e/11111111-1111-4111-8111-111111111111");
      await screen.findByLabelText("Name");
      expect(
        screen.getByTestId("assessment-header").querySelector("svg.lucide-layout-grid")
      ).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Language" }));
      await userEvent.click(screen.getByRole("menuitemradio", { name: "Español" }));
      expect(i18n.language).toBe("es");
    }
  );

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
    expect(screen.queryByLabelText("Planning role (optional)")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "SMART Goals" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("version-panel")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("Published answer")).not.toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
  });

  it("saves the planning role separately from the job role when creating a member", async () => {
    renderAt("/member/new");
    await userEvent.type(await screen.findByLabelText("Name"), "Ada");
    await userEvent.type(screen.getByLabelText("Role (optional)"), "Engineering lead");
    await userEvent.selectOptions(screen.getByLabelText("Planning role (optional)"), "backend");
    await waitFor(async () => {
      expect((await dataState.repository!.listMembers())[0]).toMatchObject({
        name: "Ada",
        role: "Engineering lead",
        planningRole: "backend",
      });
    });
  });

  it("loads and clears an existing planning role without changing other profile fields or tokens", async () => {
    const repo = dataState.repository!;
    const member = await repo.createMember({
      name: "Ada",
      role: "Engineering lead",
      planningRole: "frontend",
      templateId: "D3",
    });
    renderAt(`/member/${member.id}`);
    expect(await screen.findByLabelText("Planning role (optional)")).toHaveValue("frontend");
    await userEvent.selectOptions(screen.getByLabelText("Planning role (optional)"), "");
    await waitFor(async () => {
      expect(await repo.getMember(member.id)).toMatchObject({
        role: member.role,
        planningRole: null,
        templateId: member.templateId,
        vacationToken: member.vacationToken,
        selfToken: member.selfToken,
        peerToken: member.peerToken,
        viewToken: member.viewToken,
      });
    });
  });

  it("hides sharing and planning-role editing for read-only team viewers", async () => {
    const repo = dataState.repository!;
    const member = await repo.createMember({
      name: "Ada",
      role: "Lead",
      planningRole: "backend",
      templateId: null,
    });
    const teams = await repo.listTeams();
    const peer = await repo.createEvaluation(member.id, "peer", {
      status: "published",
      authorName: "Sam",
      currentLevels: {},
      goalLevels: {},
      comments: { Technology: "Private peer feedback" },
    });
    vi.spyOn(repo, "listTeams").mockResolvedValue(
      teams.map((team) => ({ ...team, access: "viewer" }))
    );
    renderAt(`/member/${member.id}`);
    expect(await screen.findByLabelText("Name")).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: "Share" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Choose a sharing link" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Planning role (optional)")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`comment-visibility-${peer.id}-Technology`)
    ).not.toBeInTheDocument();
  });

  it.each(["owner", "editor"] as const)(
    "retains vacation sharing and planning-role editing for team %s access",
    async (access) => {
      const repo = dataState.repository!;
      const member = await repo.createMember({
        name: "Ada",
        role: "Lead",
        planningRole: "backend",
        templateId: null,
      });
      const teams = await repo.listTeams();
      vi.spyOn(repo, "listTeams").mockResolvedValue(teams.map((team) => ({ ...team, access })));
      renderAt(`/member/${member.id}`);
      expect(await screen.findByLabelText("Planning role (optional)")).toHaveValue("backend");
      await userEvent.click(screen.getByRole("button", { name: "Choose a sharing link" }));
      expect(screen.getByRole("menuitem", { name: "Vacations" })).toBeInTheDocument();
    }
  );

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
