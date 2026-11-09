import { afterEach, expect, it, vi } from "vitest";
import { platformRepository } from "./platform";
import { createPlatformSelfEvaluationStore } from "./platformEvaluationStore";

const workspace = "11111111-1111-4111-8111-111111111111";
const team = "22222222-2222-4222-8222-222222222222";
afterEach(() => vi.unstubAllGlobals());
it("edits only own self drafts through personal routes and keeps author, visibility and status out of content writes", async () => {
  const member = {
    id: team,
    name: "Own profile",
    role: "",
    planning_role: null,
    template_id: null,
    workspace_id: workspace,
    workspace_name: "Workspace",
  };
  const row = {
    id: workspace,
    member_id: team,
    kind: "self",
    status: "draft",
    author_name: member.name,
    current_levels: { Technology: 3.5 },
    goal_levels: {},
    comments: { Technology: "Own answer" },
    comment_visibility: {},
    created_at: "2026-11-01T00:00:00.000Z",
  };
  const fetch = vi
    .fn()
    .mockImplementation(async () => new Response(JSON.stringify({ member, evaluations: [row] })));
  vi.stubGlobal("fetch", fetch);
  const store = createPlatformSelfEvaluationStore(team);
  expect(await store.load()).toEqual({
    profile: { name: member.name, role: "", planningRole: null, templateId: null },
    evaluations: [expect.objectContaining({ kind: "self", status: "draft" })],
  });
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/me/members/${team}/self-evaluations`,
    expect.objectContaining({ method: "GET" })
  );
  fetch.mockImplementation(
    async () =>
      new Response(
        JSON.stringify({ member, evaluations: [{ ...row, kind: "manager", status: "published" }] })
      )
  );
  await expect(store.load()).rejects.toThrow("Invalid API response");
  fetch.mockImplementation(async () => new Response(JSON.stringify(row)));
  const input = {
    status: "published" as const,
    authorName: "Injected author",
    currentLevels: row.current_levels,
    goalLevels: {},
    comments: row.comments,
    commentVisibility: { Technology: false },
  };
  await store.create(input);
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/me/members/${team}/self-evaluations`,
    expect.objectContaining({
      method: "POST",
      body: '{"current_levels":{"Technology":3.5},"goal_levels":{},"comments":{"Technology":"Own answer"}}',
    })
  );
  await store.updateDraft!(workspace, input);
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/me/members/${team}/self-evaluations/${workspace}`,
    expect.objectContaining({ method: "PATCH" })
  );
  fetch.mockImplementation(
    async () => new Response(JSON.stringify({ ...row, status: "published" }))
  );
  await store.setStatus(workspace, "published");
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/me/members/${team}/self-evaluations/${workspace}/publish`,
    expect.objectContaining({ method: "POST" })
  );
  await expect(store.setStatus(workspace, "draft")).rejects.toThrow("immutable");
  await expect(
    store.saveProfile({ name: member.name, role: "", templateId: null })
  ).rejects.toThrow("read-only");
  await expect(store.remove(workspace)).rejects.toThrow("cannot delete");
  expect(store.setCommentVisibility).toBeUndefined();
  for (const patch of [
    { kind: "manager" },
    { member_id: workspace },
    { id: team },
    { comment_visibility: { Technology: true } },
  ]) {
    fetch.mockImplementation(async () => new Response(JSON.stringify({ ...row, ...patch })));
    await expect(store.updateDraft!(workspace, input)).rejects.toThrow("Invalid API response");
  }
});
it("loads only own employee history, permits own self drafts and rejects reviewer drafts or internal visibility metadata", async () => {
  const member = {
    id: team,
    name: "Own profile",
    role: "",
    planning_role: null,
    template_id: null,
    workspace_id: workspace,
    workspace_name: "Workspace",
  };
  const row = {
    id: workspace,
    member_id: team,
    kind: "self",
    status: "draft",
    author_name: null,
    current_levels: {},
    goal_levels: {},
    comments: { Technology: "My draft" },
    comment_visibility: {},
    created_at: "2026-11-01T00:00:00.000Z",
  };
  const fetch = vi
    .fn()
    .mockImplementation(async () => new Response(JSON.stringify({ member, evaluations: [row] })));
  vi.stubGlobal("fetch", fetch);
  expect(await platformRepository.myEvaluations(team)).toEqual({
    member,
    evaluations: [expect.objectContaining({ kind: "self", status: "draft" })],
  });
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/me/members/${team}/evaluations`,
    expect.objectContaining({ method: "GET" })
  );
  for (const patch of [
    { kind: "manager" },
    { kind: "peer" },
    { member_id: workspace },
    { comment_visibility: { Technology: true } },
  ]) {
    fetch.mockImplementation(
      async () => new Response(JSON.stringify({ member, evaluations: [{ ...row, ...patch }] }))
    );
    await expect(platformRepository.myEvaluations(team)).rejects.toThrow("Invalid API response");
  }
  fetch.mockImplementation(
    async () =>
      new Response(JSON.stringify({ member: { ...member, id: workspace }, evaluations: [] }))
  );
  await expect(platformRepository.myEvaluations(team)).rejects.toThrow("Invalid API response");
  fetch.mockImplementation(async () => new Response(JSON.stringify([member])));
  expect(await platformRepository.myMembers()).toEqual([member]);
  expect(fetch).toHaveBeenLastCalledWith(
    "/api/ladders/me/members",
    expect.objectContaining({ method: "GET" })
  );
});
it("saves only manager draft content and changes status through a separate scoped route", async () => {
  const row = {
    id: workspace,
    member_id: team,
    kind: "manager",
    status: "draft",
    author_name: null,
    current_levels: { Technology: 3.5 },
    goal_levels: {},
    comments: {},
    comment_visibility: { Technology: false },
    created_at: "2026-11-01T00:00:00.000Z",
  };
  const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify(row)));
  vi.stubGlobal("fetch", fetch);
  const input = {
    status: "draft" as const,
    authorName: null,
    currentLevels: row.current_levels,
    goalLevels: {},
    comments: {},
    commentVisibility: { Technology: true },
  };
  await platformRepository.saveEvaluation(workspace, team, null, input);
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/workspaces/${workspace}/members/${team}/evaluations`,
    expect.objectContaining({
      method: "POST",
      body: '{"current_levels":{"Technology":3.5},"goal_levels":{},"comments":{}}',
    })
  );
  await platformRepository.saveEvaluation(workspace, team, workspace, input);
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/workspaces/${workspace}/members/${team}/evaluations/${workspace}`,
    expect.objectContaining({ method: "PATCH" })
  );
  fetch.mockImplementation(
    async () => new Response(JSON.stringify({ ...row, status: "published" }))
  );
  await platformRepository.setEvaluationStatus(workspace, team, workspace, "published");
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/workspaces/${workspace}/members/${team}/evaluations/${workspace}/status`,
    expect.objectContaining({ method: "PATCH", body: '{"status":"published"}' })
  );
  await expect(
    platformRepository.saveEvaluation(workspace, team, workspace, input)
  ).rejects.toThrow("Invalid API response");
});
it("changes only comment visibility through the explicit evaluation scope", async () => {
  const fetch = vi.fn().mockImplementation(async () => new Response("[]"));
  vi.stubGlobal("fetch", fetch);
  await platformRepository.setCommentVisibility(workspace, team, workspace, "Technology", false);
  expect(fetch).toHaveBeenCalledWith(
    `/api/ladders/workspaces/${workspace}/members/${team}/evaluations/${workspace}/comments/Technology`,
    expect.objectContaining({ method: "PATCH", body: '{"visible":false}' })
  );
  await expect(
    platformRepository.setCommentVisibility(workspace, team, workspace, "Unknown", true)
  ).rejects.toThrow("Choose an existing competency comment");
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("deletes only through the scoped API and validates the returned history", async () => {
  const remaining = [
    {
      id: team,
      member_id: team,
      kind: "manager",
      status: "published",
      author_name: null,
      current_levels: {},
      goal_levels: {},
      comments: {},
      comment_visibility: {},
      created_at: "2026-11-01T00:00:00.000Z",
    },
  ];
  const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify(remaining)));
  vi.stubGlobal("fetch", fetch);
  expect(await platformRepository.deleteEvaluation(workspace, team, workspace)).toEqual([
    expect.objectContaining({ id: team, kind: "manager", status: "published" }),
  ]);
  expect(fetch).toHaveBeenCalledWith(
    `/api/ladders/workspaces/${workspace}/members/${team}/evaluations/${workspace}`,
    expect.objectContaining({ method: "DELETE" })
  );
  fetch.mockImplementation(
    async () => new Response(JSON.stringify([{ ...remaining[0], id: workspace }]))
  );
  await expect(platformRepository.deleteEvaluation(workspace, team, workspace)).rejects.toThrow(
    "Invalid API response"
  );
  await expect(platformRepository.deleteEvaluation("../foreign", team, workspace)).rejects.toThrow(
    "Invalid workspace"
  );
});
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
it("reads, saves, comments on and deletes SMART goals through scoped API routes", async () => {
  const row = {
    id: workspace,
    member_id: team,
    title: "Goal",
    description: "Description",
    due_date: "2026-02-28",
    progress: 25,
    comments: [
      {
        id: team,
        text: "Legacy note",
        createdAt: "2026-01-01T00:00:00.000Z",
        authorKind: "legacy",
      },
    ],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
  };
  const comment = {
    id: team,
    text: "Manager note",
    createdAt: "2026-01-03T00:00:00.000Z",
    authorKind: "manager",
  };
  const fetch = vi
    .fn()
    .mockImplementationOnce(async () => new Response(JSON.stringify([row])))
    .mockImplementationOnce(async () => new Response(JSON.stringify(row)))
    .mockImplementationOnce(async () => new Response(JSON.stringify({ ...row, progress: 50 })))
    .mockImplementationOnce(
      async () => new Response(JSON.stringify({ ...row, comments: [...row.comments, comment] }))
    )
    .mockImplementationOnce(async () => new Response("[]"));
  vi.stubGlobal("fetch", fetch);
  expect(await platformRepository.goals(workspace, team)).toEqual([
    expect.objectContaining({
      id: workspace,
      memberId: team,
      title: "Goal",
      dueDate: "2026-02-28",
      progress: 25,
      comments: [expect.objectContaining({ authorKind: "legacy" })],
    }),
  ]);
  const input = {
    title: " New goal ",
    description: "Details",
    dueDate: null,
    progress: 0,
  };
  await platformRepository.saveGoal(workspace, team, null, input);
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/workspaces/${workspace}/members/${team}/goals`,
    expect.objectContaining({
      method: "POST",
      body: '{"title":"New goal","description":"Details","due_date":null,"progress":0}',
    })
  );
  await platformRepository.saveGoal(workspace, team, workspace, {
    ...input,
    title: "Goal",
    progress: 50,
  });
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/workspaces/${workspace}/members/${team}/goals/${workspace}`,
    expect.objectContaining({ method: "PATCH" })
  );
  expect(
    await platformRepository.appendGoalComment(workspace, team, workspace, " Manager note ")
  ).toEqual(expect.objectContaining({ id: workspace, memberId: team }));
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/workspaces/${workspace}/members/${team}/goals/${workspace}/comments`,
    expect.objectContaining({ method: "POST", body: '{"text":"Manager note"}' })
  );
  await platformRepository.deleteGoal(workspace, team, workspace);
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/workspaces/${workspace}/members/${team}/goals/${workspace}`,
    expect.objectContaining({ method: "DELETE" })
  );
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
