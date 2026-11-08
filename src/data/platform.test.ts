import { afterEach, expect, it, vi } from "vitest";
import { platformRepository } from "./platform";

const workspace = "11111111-1111-4111-8111-111111111111";
const team = "22222222-2222-4222-8222-222222222222";
afterEach(() => vi.unstubAllGlobals());
it("parses scoped evaluation history without legacy adapters and rejects invalid levels or private self drafts", async () => {
  const evaluation = {
    id: workspace,
    member_id: team,
    kind: "manager",
    status: "published",
    author_name: null,
    current_levels: { Technology: 5.5 },
    goal_levels: {},
    comments: { Technology: "Manager note" },
    comment_visibility: { Technology: false },
    created_at: "2026-11-01T00:00:00.000Z",
  };
  const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify([evaluation])));
  vi.stubGlobal("fetch", fetch);
  expect(await platformRepository.evaluations(workspace, team)).toEqual([
    {
      id: workspace,
      memberId: team,
      kind: "manager",
      status: "published",
      authorName: null,
      currentLevels: { Technology: 5.5 },
      goalLevels: {},
      comments: { Technology: "Manager note" },
      commentVisibility: { Technology: false },
      createdAt: evaluation.created_at,
    },
  ]);
  expect(fetch).toHaveBeenCalledWith(
    `/api/ladders/workspaces/${workspace}/members/${team}/evaluations`,
    expect.objectContaining({ method: "GET" })
  );
  for (const patch of [
    { current_levels: { Technology: 6 } },
    { current_levels: { Technology: 0.25 } },
    { current_levels: { Unknown: 1 } },
    { comment_visibility: { Technology: "false" } },
    { kind: "self", status: "draft" },
    { member_id: workspace },
    { created_at: "invalid" },
    { kind: "other" },
    { status: "other" },
  ]) {
    fetch.mockImplementation(
      async () => new Response(JSON.stringify([{ ...evaluation, ...patch }]))
    );
    await expect(platformRepository.evaluations(workspace, team)).rejects.toThrow(
      "Invalid API response"
    );
  }
});
it("moves members through a scoped body-free route and validates all IDs", async () => {
  const fetch = vi.fn().mockImplementation(async () => new Response('{"teams":[],"members":[]}'));
  vi.stubGlobal("fetch", fetch);
  await platformRepository.moveMember(workspace, team, workspace);
  expect(fetch).toHaveBeenCalledWith(
    `/api/ladders/workspaces/${workspace}/members/${team}/teams/${workspace}`,
    expect.objectContaining({ method: "PATCH" })
  );
  expect(fetch.mock.calls[0]?.[1]).not.toHaveProperty("body");
  await expect(platformRepository.moveMember(workspace, team, "invalid")).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("creates a member with the existing profile validator and requires an ID-only response", async () => {
  const input = { name: " New ", role: "", planning_role: null, template_id: null };
  const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ id: team })));
  vi.stubGlobal("fetch", fetch);
  expect(await platformRepository.createMember(workspace, team, input)).toBe(team);
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/workspaces/${workspace}/teams/${team}/members`,
    expect.objectContaining({
      method: "POST",
      body: '{"name":"New","role":"","planning_role":null,"template_id":null}',
    })
  );
  await expect(
    platformRepository.createMember(workspace, team, { ...input, name: "" })
  ).rejects.toThrow("Invalid member profile");
  fetch.mockImplementation(async () => new Response('{"name":"Missing ID"}'));
  await expect(platformRepository.createMember(workspace, team, input)).rejects.toThrow(
    "Invalid API response"
  );
});
it("deletes members and teams only through scoped API paths without a request body", async () => {
  const fetch = vi.fn().mockImplementation(async () => new Response('{"teams":[],"members":[]}'));
  vi.stubGlobal("fetch", fetch);
  await platformRepository.deleteMember(workspace, team);
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/workspaces/${workspace}/members/${team}`,
    expect.objectContaining({ method: "DELETE" })
  );
  expect(fetch.mock.calls[0]?.[1]).not.toHaveProperty("body");
  await platformRepository.deleteTeam(workspace, team);
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/workspaces/${workspace}/teams/${team}`,
    expect.objectContaining({ method: "DELETE" })
  );
  await expect(platformRepository.deleteMember("../foreign", team)).rejects.toThrow(
    "Invalid workspace"
  );
  expect(fetch).toHaveBeenCalledTimes(2);
});
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
