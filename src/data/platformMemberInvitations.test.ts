import { afterEach, expect, it, vi } from "vitest";
import { platformRepository } from "./platform";

const workspace = "11111111-1111-4111-8111-111111111111";
const member = "22222222-2222-4222-8222-222222222222";
const recipient = "33333333-3333-4333-8333-333333333333";
afterEach(() => vi.unstubAllGlobals());

it("uses exact account UUIDs and validates member invitation responses", async () => {
  const fetch = vi.fn(async () => new Response('{"linked":false,"invited":true}'));
  vi.stubGlobal("fetch", fetch);
  expect(await platformRepository.inviteMember(workspace, member, recipient)).toEqual({
    linked: false,
    invited: true,
  });
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/workspaces/${workspace}/members/${member}/invitations/recipients/${recipient}`,
    expect.objectContaining({ method: "POST" })
  );
  await expect(
    platformRepository.inviteMember(workspace, member, "someone@example.com")
  ).rejects.toThrow("Invalid workspace or team ID");
  fetch.mockImplementation(async () => new Response('{"linked":"false","invited":true}'));
  await expect(platformRepository.memberAccountLink(workspace, member)).rejects.toThrow(
    "Invalid API response"
  );
  fetch.mockImplementation(
    async () =>
      new Response(
        JSON.stringify([
          {
            id: recipient,
            member_id: member,
            name: "Member",
            workspace_name: "Workspace",
            expires_at: "2026-12-01T00:00:00Z",
          },
        ])
      )
  );
  expect(await platformRepository.myMemberInvitations()).toHaveLength(1);
  fetch.mockImplementation(
    async () => new Response(JSON.stringify({ accepted: true, member_id: member }))
  );
  expect(await platformRepository.answerMemberInvitation(recipient, true)).toBe(member);
  expect(fetch).toHaveBeenLastCalledWith(
    `/api/ladders/me/member-invitations/${recipient}/accept`,
    expect.objectContaining({ method: "POST" })
  );
  await expect(platformRepository.answerMemberInvitation(recipient, false)).rejects.toThrow(
    "Invalid API response"
  );
  fetch.mockImplementation(
    async () =>
      new Response('{"message":"Member invitation unavailable"}', {
        status: 404,
        headers: { "content-type": "application/json" },
      })
  );
  await expect(platformRepository.answerMemberInvitation(recipient, true)).rejects.toThrow(
    "Member invitation unavailable"
  );
});
