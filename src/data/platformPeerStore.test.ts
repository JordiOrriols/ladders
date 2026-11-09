import { afterEach, expect, it, vi } from "vitest";
import { platformRepository } from "./platform";
import { createPlatformPeerStore } from "./platformEvaluationStore";

const assignment = "11111111-1111-4111-8111-111111111111";
const member = "22222222-2222-4222-8222-222222222222";
const workspace = "33333333-3333-4333-8333-333333333333";
afterEach(() => vi.unstubAllGlobals());

it("loads only an unsubmitted assigned profile and uses verified server authorship, not legacy tokens", async () => {
  const row = {
    id: assignment,
    member_id: member,
    name: "Target",
    role: "Engineer",
    template_id: null,
    submitted: false,
  };
  const fetch = vi.fn(async () => new Response(JSON.stringify([row])));
  vi.stubGlobal("fetch", fetch);
  const store = createPlatformPeerStore(assignment);
  expect(store.authorNameRequired).toBe(false);
  expect(store.showHistory).toBe(false);
  expect(await store.load()).toEqual({
    profile: { name: "Target", role: "Engineer", templateId: null },
    evaluations: [],
  });
  expect(fetch).toHaveBeenLastCalledWith(
    "/api/ladders/me/peer-assignments",
    expect.objectContaining({ method: "GET" })
  );
  const result = {
    id: workspace,
    member_id: member,
    kind: "peer",
    status: "draft",
    author_name: "Verified reviewer",
    current_levels: { Technology: 3.5 },
    goal_levels: {},
    comments: {},
    comment_visibility: {},
    created_at: "2026-11-01T00:00:00.000Z",
  };
  fetch.mockImplementation(async () => new Response(JSON.stringify(result)));
  const input = {
    status: "published" as const,
    authorName: "Spoofed author",
    currentLevels: { Technology: 3.5 },
    goalLevels: {},
    comments: {},
    commentVisibility: { Technology: true },
  };
  expect(await store.create(input)).toEqual(
    expect.objectContaining({ kind: "peer", status: "draft", authorName: "Verified reviewer" })
  );
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/me/peer-assignments/${assignment}/submit`,
    expect.objectContaining({
      method: "POST",
      body: '{"current_levels":{"Technology":3.5},"goal_levels":{},"comments":{}}',
    })
  );
  for (const patch of [
    { kind: "manager" },
    { status: "published" },
    { member_id: workspace },
    { comment_visibility: { Technology: true } },
    { goal_levels: { Technology: 4 } },
  ]) {
    fetch.mockImplementation(async () => new Response(JSON.stringify({ ...result, ...patch })));
    await expect(store.create(input)).rejects.toThrow("Invalid API response");
  }
  fetch.mockImplementation(async () => new Response(JSON.stringify([{ ...row, submitted: true }])));
  expect(await createPlatformPeerStore(assignment).load()).toBeNull();
  fetch.mockImplementation(async () => new Response("[]"));
  expect(await createPlatformPeerStore(assignment).load()).toBeNull();
  await expect(store.setStatus(workspace, "published")).rejects.toThrow("Only managers");
  await expect(store.remove(workspace)).rejects.toThrow("cannot delete");
});

it("manages peer assignments through exact workspace/member/reviewer routes", async () => {
  const fetch = vi.fn(async () => new Response("[]"));
  vi.stubGlobal("fetch", fetch);
  await platformRepository.peerCandidates(workspace, member);
  await platformRepository.peerAssignments(workspace, member);
  await platformRepository.assignPeer(workspace, member, assignment);
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/workspaces/${workspace}/members/${member}/peer-assignments/reviewers/${assignment}`,
    expect.objectContaining({ method: "POST" })
  );
  await platformRepository.revokePeer(workspace, member, assignment);
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/workspaces/${workspace}/members/${member}/peer-assignments/${assignment}`,
    expect.objectContaining({ method: "DELETE" })
  );
  await expect(platformRepository.assignPeer(workspace, member, "invalid")).rejects.toThrow();
  fetch.mockImplementation(
    async () =>
      new Response(
        JSON.stringify([{ id: assignment, name: "Reviewer", submitted: "false", revoked: false }])
      )
  );
  await expect(platformRepository.peerAssignments(workspace, member)).rejects.toThrow(
    "Invalid API response"
  );
});
