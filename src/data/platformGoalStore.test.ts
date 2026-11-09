import { afterEach, expect, it, vi } from "vitest";
import { createPlatformGoalStore, createPlatformMemberGoalStore } from "./platformGoalStore";

const workspace = "11111111-1111-4111-8111-111111111111";
const member = "22222222-2222-4222-8222-222222222222";
const goal = "33333333-3333-4333-8333-333333333333";
afterEach(() => vi.unstubAllGlobals());

it("reuses member mode and sends only progress or new comment text to employee-scoped API routes", async () => {
  const row = {
    id: goal,
    member_id: member,
    title: "Defined by manager",
    description: "",
    due_date: null,
    progress: 40,
    comments: [],
    created_at: "2026-11-01T00:00:00.000Z",
    updated_at: "2026-11-01T00:00:00.000Z",
  };
  const fetch = vi.fn(async () => new Response(JSON.stringify([row])));
  vi.stubGlobal("fetch", fetch);
  const store = createPlatformMemberGoalStore(member);
  expect(store.mode).toBe("member");
  expect(await store.canDelete()).toBe(false);
  expect(await store.list()).toEqual([expect.objectContaining({ id: goal })]);
  fetch.mockImplementation(async () => new Response(JSON.stringify(row)));
  const input = {
    title: "Spoofed title",
    description: "Spoofed definition",
    dueDate: "2027-01-01",
    progress: 40,
  };
  await store.update(goal, input);
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/me/members/${member}/goals/${goal}/progress`,
    expect.objectContaining({ method: "PATCH", body: '{"progress":40}' })
  );
  await store.appendComment(goal, " note ");
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/me/members/${member}/goals/${goal}/comments`,
    expect.objectContaining({ method: "POST", body: '{"text":"note"}' })
  );
  await expect(store.create(input)).rejects.toThrow("cannot create");
  await expect(store.remove(goal)).rejects.toThrow("cannot delete");
  for (const progress of [-1, 101, 2.5])
    await expect(store.update(goal, { ...input, progress })).rejects.toThrow(
      "Invalid goal progress"
    );
  await expect(store.appendComment(goal, " ")).rejects.toThrow("Comment must contain");
  fetch.mockImplementation(
    async () => new Response(JSON.stringify({ ...row, member_id: workspace }))
  );
  await expect(store.update(goal, input)).rejects.toThrow("Invalid API response");
  await expect(store.appendComment(goal, "note")).rejects.toThrow("Invalid API response");
});

it("allows only workspace owners to delete through the platform goal store", async () => {
  const fetch = vi.fn(async () => new Response("[]"));
  vi.stubGlobal("fetch", fetch);
  const editor = createPlatformGoalStore(workspace, member, "editor");
  expect(await editor.canDelete()).toBe(false);
  await expect(editor.remove(goal)).rejects.toThrow("Only the workspace owner can delete goals");
  expect(fetch).not.toHaveBeenCalled();

  const owner = createPlatformGoalStore(workspace, member, "owner");
  expect(await owner.canDelete()).toBe(true);
  await owner.remove(goal);
  expect(fetch).toHaveBeenCalledWith(
    `/api/ladders/workspaces/${workspace}/members/${member}/goals/${goal}`,
    expect.objectContaining({ method: "DELETE" })
  );
});
