import React from "react";
import { ProfileCard } from "@jordiorriols/ui";
import type { Member } from "@/types";
import RadarChart, { SERIES_COLORS } from "./radarChart";

interface MemberCardProps {
  member: Member;
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
  onClick?: () => void;
  readOnly?: boolean;
  draggable?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
}

export default function MemberCard({ member, onEdit, onDelete, ...props }: MemberCardProps) {
  return (
    <ProfileCard
      {...props}
      id={member.id}
      name={member.name}
      {...(member.role ? { subtitle: member.role } : {})}
      onEdit={() => onEdit(member)}
      onDelete={() => onDelete(member.id)}
      editLabel={`Edit ${member.name}`}
      deleteLabel={`Delete ${member.name}`}
    >
      <RadarChart
        series={[
          {
            id: "goal",
            label: "Goal",
            levels: member.goalLevels,
            color: SERIES_COLORS.goal,
            dashed: true,
          },
          ...(member.selfAssessmentLevels
            ? [
                {
                  id: "self",
                  label: "Self Assessment",
                  levels: member.selfAssessmentLevels,
                  color: SERIES_COLORS.self,
                  dashed: true,
                },
              ]
            : []),
          {
            id: "current",
            label: "Current",
            levels: member.currentLevels,
            color: SERIES_COLORS.current,
            primary: true,
          },
        ]}
        size={180}
        showLabels={false}
        showLegend={false}
      />
    </ProfileCard>
  );
}
