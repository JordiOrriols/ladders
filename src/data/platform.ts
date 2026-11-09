import type {
  Evaluation,
  EvaluationInput,
  EvaluationStatus,
  GoalComment,
  SmartGoal,
  SmartGoalInput,
} from "../types";
import { VERTICALS } from "../components/atoms/levelSelector";

export interface PlatformWorkspace {
  id: string;
  name: string;
  role: "owner" | "editor" | "viewer";
}
export interface PlatformMemberProfile {
  id: string;
  name: string;
  role: string;
  planning_role: PlatformRoster["members"][number]["planning_role"];
  template_id: string | null;
  workspace_id: string;
  workspace_name: string;
}
export interface PlatformMemberEvaluations {
  member: PlatformMemberProfile;
  evaluations: Evaluation[];
}
export interface PlatformTeam {
  id: string;
  name: string;
}
export interface PlatformRoster {
  teams: PlatformTeam[];
  members: {
    id: string;
    team_id: string;
    name: string;
    role: string;
    planning_role: "backend" | "frontend" | "design" | "qa" | null;
    template_id: string | null;
  }[];
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid API response");
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid API response");
  return value;
}
function uuid(value: unknown): string {
  const result = text(value);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result))
    throw new Error("Invalid workspace or team ID");
  return result;
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error("Invalid API response");
  return value;
}
function role(value: unknown): PlatformWorkspace["role"] {
  if (value !== "owner" && value !== "editor" && value !== "viewer")
    throw new Error("Invalid Ladders access role");
  return value;
}
function planningRole(value: unknown): PlatformRoster["members"][number]["planning_role"] {
  if (
    value !== null &&
    value !== "backend" &&
    value !== "frontend" &&
    value !== "design" &&
    value !== "qa"
  )
    throw new Error("Invalid planning role");
  return value;
}
function roster(value: unknown): PlatformRoster {
  const data = object(value);
  return {
    teams: array(data["teams"]).map((value) => {
      const row = object(value);
      return { id: uuid(row["id"]), name: text(row["name"]) };
    }),
    members: array(data["members"]).map((value) => {
      const row = object(value);
      return {
        id: uuid(row["id"]),
        team_id: uuid(row["team_id"]),
        name: text(row["name"]),
        role: text(row["role"]),
        planning_role: planningRole(row["planning_role"]),
        template_id: row["template_id"] === null ? null : text(row["template_id"]),
      };
    }),
  };
}
function memberProfile(value: unknown): PlatformMemberProfile {
  const row = object(value);
  return {
    id: uuid(row["id"]),
    name: text(row["name"]),
    role: text(row["role"]),
    planning_role: planningRole(row["planning_role"]),
    template_id: row["template_id"] === null ? null : text(row["template_id"]),
    workspace_id: uuid(row["workspace_id"]),
    workspace_name: text(row["workspace_name"]),
  };
}
function competencyMap<T>(value: unknown, parse: (value: unknown) => T): Record<string, T> {
  return Object.fromEntries(
    Object.entries(object(value)).map(([key, value]) => {
      if (!VERTICALS.includes(key)) throw new Error("Invalid API response");
      return [key, parse(value)];
    })
  );
}
function levels(value: unknown): Record<string, number> {
  return competencyMap(value, (value) => {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 5.5 ||
      !Number.isInteger(value * 2)
    )
      throw new Error("Invalid API response");
    return value;
  });
}
function evaluation(value: unknown): Evaluation {
  const row = object(value);
  if (row["kind"] !== "manager" && row["kind"] !== "self" && row["kind"] !== "peer")
    throw new Error("Invalid API response");
  if (row["status"] !== "draft" && row["status"] !== "published")
    throw new Error("Invalid API response");
  const createdAt = text(row["created_at"]);
  if (!Number.isFinite(Date.parse(createdAt))) throw new Error("Invalid API response");
  return {
    id: uuid(row["id"]),
    memberId: uuid(row["member_id"]),
    kind: row["kind"],
    status: row["status"],
    authorName: row["author_name"] === null ? null : text(row["author_name"]),
    currentLevels: levels(row["current_levels"]),
    goalLevels: levels(row["goal_levels"]),
    comments: competencyMap(row["comments"], text),
    commentVisibility: competencyMap(row["comment_visibility"], (value) => {
      if (typeof value !== "boolean") throw new Error("Invalid API response");
      return value;
    }),
    createdAt,
  };
}
function evaluationHistory(value: unknown, member: string): Evaluation[] {
  const result = array(value).map(evaluation);
  if (
    result.some(
      (evaluation) =>
        evaluation.memberId !== member ||
        (evaluation.kind === "self" && evaluation.status === "draft")
    )
  )
    throw new Error("Invalid API response");
  return result;
}
function evaluationContent(input: EvaluationInput) {
  return {
    current_levels: levels(input.currentLevels),
    goal_levels: levels(input.goalLevels),
    comments: competencyMap(input.comments, (value) => {
      const comment = text(value);
      if (Array.from(comment).length > 2000) throw new Error("Invalid evaluation content");
      return comment;
    }),
  };
}
function personalEvaluations(
  value: unknown,
  member: string,
  selfOnly = false
): PlatformMemberEvaluations {
  const row = object(value);
  const profile = memberProfile(row["member"]);
  const evaluations = array(row["evaluations"]).map(evaluation);
  if (
    profile.id !== member ||
    evaluations.some(
      (evaluation) =>
        evaluation.memberId !== member ||
        (selfOnly
          ? evaluation.kind !== "self"
          : evaluation.kind !== "self" && evaluation.status !== "published") ||
        Object.keys(evaluation.commentVisibility ?? {}).length > 0
    )
  )
    throw new Error("Invalid API response");
  return { member: profile, evaluations };
}
function calendarDate(value: unknown): string {
  const date = text(value);
  const parsed = new Date(`${date}T00:00:00Z`);
  if (
    !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  )
    throw new Error("Invalid API response");
  return date;
}
function goalComment(value: unknown): GoalComment {
  const row = object(value);
  const createdAt = text(row["createdAt"]);
  const authorKind = row["authorKind"];
  const comment = text(row["text"]);
  if (
    !Number.isFinite(Date.parse(createdAt)) ||
    (authorKind !== "manager" && authorKind !== "member" && authorKind !== "legacy") ||
    !comment.trim() ||
    Array.from(comment).length > 10000
  )
    throw new Error("Invalid API response");
  return { id: uuid(row["id"]), text: comment, createdAt, authorKind };
}
function smartGoal(value: unknown): SmartGoal {
  const row = object(value);
  const title = text(row["title"]);
  const progress = row["progress"];
  const createdAt = text(row["created_at"]);
  const updatedAt = text(row["updated_at"]);
  if (
    !title.trim() ||
    Array.from(title).length > 160 ||
    typeof progress !== "number" ||
    !Number.isInteger(progress) ||
    progress < 0 ||
    progress > 100 ||
    !Number.isFinite(Date.parse(createdAt)) ||
    !Number.isFinite(Date.parse(updatedAt))
  )
    throw new Error("Invalid API response");
  return {
    id: uuid(row["id"]),
    memberId: uuid(row["member_id"]),
    title,
    description: text(row["description"]),
    dueDate: row["due_date"] === null ? null : calendarDate(row["due_date"]),
    progress,
    comments: array(row["comments"]).map(goalComment),
    createdAt,
    updatedAt,
  };
}
function smartGoalHistory(value: unknown, member: string): SmartGoal[] {
  const result = array(value).map(smartGoal);
  if (result.some((goal) => goal.memberId !== member)) throw new Error("Invalid API response");
  return result;
}
function smartGoalContent(input: SmartGoalInput) {
  if (
    !input.title.trim() ||
    Array.from(input.title.trim()).length > 160 ||
    typeof input.description !== "string" ||
    !Number.isInteger(input.progress) ||
    input.progress < 0 ||
    input.progress > 100
  )
    throw new Error("Invalid SMART goal");
  return {
    title: input.title.trim(),
    description: input.description,
    due_date: input.dueDate === null ? null : calendarDate(input.dueDate),
    progress: input.progress,
  };
}
async function request(path: string, body?: unknown, method = "GET"): Promise<unknown> {
  const response = await fetch(`/api/${path}`, {
    credentials: "same-origin",
    method,
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const body = object(await response.json());
      if (typeof body["message"] === "string") throw new Error(body["message"]);
    }
    throw new Error(`API request failed (${response.status})`);
  }
  return response.json();
}
const path = (workspace: string) => `ladders/workspaces/${uuid(workspace)}/teams`;
type ProfileInput = Pick<
  PlatformRoster["members"][number],
  "name" | "role" | "planning_role" | "template_id"
