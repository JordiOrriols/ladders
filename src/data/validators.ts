import type { CommentMap, Evaluation, LevelMap, TeamMember } from "@/types";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const isLevelMap = (value: unknown): value is LevelMap =>
  isRecord(value) && Object.values(value).every((v) => typeof v === "number");

const isCommentMap = (value: unknown): value is CommentMap =>
  isRecord(value) && Object.values(value).every((v) => typeof v === "string");

const isOptionalString = (value: unknown) => typeof value === "string" || value == null;

export const isEvaluation = (value: unknown): value is Evaluation =>
  isRecord(value) &&
  typeof value["id"] === "string" &&
  typeof value["memberId"] === "string" &&
  ["manager", "self", "peer"].includes(value["kind"] as string) &&
  ["draft", "published"].includes(value["status"] as string) &&
  isOptionalString(value["authorName"]) &&
  isLevelMap(value["currentLevels"]) &&
  isLevelMap(value["goalLevels"]) &&
  isCommentMap(value["comments"]) &&
  typeof value["createdAt"] === "string";

export const isTeamMember = (value: unknown): value is TeamMember =>
  isRecord(value) &&
  typeof value["id"] === "string" &&
  typeof value["name"] === "string" &&
  typeof value["role"] === "string" &&
  isOptionalString(value["templateId"]) &&
  typeof value["viewEnabled"] === "boolean" &&
  typeof value["createdAt"] === "string";
