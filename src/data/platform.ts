export interface PlatformWorkspace {
  id: string;
  name: string;
  role: "owner" | "editor" | "viewer";
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
      };
    }),
  };
}
async function request(path: string, name?: string, method = "GET"): Promise<unknown> {
  const response = await fetch(`/api/${path}`, {
    credentials: "same-origin",
    method,
    headers: {
      Accept: "application/json",
      ...(name === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(name === undefined ? {} : { body: JSON.stringify({ name }) }),
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
export const platformRepository = {
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
        name.trim(),
        team ? "PATCH" : "POST"
      )
    );
  },
};
