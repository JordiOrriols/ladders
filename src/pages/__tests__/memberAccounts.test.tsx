import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import i18n from "../../i18n";
import Home from "../home";
import JoinPage from "../JoinPage";
import { DEFAULT_WORKSPACE, createInMemoryRepository } from "@/data/__tests__/inMemoryRepository";
import type { Repository } from "@/data/repository";

const VIEW_TOKEN = "33333333-3333-4333-8333-333333333333";
const INVITE = "55555555-5555-4555-8555-555555555555";

const { dataState, workspaceApi } = vi.hoisted(() => ({
  dataState: { repository: null as Repository | null },
  workspaceApi: {
    listWorkspaces: vi.fn(),
    createWorkspace: vi.fn(),
    listShares: vi.fn(async () => []),
    share: vi.fn(),
    updateShare: vi.fn(),
    removeShare: vi.fn(),
  },
}));
vi.mock("@/data/DataProvider", () => ({
  useData: () => ({
    repository: dataState.repository,
    workspaceApi,
    loading: false,
    authEnabled: true,
    user: { id: "user", email: "ada@example.com" },
  }),
}));
vi.mock("@/data/tokenApi", async (original) => ({
  ...(await original<typeof import("@/data/tokenApi")>()),
  resolveToken: vi.fn(async () => ({
    linkKind: "view",
    name: "Ada",
    role: "Engineer",
    templateId: null,
  })),
  getPublicView: vi.fn(async () => []),
  getViewSharingLinks: vi.fn(async () => ({ selfToken: "s", peerToken: "p" })),
  listTokenGoals: vi.fn(async () => []),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/join/:token" element={<JoinPage />} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>
  );
}

describe("Members linked to accounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    dataState.repository = createInMemoryRepository();
  });

  it("shows a linked member only their own page, with the workspace bar", async () => {
    workspaceApi.listWorkspaces.mockResolvedValue([
      { id: DEFAULT_WORKSPACE, name: "Squad", owner_id: "owner", access_level: "member" },
    ]);
    vi.spyOn(dataState.repository!, "myMember").mockResolvedValue({
      id: "m1",
      name: "Ada",
      viewToken: VIEW_TOKEN,
    });
    renderAt("/");

    expect(await screen.findByTestId("member-home-tab")).toHaveTextContent("Ada");
    expect(screen.getByTestId("workspace-switcher")).toHaveTextContent("Member");
    expect(screen.queryByTestId("workspace-share")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tab-team")).not.toBeInTheDocument();
    expect(dataState.repository!.myMember).toHaveBeenCalledWith(DEFAULT_WORKSPACE);
  });

  it("links the account from an invite and opens the workspace", async () => {
    const repository = dataState.repository!;
    vi.spyOn(repository, "previewMemberInvite").mockResolvedValue({
      memberName: "Ada",
      workspaceId: DEFAULT_WORKSPACE,
      workspaceName: "Squad",
    });
    const claim = vi.spyOn(repository, "claimMemberInvite");
    workspaceApi.listWorkspaces.mockResolvedValue([
      { id: DEFAULT_WORKSPACE, name: "Squad", owner_id: "owner", access_level: "member" },
    ]);
    renderAt(`/join/${INVITE}`);

    expect(await screen.findByTestId("join-invite")).toHaveTextContent(
      "You were invited as Ada in the Squad workspace."
    );
    claim.mockResolvedValue({ memberId: "m1", workspaceId: DEFAULT_WORKSPACE });
    vi.spyOn(repository, "myMember").mockResolvedValue({
      id: "m1",
      name: "Ada",
      viewToken: VIEW_TOKEN,
    });
    await userEvent.click(screen.getByRole("button", { name: "Link my account" }));

    expect(claim).toHaveBeenCalledWith(INVITE);
    expect(await screen.findByTestId("member-home-tab")).toBeInTheDocument();
    expect(localStorage.getItem("ladders.workspace")).toBe(DEFAULT_WORKSPACE);
  });

  it("explains an invite that was used or expired", async () => {
    renderAt(`/join/${INVITE}`);
    expect(await screen.findByText(/already used or has expired/)).toBeInTheDocument();
  });

  it("reports a failed claim", async () => {
    const repository = dataState.repository!;
    vi.spyOn(repository, "previewMemberInvite").mockResolvedValue({
      memberName: "Ada",
      workspaceId: DEFAULT_WORKSPACE,
      workspaceName: "Squad",
    });
    vi.spyOn(repository, "claimMemberInvite").mockRejectedValue(
      new Error("Sign in with a verified email first")
    );
    renderAt(`/join/${INVITE}`);
    await userEvent.click(await screen.findByRole("button", { name: "Link my account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The account could not be linked: Sign in with a verified email first"
    );
  });

  it("continues an invite opened before signing in", async () => {
    sessionStorage.setItem("ladders.pendingInvite", INVITE);
    workspaceApi.listWorkspaces.mockResolvedValue([
      { id: DEFAULT_WORKSPACE, name: "Main", owner_id: "user", access_level: "owner" },
    ]);
    renderAt("/");
    expect(await screen.findByText(/already used or has expired/)).toBeInTheDocument();
    expect(sessionStorage.getItem("ladders.pendingInvite")).toBeNull();
  });
});
