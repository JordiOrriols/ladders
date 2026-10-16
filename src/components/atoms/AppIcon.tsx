import React from "react";
import { PROJECTS } from "@jordiorriols/ui";

const LaddersIcon = PROJECTS.find((project) => project.id === "ladders")!.icon;

/** The Ladders brand mark; the hosting UI component sets its size and colour. */
export function AppIcon() {
  return <LaddersIcon />;
}
