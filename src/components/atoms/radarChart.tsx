import React, { useMemo } from "react";
import { VERTICALS, LEVELS } from "./levelSelector";

export default function RadarChart({
  currentLevels = {},
  goalLevels = {},
  selfAssessmentLevels = {},
  size = 300,
  showLabels = true,
  showLegend = true,
  className = "",
}) {
  const center = size / 2;
  const maxRadius = size / 2 - (showLabels ? 50 : 20);

  const getPoint = (verticalIndex, level) => {
    const angle = (Math.PI * 2 * verticalIndex) / VERTICALS.length - Math.PI / 2;
    const radius = (level / LEVELS.length) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const getLabelPoint = (verticalIndex) => {
    const angle = (Math.PI * 2 * verticalIndex) / VERTICALS.length - Math.PI / 2;
    const radius = maxRadius + 30;
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

  const currentPath = useMemo(() => {
    const points = VERTICALS.map((v, i) => getPoint(i, currentLevels[v] || 0));
    if (points.every((p) => p.x === center && p.y === center)) return null;
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  }, [currentLevels, size]);

  const goalPath = useMemo(() => {
    const points = VERTICALS.map((v, i) => getPoint(i, goalLevels[v] || 0));
    if (points.every((p) => p.x === center && p.y === center)) return null;
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  }, [goalLevels, size]);

  const selfAssessmentPath = useMemo(() => {
    const points = VERTICALS.map((v, i) => getPoint(i, selfAssessmentLevels[v] || 0));
    if (points.every((p) => p.x === center && p.y === center)) return null;
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  }, [selfAssessmentLevels, size]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid */}
        {gridLines.map((path, i) => (
          <path key={i} d={path} fill="none" stroke="#e2e8f0" strokeWidth="1" />
        ))}

        {/* Axes */}
        {axisLines.map((line, i) => (
          <line key={i} {...line} stroke="#cbd5e1" strokeWidth="1" />
        ))}

        {/* Goal area */}
        {goalPath && (
          <path
            d={goalPath}
            fill="rgba(245, 158, 11, 0.15)"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
        )}

        {/* Self Assessment area */}
        {selfAssessmentPath && (
          <path
            d={selfAssessmentPath}
            fill="rgba(168, 85, 247, 0.15)"
            stroke="#a855f7"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
        )}

        {/* Current area */}
        {currentPath && (
          <path d={currentPath} fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="2.5" />
        )}

        {/* Current points */}
        {VERTICALS.map((v, i) => {
          const level = currentLevels[v] || 0;
          if (level === 0) return null;
          const point = getPoint(i, level);
          return (
            <circle
              key={`current-${i}`}
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#10b981"
              stroke="white"
              strokeWidth="2"
            />
          );
        })}

        {/* Goal points */}
        {VERTICALS.map((v, i) => {
          const level = goalLevels[v] || 0;
          if (level === 0) return null;
          const point = getPoint(i, level);
          return (
            <circle
              key={`goal-${i}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#f59e0b"
              stroke="white"
              strokeWidth="2"
            />
          );
        })}

        {/* Self Assessment points */}
        {VERTICALS.map((v, i) => {
          const level = selfAssessmentLevels[v] || 0;
          if (level === 0) return null;
          const point = getPoint(i, level);
          return (
            <circle
              key={`self-${i}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#a855f7"
              stroke="white"
              strokeWidth="2"
            />
          );
        })}

        {/* Labels */}
        {showLabels &&
          VERTICALS.map((v, i) => {
            const point = getLabelPoint(i);
            const isTop = i === 0;
            const isRight = i === 1 || i === 4;
            const isLeft = i === 2 || i === 3;

            return (
              <text
                key={i}
                x={point.x}
                y={point.y}
                textAnchor={isTop ? "middle" : isRight ? "start" : isLeft ? "end" : "middle"}
                dominantBaseline={isTop ? "auto" : "middle"}
                className="text-xs font-medium fill-slate-600"
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
                x={point.x + 8}
                y={point.y}
                className="text-[10px] fill-slate-400"
                dominantBaseline="middle"
              >
                {level}
              </text>
            );
          })}
      </svg>

      {showLegend && (
        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-600">Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-slate-600">Goal</span>
          </div>
          {Object.keys(selfAssessmentLevels).length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-xs text-slate-600">Self Assessment</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
