"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { TrafficPoint } from "@/content/adminDashboard";

interface TrafficChartProps {
  data: TrafficPoint[];
}

export function TrafficChart({ data }: TrafficChartProps) {
  const [activeLine, setActiveLine] = useState<"pv" | "uv">("pv");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => Math.max(d.pv, d.uv))) * 1.15;
  const stepX = chartW / (data.length - 1);

  const getY = (val: number) => padding.top + chartH - (val / maxVal) * chartH;
  const getX = (i: number) => padding.left + i * stepX;

  const buildPath = (key: "pv" | "uv") =>
    data
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d[key])}`)
      .join(" ");

  const buildArea = (key: "pv" | "uv") =>
    `${buildPath(key)} L ${getX(data.length - 1)} ${padding.top + chartH} L ${getX(0)} ${padding.top + chartH} Z`;

  const pvColor = "#f97316";
  const uvColor = "#203158";
  const gridColor = "#e5e7eb";

  const yTicks = 4;
  const tickStep = maxVal / yTicks;

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#111827]">流量趋势</h3>
          <p className="mt-0.5 text-xs text-[#9ca3af]">最近 7 天页面访问与用户趋势</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-[#f3f4f6] p-1">
          <button
            type="button"
            onClick={() => setActiveLine("pv")}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              activeLine === "pv"
                ? "bg-white text-[#f97316] shadow-sm"
                : "text-[#6b7280] hover:text-[#111827]",
            )}
          >
            页面浏览 (PV)
          </button>
          <button
            type="button"
            onClick={() => setActiveLine("uv")}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              activeLine === "uv"
                ? "bg-white text-[#203158] shadow-sm"
                : "text-[#6b7280] hover:text-[#111827]",
            )}
          >
            独立访客 (UV)
          </button>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[500px]"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {Array.from({ length: yTicks + 1 }).map((_, i) => {
            const y = padding.top + (chartH / yTicks) * i;
            const val = Math.round(maxVal - tickStep * i);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={gridColor}
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#9ca3af"
                >
                  {val}
                </text>
              </g>
            );
          })}

          <defs>
            <linearGradient id="pvGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={pvColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={pvColor} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="uvGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={uvColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={uvColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          <path
            d={buildArea("pv")}
            fill="url(#pvGradient)"
            style={{ opacity: activeLine === "pv" ? 1 : 0.3 }}
          />
          <path
            d={buildArea("uv")}
            fill="url(#uvGradient)"
            style={{ opacity: activeLine === "uv" ? 1 : 0.3 }}
          />

          <path
            d={buildPath("pv")}
            fill="none"
            stroke={pvColor}
            strokeWidth={activeLine === "pv" ? 2.5 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: activeLine === "pv" ? 1 : 0.4, transition: "all 0.2s" }}
          />
          <path
            d={buildPath("uv")}
            fill="none"
            stroke={uvColor}
            strokeWidth={activeLine === "uv" ? 2.5 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: activeLine === "uv" ? 1 : 0.4, transition: "all 0.2s" }}
          />

          {data.map((d, i) => (
            <g key={d.label}>
              <circle
                cx={getX(i)}
                cy={getY(d.pv)}
                r={hoverIndex === i && activeLine === "pv" ? 5 : 3}
                fill="white"
                stroke={pvColor}
                strokeWidth={2}
                style={{ transition: "r 0.15s" }}
              />
              <circle
                cx={getX(i)}
                cy={getY(d.uv)}
                r={hoverIndex === i && activeLine === "uv" ? 5 : 3}
                fill="white"
                stroke={uvColor}
                strokeWidth={2}
                style={{ transition: "r 0.15s" }}
              />
              <text
                x={getX(i)}
                y={height - 10}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
              >
                {d.label}
              </text>
              <rect
                x={getX(i) - stepX / 2}
                y={padding.top}
                width={stepX}
                height={chartH}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                style={{ cursor: "pointer" }}
              />
            </g>
          ))}

          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={padding.top + chartH}
                stroke="#f97316"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            </g>
          )}
        </svg>

        {hoverIndex !== null && (
          <div
            className="pointer-events-none absolute top-4 z-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-xs shadow-lg"
            style={{
              left: `${((getX(hoverIndex) + 10) / width) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="font-medium text-[#111827]">{data[hoverIndex].label}</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[#f97316]" />
              <span className="text-[#6b7280]">PV:</span>
              <span className="font-semibold text-[#111827]">
                {data[hoverIndex].pv.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[#203158]" />
              <span className="text-[#6b7280]">UV:</span>
              <span className="font-semibold text-[#111827]">
                {data[hoverIndex].uv.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
