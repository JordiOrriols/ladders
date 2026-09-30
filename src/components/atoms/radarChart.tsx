import React, { useMemo, useRef, memo, useCallback } from "react";
import { Download } from "lucide-react";
import { Button } from "../ui/button";
import { VERTICALS, LEVELS } from "./levelSelector";
import { downloadRadarImage } from "../../utils/downloadRadarImage";
import type { LevelMap } from "@/types";

export type RadarSeries = {
  id: string;
  label: string;
  levels: LevelMap;
  color: string;
  dashed?: boolean;
  /** Fill opacity, 0 draws only the outline. */
  fill?: number;
  /** Primary series get thicker strokes and larger points. */
  primary?: boolean;
};

export const SERIES_COLORS = {
  current: "#10b981",
  goal: "#fbbf24",
  self: "#c084fc",
  template: "#64748b",
};

type RadarChartProps = {
  series: RadarSeries[];
  size?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  className?: string;
};

function hexToRgba(hex: string, alpha: number) {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

const hasData = (levels: LevelMap) => Object.values(levels).some((v) => v > 0);

function RadarChart({
  series,
  size = 300,
  showLabels = true,
  showLegend = true,
  className = "",
}: RadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const center = size / 2;
  const maxRadius = size / 2 - (showLabels ? 50 : 20);

  const visibleSeries = series.filter((item) => hasData(item.levels));
  const legendSeries = visibleSeries;

  const downloadAsImage = useCallback(() => {
    if (!svgRef.current) return;
    downloadRadarImage(svgRef.current, size);
  }, [size]);

  const getPoint = (verticalIndex: number, level: number) => {
    const angle = (Math.PI * 2 * verticalIndex) / VERTICALS.length - Math.PI / 2;
    const radius = (level / LEVELS.length) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const getLabelPoint = (verticalIndex) => {
    const angle = (Math.PI * 2 * verticalIndex) / VERTICALS.length - Math.PI / 2;
    // Closer spacing for compact layout
    const radius = maxRadius + 10;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const gridLines = useMemo(() => {
    const lines: string[] = [];
    for (let level = 1; level <= LEVELS.length; level++) {
      const points = VERTICALS.map((_, i) => getPoint(i, level));
      const pathData =
        points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
      lines.push(pathData);
    }
    return lines;
  }, [size]);

  const axisLines = useMemo(() => {
    return VERTICALS.map((_, i) => {
      const end = getPoint(i, LEVELS.length);
      return { x1: center, y1: center, x2: end.x, y2: end.y };
    });
  }, [size]);

  const toPath = (levels: LevelMap) =>
    VERTICALS.map((v, i) => getPoint(i, levels[v] || 0))
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ") + " Z";

  // Primary series are drawn last so they stay on top.
  const drawOrder = [...visibleSeries].sort((a, b) => Number(!!a.primary) - Number(!!b.primary));

  return (
    <div className={`flex flex-col items-center relative ${className}`}>
      <Button
        eventId="radar_chart_download"
        onClick={downloadAsImage}
        variant="ghost"
        size="icon"
        className="absolute top-0 right-0 z-10"
        title="Download chart as PNG image"
        aria-label="Download chart as PNG image"
      >
        <Download className="h-4 w-4" />
      </Button>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        className="overflow-visible"
        role="img"
        aria-label="Competency radar chart showing current levels, goal levels, and self-assessment"
      >
        {/* Grid - with improved styling */}
        {gridLines.map((path, i) => (
          <path
            key={i}
            d={path}
            fill="none"
            stroke={i === gridLines.length - 1 ? "#d1d5db" : "#e5e7eb"}
            strokeWidth={i === gridLines.length - 1 ? "1.5" : "1"}
            opacity={0.7}
          />
        ))}

        {/* Axes - more prominent */}
        {axisLines.map((line, i) => (
          <line key={i} {...line} stroke="#9ca3af" strokeWidth="1.2" opacity="0.6" />
        ))}

        {drawOrder.map((s) => (
          <path
            key={`area-${s.id}`}
            data-series={s.id}
            d={toPath(s.levels)}
            fill={s.fill ? hexToRgba(s.color, s.fill) : "none"}
            stroke={s.color}
            strokeWidth={s.primary ? "3" : "2.5"}
            strokeDasharray={s.dashed ? "6 4" : undefined}
            opacity={s.primary ? "0.95" : "0.85"}
          />
        ))}

        {drawOrder.map((s) =>
          VERTICALS.map((v, i) => {
            const level = s.levels[v] || 0;
            if (level === 0) return null;
            const point = getPoint(i, level);
            return (
              <g key={`${s.id}-${i}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={s.primary ? "7" : "6"}
                  fill={hexToRgba(s.color, 0.15)}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={s.primary ? "5.5" : "4.5"}
                  fill={s.color}
                  stroke="white"
                  strokeWidth={s.primary ? "2.5" : "2"}
                />
              </g>
            );
          })
        )}

        {/* Labels */}
        {showLabels &&
          VERTICALS.map((v, i) => {
            const angle = (Math.PI * 2 * i) / VERTICALS.length - Math.PI / 2;
            const point = getLabelPoint(i);

            // Determine text alignment based on position
            let textAnchor: "start" | "middle" | "end" | "inherit" = "middle";
            let dominantBaseline: "auto" | "middle" | "hanging" | "inherit" = "middle";

            // Adjust positioning based on angle for better alignment
            const angleDeg = (angle * 180) / Math.PI + 90;

            if (angleDeg > 315 || angleDeg < 45) {
              // Top
              textAnchor = "middle";
              dominantBaseline = "auto";
            } else if (angleDeg >= 45 && angleDeg < 135) {
              // Right
              textAnchor = "start";
              dominantBaseline = "middle";
            } else if (angleDeg >= 135 && angleDeg < 225) {
              // Bottom
              textAnchor = "middle";
              dominantBaseline = "hanging";
            } else {
              // Left
              textAnchor = "end";
              dominantBaseline = "middle";
            }

            return (
              <text
                key={i}
                x={point.x}
                y={point.y}
                textAnchor={textAnchor}
                dominantBaseline={dominantBaseline}
                className="text-xs font-semibold fill-slate-500"
                letterSpacing="0.5"
              >
                {v}
              </text>
            );
          })}

        {/* Level numbers on first axis */}
        {showLabels &&
          Array.from({ length: LEVELS.length }, (_, i) => {
            const level = i + 1;
            const point = getPoint(0, level);
            return (
              <text
                key={`level-${i}`}
                x={point.x - 12}
                y={point.y}
                className="text-[10px] fill-slate-400"
                dominantBaseline="middle"
                textAnchor="end"
              >
                {level}
              </text>
            );
          })}
      </svg>

      {showLegend && legendSeries.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
          {legendSeries.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${s.dashed ? "border-2 border-dashed" : ""}`}
                style={s.dashed ? { borderColor: s.color } : { backgroundColor: s.color }}
              />
              <span className="text-xs text-slate-600">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(RadarChart);
