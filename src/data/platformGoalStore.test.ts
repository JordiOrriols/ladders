import { afterEach, expect, it, vi } from "vitest";
import { createPlatformGoalStore } from "./platformGoalStore";

const workspace = "11111111-1111-4111-8111-111111111111";
const member = "22222222-2222-4222-8222-222222222222";
const goal = "33333333-3333-4333-8333-333333333333";
afterEach(() => vi.unstubAllGlobals());

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
