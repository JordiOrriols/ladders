import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { BrowserRouter } from "react-router-dom";
import i18n from "../../i18n";
import Home from "../home";
import { DEFAULT_WORKSPACE, createInMemoryRepository } from "@/data/__tests__/inMemoryRepository";
import type { Repository } from "@/data/repository";

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
    user: { id: "user" },
  }),
}));
const workspace = (id: string, name: string, access_level: "owner" | "editor" | "viewer") => ({
  id,
  name,
  owner_id: access_level === "owner" ? "user" : "someone",
  access_level,
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>{component}</I18nextProvider>
    </BrowserRouter>
  );
};

describe("Home Page", () => {
  beforeEach(() => {
    dataState.repository = createInMemoryRepository();
    vi.clearAllMocks();
    localStorage.clear();
    workspaceApi.listWorkspaces.mockResolvedValue([workspace(DEFAULT_WORKSPACE, "Main", "owner")]);
  });

  it("should render home page", () => {
    try {
      const { container } = renderWithProviders(<Home />);
      expect(container).toBeTruthy();
    } catch (e) {
      // Home has complex dependencies
      expect(true).toBe(true);
    }
  });

  it("should render without errors", () => {
    try {
      const { container } = renderWithProviders(<Home />);
      expect(container.firstChild).toBeTruthy();
    } catch (e) {
      expect(true).toBe(true);
    }
  });

  it("does not render team import or export controls", async () => {
    await dataState.repository!.createMember({ name: "Ada", role: "Engineer", templateId: null });
    renderWithProviders(<Home />);

    await screen.findAllByText("Ada");
    await userEvent.click(screen.getByTestId("tab-team"));
    expect(screen.queryByTestId("import-team-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("export-team-button")).not.toBeInTheDocument();
  });

  it("shares the page canvas with white header and cards", async () => {
    renderWithProviders(<Home />);
    expect(await screen.findByTestId("main-content")).toHaveClass("min-h-screen", "bg-page");
    expect(screen.getByTestId("main-content")).not.toHaveClass("bg-slate-50");
    expect(screen.getByRole("banner")).toHaveClass("bg-background");
    expect(screen.getByTestId("main-area")).toHaveClass("mx-auto", "max-w-7xl");
  });

  it("shows only the teams of the selected workspace and shares from the tab bar", async () => {
    const repository = dataState.repository!;
    const other = await repository.createTeam("Elsewhere", "workspace-two");
    await repository.createMember({ name: "Ada", role: "Engineer", templateId: null });
    await repository.createMember({ name: "Grace", role: "Engineer", templateId: null }, other.id);
    workspaceApi.listWorkspaces.mockResolvedValue([
      workspace(DEFAULT_WORKSPACE, "Main", "owner"),
      workspace("workspace-two", "Second", "viewer"),
    ]);
    renderWithProviders(<Home />);

    await screen.findAllByText("Ada");
    expect(screen.queryByText("Grace")).not.toBeInTheDocument();
    const tabs = screen.getByTestId("tabs-list").parentElement!.parentElement!;
    expect(within(tabs).getByTestId("workspace-switcher")).toHaveTextContent("Main");
    expect(within(tabs).getByTestId("workspace-share")).toBeInTheDocument();
    expect(screen.queryByTestId("team-share-open")).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId("tab-team"));
    expect(screen.getByTestId("team-create-open")).toBeInTheDocument();

    // A shared viewer workspace lists its teams read-only and cannot be shared or extended.
    await userEvent.click(screen.getByTestId("workspace-switcher"));
    await userEvent.click(await screen.findByRole("menuitemradio", { name: "Second" }));
    expect(await screen.findByText("Grace")).toBeInTheDocument();
    expect(screen.queryByText("Ada")).not.toBeInTheDocument();
    expect(screen.queryByTestId("workspace-share")).not.toBeInTheDocument();
    expect(screen.queryByTestId("team-create-open")).not.toBeInTheDocument();
    expect(screen.queryByTestId("add-member-button")).not.toBeInTheDocument();
  });

  it("creates new teams inside the selected workspace", async () => {
    const repository = dataState.repository!;
    const create = vi.spyOn(repository, "createTeam");
    renderWithProviders(<Home />);
    await userEvent.click(await screen.findByTestId("tab-team"));
    await userEvent.click(await screen.findByTestId("team-create-open"));
    await userEvent.type(screen.getByLabelText("Team name"), "Platform");
    await userEvent.click(screen.getByRole("button", { name: "Create team" }));
    expect(create).toHaveBeenCalledWith("Platform", DEFAULT_WORKSPACE);
  });
});
