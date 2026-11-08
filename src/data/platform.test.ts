import { afterEach, expect, it, vi } from "vitest";
import { platformRepository } from "./platform";

const workspace = "11111111-1111-4111-8111-111111111111";
const team = "22222222-2222-4222-8222-222222222222";
afterEach(() => vi.unstubAllGlobals());
it("saves only editable profile fields and validates profile limits before sending", async () => {
  const input = {
    name: " Member ",
    role: " Engineer ",
    planning_role: "backend" as const,
    template_id: "D3",
  };
  const fetch = vi
    .fn()
    .mockImplementation(async () => new Response(JSON.stringify({ teams: [], members: [] })));
  vi.stubGlobal("fetch", fetch);
  await platformRepository.saveProfile(workspace, team, {
    ...input,
    ...{ owner_id: "spoof", self_token: "spoof" },
  });
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/workspaces/${workspace}/members/${team}`,
    expect.objectContaining({
      method: "PATCH",
      body: '{"name":"Member","role":"Engineer","planning_role":"backend","template_id":"D3"}',
    })
  );
  await expect(
    platformRepository.saveProfile(workspace, team, { ...input, name: " " })
  ).rejects.toThrow("Invalid member profile");
  await expect(
    platformRepository.saveProfile(workspace, team, { ...input, template_id: "x".repeat(11) })
  ).rejects.toThrow("Invalid member profile");
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("reads scoped workspaces and validates roles", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify([{ id: workspace, name: "Local", role: "viewer" }]))
    );
  vi.stubGlobal("fetch", fetch);
  expect(await platformRepository.workspaces()).toEqual([
    { id: workspace, name: "Local", role: "viewer" },
  ]);
  expect(fetch).toHaveBeenCalledWith(
    "/api/apps/ladders/workspaces",
    expect.objectContaining({ credentials: "same-origin" })
  );
  fetch.mockResolvedValue(
    new Response(JSON.stringify([{ id: workspace, name: "Local", role: "external" }]))
  );
  await expect(platformRepository.workspaces()).rejects.toThrow("Invalid Ladders access role");
});
it("shares the create and rename adapter with trimmed names and scoped IDs", async () => {
  const fetch = vi
    .fn()
    .mockImplementation(
      async () => new Response(JSON.stringify({ teams: [{ id: team, name: "Team" }], members: [] }))
    );
  vi.stubGlobal("fetch", fetch);
  await platformRepository.saveTeam(workspace, " Team ", null);
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/workspaces/${workspace}/teams`,
    expect.objectContaining({ method: "POST", body: '{"name":"Team"}' })
  );
  await platformRepository.saveTeam(workspace, " Team ", team);
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/workspaces/${workspace}/teams/${team}`,
    expect.objectContaining({ method: "PATCH" })
  );
  await expect(platformRepository.saveTeam(workspace, " ", null)).rejects.toThrow("Team names");
  await expect(platformRepository.saveTeam(workspace, "x".repeat(121), null)).rejects.toThrow(
    "Team names"
  );
  await expect(platformRepository.teams("../other")).rejects.toThrow("Invalid workspace");
  expect(fetch).toHaveBeenCalledTimes(2);
});
it("projects roster profiles without tokens and surfaces malformed responses or HTTP failures", async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        teams: [],
        members: [
          {
            id: team,
            team_id: workspace,
            name: "Member",
            role: "",
            planning_role: null,
            template_id: null,
            self_token: "secret",
          },
        ],
      })
    )
  );
  vi.stubGlobal("fetch", fetch);
  expect((await platformRepository.teams(workspace)).members[0]).not.toHaveProperty("self_token");
  fetch.mockResolvedValue(
    new Response(
      JSON.stringify({
        teams: [],
        members: [
          { id: team, team_id: workspace, name: "Member", role: "", planning_role: "invalid" },
        ],
      })
    )
  );
  await expect(platformRepository.teams(workspace)).rejects.toThrow("Invalid planning role");
  fetch.mockResolvedValue(
    new Response('{"message":"Workspace access required"}', {
      status: 403,
      headers: { "content-type": "application/json" },
    })
  );
  await expect(platformRepository.teams(workspace)).rejects.toThrow("Workspace access required");
  fetch.mockResolvedValue(new Response("Access login", { status: 401 }));
  await expect(platformRepository.teams(workspace)).rejects.toThrow("API request failed (401)");
});
