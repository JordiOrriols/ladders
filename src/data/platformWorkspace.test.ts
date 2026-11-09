import { afterEach, expect, it, vi } from "vitest";
import { workspaceRepository } from "./platform";

const workspace = "11111111-1111-4111-8111-111111111111";
const account = "22222222-2222-4222-8222-222222222222";
const invitation = "33333333-3333-4333-8333-333333333333";
afterEach(() => vi.unstubAllGlobals());

it("validates exact-recipient app invitations, role boundaries and one-use answers", async () => {
  const data = {
    grants: [{ account_id: account, role: "owner" }],
    invitations: [
      { id: invitation, account_id: account, role: "external", expires_at: "2026-12-01T00:00:00Z" },
    ],
  };
  const fetch = vi.fn(async () => new Response(JSON.stringify(data)));
  vi.stubGlobal("fetch", fetch);
  expect(await workspaceRepository.invite(workspace, "planner", account, "external")).toEqual(data);
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/apps/planner/workspaces/${workspace}/invitations/recipients/${account}`,
    expect.objectContaining({ method: "POST", body: '{"role":"external"}' })
  );
  await expect(
    workspaceRepository.invite(workspace, "ladders", account, "external")
  ).rejects.toThrow("Invalid workspace role");
  await expect(
    workspaceRepository.invite(workspace, "planner", "someone@example.com", "viewer")
  ).rejects.toThrow("Invalid workspace or team ID");
  fetch.mockImplementation(
    async () =>
      new Response(
        JSON.stringify([
          {
            id: invitation,
            workspace_id: workspace,
            name: "Workspace",
            app: "agents",
            role: "editor",
            expires_at: "2026-12-01T00:00:00Z",
          },
        ])
      )
  );
  expect(await workspaceRepository.invitations()).toHaveLength(1);
  fetch.mockImplementation(
    async () =>
      new Response(JSON.stringify({ workspace_id: workspace, app: "agents", accepted: false }))
  );
  await workspaceRepository.answer(invitation, false);
  await expect(workspaceRepository.answer(invitation, true)).rejects.toThrow(
    "Invalid API response"
  );
  fetch.mockImplementation(async () => new Response(JSON.stringify({ id: account })));
  await expect(workspaceRepository.delete(workspace)).rejects.toThrow("Invalid API response");
});

it("creates named workspaces and combines all five app directories without inferring access", async () => {
  const fetch = vi.fn(
    async () => new Response(JSON.stringify({ id: workspace, name: "Workspace" }))
  );
  vi.stubGlobal("fetch", fetch);
  expect(await workspaceRepository.create(" Workspace ")).toEqual({
    id: workspace,
    name: "Workspace",
  });
  expect(fetch).toHaveBeenLastCalledWith(
    "/api/workspaces",
    expect.objectContaining({ method: "POST", body: '{"name":"Workspace"}' })
  );
  await expect(workspaceRepository.create(" ")).rejects.toThrow("Invalid workspace name");
  fetch.mockImplementation(
    async () => new Response(JSON.stringify([{ id: workspace, name: "Workspace", role: "owner" }]))
  );
  const directory = await workspaceRepository.directory();
  expect(directory.map((row) => row.app)).toEqual([
    "planner",
    "shiplog",
    "ladders",
    "pulse",
    "agents",
  ]);
  fetch.mockImplementation(
    async () =>
      new Response(JSON.stringify([{ id: workspace, name: "Workspace", role: "external" }]))
  );
  await expect(workspaceRepository.directory()).rejects.toThrow("Invalid workspace role");
});
