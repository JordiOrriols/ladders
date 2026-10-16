import React, { memo } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const axes = VERTICALS.map((vertical) => t(`verticals.${vertical}`));
  return (
    <RadarChartView
      {...props}
      axes={axes}
      series={props.series.map((series) => ({
        ...series,
        levels: Object.fromEntries(
          VERTICALS.map((vertical, index) => [axes[index]!, series.levels[vertical] ?? 0])
        ),
      }))}
      maxLevel={LEVELS.length}
      label={t("chart.description")}
      downloadLabel={t("chart.download")}
      onDownload={downloadRadarImage}
    />
  );
}
export default memo(RadarChart);
