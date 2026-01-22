import React, { useMemo, useRef } from "react";
import { Download } from "lucide-react";
import { Button } from "../ui/button";
import { VERTICALS, LEVELS } from "./levelSelector";

export default function RadarChart({
  currentLevels = {},
  goalLevels = {},
  selfAssessmentLevels = {},
  size = 300,
  showLabels = true,
  showLegend = true,
  hideGoal = false,
  className = "",
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const center = size / 2;
  const maxRadius = size / 2 - (showLabels ? 50 : 20);

  // Hide goal levels when hideGoal is true
  const displayGoalLevels = hideGoal ? {} : goalLevels;

  const downloadAsImage = () => {
    if (!svgRef.current) return;

    const svg = svgRef.current;

    // Clone SVG and reduce text sizes
    const svgClone = svg.cloneNode(true) as SVGSVGElement;

    // Reduce text font sizes by 40% for better proportion
    const textElements = svgClone.querySelectorAll("text");
    textElements.forEach((text) => {
      const currentClass = text.getAttribute("class") || "";
      // Reduce font size classes
      const newClass = currentClass
        .replace("text-xs", "text-[9px]")
        .replace("text-[10px]", "text-[7px]");
      text.setAttribute("class", newClass);
    });

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) return;

    // Use 2.5x scale for high resolution
    const scale = 2.5;
    const scaledSize = size * scale;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Set canvas to high resolution
      canvas.width = scaledSize;
      canvas.height = scaledSize;

      // Fill with white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, scaledSize, scaledSize);

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Scale context and draw the image
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      // Export as high-quality PNG
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const link = document.createElement("a");
            link.download = `radar-chart-${Date.now()}.png`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
          }
        },
        "image/png",
        0.95
      );
    };

    img.src = url;
  };

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

  const currentPath = useMemo(() => {
    const points = VERTICALS.map((v, i) => getPoint(i, currentLevels[v] || 0));
    if (points.every((p) => p.x === center && p.y === center)) return null;
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  }, [currentLevels, size]);

  const goalPath = useMemo(() => {
    const points = VERTICALS.map((v, i) => getPoint(i, displayGoalLevels[v] || 0));
    if (points.every((p) => p.x === center && p.y === center)) return null;
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  }, [displayGoalLevels, size]);

  const selfAssessmentPath = useMemo(() => {
    const points = VERTICALS.map((v, i) => getPoint(i, selfAssessmentLevels[v] || 0));
    if (points.every((p) => p.x === center && p.y === center)) return null;
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  }, [selfAssessmentLevels, size]);

  return (
    <div className={`flex flex-col items-center relative ${className}`}>
      <Button
        onClick={downloadAsImage}
        variant="ghost"
        size="icon"
        className="absolute top-0 right-0 z-10"
        title="Download as PNG"
      >
        <Download className="h-4 w-4" />
      </Button>
      <svg ref={svgRef} width={size} height={size} className="overflow-visible">
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

        {/* Goal area - with enhanced styling */}
        {goalPath && (
          <path
            d={goalPath}
            fill="rgba(245, 158, 11, 0.12)"
            stroke="#fbbf24"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            opacity="0.85"
          />
        )}

        {/* Self Assessment area - with enhanced styling */}
        {selfAssessmentPath && (
          <path
            d={selfAssessmentPath}
            fill="rgba(168, 85, 247, 0.1)"
            stroke="#c084fc"
            strokeWidth="2.5"
            strokeDasharray="4 2"
            opacity="0.8"
          />
        )}

        {/* Current area - more prominent */}
        {currentPath && (
          <path
            d={currentPath}
            fill="rgba(16, 185, 129, 0.18)"
            stroke="#10b981"
            strokeWidth="3"
            opacity="0.95"
          />
        )}

        {/* Current points - with enhanced styling */}
        {VERTICALS.map((v, i) => {
          const level = currentLevels[v] || 0;
          if (level === 0) return null;
          const point = getPoint(i, level);
          return (
            <g key={`current-${i}`}>
              {/* Soft shadow/glow effect */}
              <circle cx={point.x} cy={point.y} r="7" fill="rgba(16, 185, 129, 0.15)" />
              {/* Main point */}
              <circle
                cx={point.x}
                cy={point.y}
                r="5.5"
                fill="#10b981"
                stroke="white"
                strokeWidth="2.5"
              />
            </g>
          );
        })}

        {/* Goal points - with enhanced styling */}
        {VERTICALS.map((v, i) => {
          const level = goalLevels[v] || 0;
          if (level === 0) return null;
          const point = getPoint(i, level);
          return (
            <g key={`goal-${i}`}>
              {/* Soft shadow/glow effect */}
              <circle cx={point.x} cy={point.y} r="6" fill="rgba(251, 191, 36, 0.1)" />
              {/* Main point */}
              <circle
                cx={point.x}
                cy={point.y}
                r="4.5"
                fill="#fbbf24"
                stroke="white"
                strokeWidth="2"
              />
            </g>
          );
        })}

        {/* Self Assessment points - with enhanced styling */}
        {VERTICALS.map((v, i) => {
          const level = selfAssessmentLevels[v] || 0;
          if (level === 0) return null;
          const point = getPoint(i, level);
          return (
            <g key={`self-${i}`}>
              {/* Soft shadow/glow effect */}
              <circle cx={point.x} cy={point.y} r="6" fill="rgba(192, 132, 252, 0.1)" />
              {/* Main point */}
              <circle
                cx={point.x}
                cy={point.y}
                r="4.5"
                fill="#c084fc"
                stroke="white"
                strokeWidth="2"
              />
            </g>
          );
        })}

        {/* Labels */}
        {showLabels &&
          VERTICALS.map((v, i) => {
            const angle = (Math.PI * 2 * i) / VERTICALS.length - Math.PI / 2;
            const point = getLabelPoint(i);

            // Determine text alignment based on position
            let textAnchor = "middle";
            let dominantBaseline = "middle";

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

      {showLegend && (
        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-600">Current</span>
          </div>
          {!hideGoal && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-slate-600">Goal</span>
            </div>
          )}
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
