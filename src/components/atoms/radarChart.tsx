import React, { memo } from "react";
import { RadarChart as RadarChartView, type RadarChartProps } from "@jordiorriols/ui";
import { VERTICALS, LEVELS } from "./levelSelector";
import { downloadRadarImage } from "../../utils/downloadRadarImage";

export type { RadarSeries } from "@jordiorriols/ui";
export const SERIES_COLORS = {
  current: "#10b981",
  goal: "#fbbf24",
  self: "#c084fc",
  template: "#64748b",
};

type Props = Pick<RadarChartProps, "series" | "size" | "showLabels" | "showLegend" | "className">;
function RadarChart(props: Props) {
  return (
    <RadarChartView
      {...props}
      axes={VERTICALS}
      maxLevel={LEVELS.length}
      label="Competency radar chart showing current levels, goal levels, and self-assessment"
      downloadLabel="Download chart as PNG image"
      onDownload={downloadRadarImage}
    />
  );
}
export default memo(RadarChart);