>;
function profileInput(input: ProfileInput): ProfileInput {
  if (
    !input.name.trim() ||
    Array.from(input.name.trim()).length > 120 ||
    Array.from(input.role.trim()).length > 120 ||
    (input.template_id !== null && Array.from(input.template_id).length > 10)
  )
    throw new Error("Invalid member profile");
  return {
    name: input.name.trim(),
    role: input.role.trim(),
    planning_role: planningRole(input.planning_role),
    template_id: input.template_id,
  };
}
export const platformRepository = {
  myMembers: async (): Promise<PlatformMemberProfile[]> =>
    array(await request("ladders/me/members")).map(memberProfile),
  myEvaluations: async (member: string): Promise<PlatformMemberEvaluations> => {
    const memberId = uuid(member);
    return personalEvaluations(
      await request(`ladders/me/members/${memberId}/evaluations`),
      memberId
    );
  },
  mySelfEvaluations: async (member: string): Promise<PlatformMemberEvaluations> => {
    const memberId = uuid(member);
    return personalEvaluations(
      await request(`ladders/me/members/${memberId}/self-evaluations`),
      memberId,
      true
    );
  },
  saveMyEvaluation: async (
    member: string,
    id: string | null,
    input: EvaluationInput
  ): Promise<Evaluation> => {
    const memberId = uuid(member);
    const result = evaluation(
      await request(
        `ladders/me/members/${memberId}/self-evaluations${id ? `/${uuid(id)}` : ""}`,
        evaluationContent(input),
        id ? "PATCH" : "POST"
      )
    );
    if (
      result.memberId !== memberId ||
      result.kind !== "self" ||
      result.status !== "draft" ||
      (id !== null && result.id !== id) ||
      Object.keys(result.commentVisibility ?? {}).length > 0
    )
      throw new Error("Invalid API response");
    return result;
  },
  publishMyEvaluation: async (member: string, id: string): Promise<Evaluation> => {
    const memberId = uuid(member);
    const evaluationId = uuid(id);
    const result = evaluation(
      await request(
        `ladders/me/members/${memberId}/self-evaluations/${evaluationId}/publish`,
        undefined,
        "POST"
      )
    );
    if (
      result.memberId !== memberId ||
      result.id !== evaluationId ||
      result.kind !== "self" ||
      result.status !== "published" ||
      Object.keys(result.commentVisibility ?? {}).length > 0
    )
      throw new Error("Invalid API response");
    return result;
  },
  goals: async (workspace: string, member: string): Promise<SmartGoal[]> => {
    const memberId = uuid(member);
    return smartGoalHistory(
      await request(`ladders/workspaces/${uuid(workspace)}/members/${memberId}/goals`),
      memberId
    );
  },
  saveGoal: async (
    workspace: string,
    member: string,
    id: string | null,
    input: SmartGoalInput
  ): Promise<SmartGoal> => {
    const memberId = uuid(member);
    const goal = smartGoal(
      await request(
        `ladders/workspaces/${uuid(workspace)}/members/${memberId}/goals${id ? `/${uuid(id)}` : ""}`,
        smartGoalContent(input),
        id ? "PATCH" : "POST"
      )
    );
    if (goal.memberId !== memberId || (id !== null && goal.id !== id))
      throw new Error("Invalid API response");
    return goal;
  },
  appendGoalComment: async (
    workspace: string,
    member: string,
    id: string,
    textValue: string
  ): Promise<SmartGoal> => {
    const memberId = uuid(member);
    const goalId = uuid(id);
    const comment = textValue.trim();
    if (!comment || Array.from(comment).length > 10000)
      throw new Error("Comment must contain 1 to 10000 characters");
    const goal = smartGoal(
      await request(
        `ladders/workspaces/${uuid(workspace)}/members/${memberId}/goals/${goalId}/comments`,
        { text: comment },
        "POST"
      )
    );
    if (goal.memberId !== memberId || goal.id !== goalId) throw new Error("Invalid API response");
    return goal;
  },
  deleteGoal: async (workspace: string, member: string, id: string): Promise<void> => {
    const memberId = uuid(member);
    const goalId = uuid(id);
    const remaining = smartGoalHistory(
      await request(
        `ladders/workspaces/${uuid(workspace)}/members/${memberId}/goals/${goalId}`,
        undefined,
        "DELETE"
      ),
      memberId
    );
    if (remaining.some((goal) => goal.id === goalId)) throw new Error("Invalid API response");
  },
  saveEvaluation: async (
    workspace: string,
    member: string,
    id: string | null,
    input: EvaluationInput
  ): Promise<Evaluation> => {
    const content = evaluationContent(input);
    const result = evaluation(
      await request(
        `ladders/workspaces/${uuid(workspace)}/members/${uuid(member)}/evaluations${id ? `/${uuid(id)}` : ""}`,
        content,
        id ? "PATCH" : "POST"
      )
    );
    if (
      result.memberId !== member ||
      result.kind !== "manager" ||
      result.status !== "draft" ||
      (id !== null && result.id !== id)
    )
      throw new Error("Invalid API response");
    return result;
  },
  setEvaluationStatus: async (
    workspace: string,
    member: string,
    id: string,
    status: EvaluationStatus
  ): Promise<Evaluation> => {
    if (status !== "draft" && status !== "published") throw new Error("Invalid evaluation status");
    const result = evaluation(
      await request(
        `ladders/workspaces/${uuid(workspace)}/members/${uuid(member)}/evaluations/${uuid(id)}/status`,
        { status },
        "PATCH"
      )
    );
    if (
      result.memberId !== member ||
      result.id !== id ||
      result.kind === "self" ||
      result.status !== status
    )
      throw new Error("Invalid API response");
    return result;
  },
  deleteEvaluation: async (
    workspace: string,
    member: string,
    id: string
  ): Promise<Evaluation[]> => {
    const memberId = uuid(member);
    const removed = uuid(id);
    const result = evaluationHistory(
      await request(
        `ladders/workspaces/${uuid(workspace)}/members/${memberId}/evaluations/${removed}`,
        undefined,
        "DELETE"
      ),
      memberId
    );
    if (result.some((item) => item.id === removed)) throw new Error("Invalid API response");
    return result;
  },
  setCommentVisibility: async (
    workspace: string,
    member: string,
    evaluation: string,
    category: string,
    visible: boolean
  ): Promise<Evaluation[]> => {
    if (!VERTICALS.includes(category) || typeof visible !== "boolean")
      throw new Error("Choose an existing competency comment");
    const id = uuid(member);
    return evaluationHistory(
      await request(
        `ladders/workspaces/${uuid(workspace)}/members/${id}/evaluations/${uuid(evaluation)}/comments/${category}`,
        { visible },
        "PATCH"
      ),
      id
    );
  },
  evaluations: async (workspace: string, member: string): Promise<Evaluation[]> => {
    const id = uuid(member);
    return evaluationHistory(
      await request(`ladders/workspaces/${uuid(workspace)}/members/${id}/evaluations`),
      id
    );
  },
  moveMember: async (workspace: string, member: string, team: string) =>
    roster(
      await request(
        `ladders/workspaces/${uuid(workspace)}/members/${uuid(member)}/teams/${uuid(team)}`,
        undefined,
        "PATCH"
      )
    ),
  createMember: async (workspace: string, team: string, input: ProfileInput): Promise<string> => {
    const result = object(
      await request(`${path(workspace)}/${uuid(team)}/members`, profileInput(input), "POST")
    );
    return uuid(result["id"]);
  },
  deleteMember: async (workspace: string, member: string) =>
    roster(
      await request(
        `ladders/workspaces/${uuid(workspace)}/members/${uuid(member)}`,
        undefined,
        "DELETE"
      )
    ),
  deleteTeam: async (workspace: string, team: string) =>
    roster(await request(`${path(workspace)}/${uuid(team)}`, undefined, "DELETE")),
  workspaces: async (): Promise<PlatformWorkspace[]> =>
    array(await request("apps/ladders/workspaces")).map((value) => {
      const row = object(value);
      return { id: uuid(row["id"]), name: text(row["name"]), role: role(row["role"]) };
    }),
  teams: async (workspace: string) => roster(await request(path(workspace))),
  saveTeam: async (workspace: string, name: string, team: string | null) => {
    if (!name.trim() || name.trim().length > 120)
      throw new Error("Team names need between 1 and 120 characters");
    return roster(
      await request(
        `${path(workspace)}${team ? `/${uuid(team)}` : ""}`,
        { name: name.trim() },
        team ? "PATCH" : "POST"
      )
    );
  },
  saveProfile: async (workspace: string, member: string, input: ProfileInput) => {
    return roster(
      await request(
        `ladders/workspaces/${uuid(workspace)}/members/${uuid(member)}`,
        profileInput(input),
        "PATCH"
      )
    );
  },
};
