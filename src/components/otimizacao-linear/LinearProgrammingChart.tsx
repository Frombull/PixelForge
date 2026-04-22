"use client";

import { Circle, Coordinates, Line, Mafs, Point, Polygon, Text } from "mafs";
import type { ChartBounds, ConstraintSegment, Vec2 } from "./types";

type LinearProgrammingChartProps = {
  chartHeight: number;
  bounds: ChartBounds;
  constraintSegments: ConstraintSegment[];
  hullPoints: Vec2[];
  objectiveSegment: [Vec2, Vec2] | null;
  projectedPoints: { x: number; y: number }[];
  optimal2D: { x: number; y: number } | null;
  optimalRingRadius: number;
  optimalVector: number[] | null;
  formatNum: (value: number) => string;
};

export default function LinearProgrammingChart({
  chartHeight,
  bounds,
  constraintSegments,
  hullPoints,
  objectiveSegment,
  projectedPoints,
  optimal2D,
  optimalRingRadius,
  optimalVector,
  formatNum,
}: LinearProgrammingChartProps) {
  return (
    <section className="bg-[#0d0d0d] p-4 md:p-5 pt-4">
      <div className="flex items-baseline gap-4 mb-6 pb-5 border-b border-[#1e1e1e]">
        <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#555] tracking-[0.18em] uppercase">
          saída
        </span>
        <span className="text-[20px] font-normal text-[#ececec] tracking-[-0.01em]">
          Projeção x1-x2 + vetor ótimo
        </span>
      </div>

      <div className="relative overflow-hidden border border-[#1f1f1f] bg-[#111]">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div
          className="relative z-10 w-full"
          role="img"
          aria-label="Gráfico da otimização linear interativo"
        >
          <Mafs
            height={chartHeight}
            pan
            zoom={{ min: 0.45, max: 7 }}
            preserveAspectRatio="contain"
            viewBox={{
              x: [bounds.minX, bounds.maxX],
              y: [bounds.minY, bounds.maxY],
              padding: 0.6,
            }}
          >
            <Coordinates.Cartesian
              xAxis={{ axis: true, lines: 5 }}
              yAxis={{ axis: true, lines: 5 }}
              subdivisions={2}
            />

            {constraintSegments.map((segment) => {
              const palette = ["#8fbf8f", "#89a7d8", "#d8a889", "#b68fd2", "#c6cc85", "#8ebfc3"];
              const stroke = palette[segment.idx % palette.length];

              return (
                <Line.Segment
                  key={`constraint-${segment.id}`}
                  point1={segment.p1}
                  point2={segment.p2}
                  color={stroke}
                  weight={2}
                  opacity={0.88}
                />
              );
            })}

            {hullPoints.length >= 3 && (
              <Polygon
                points={hullPoints}
                color="#77c0aa"
                weight={2}
                fillOpacity={0.22}
                strokeOpacity={0.95}
              />
            )}

            {objectiveSegment && (
              <Line.Segment
                point1={objectiveSegment[0]}
                point2={objectiveSegment[1]}
                color="#f0bf6b"
                weight={2.2}
                style="dashed"
                opacity={0.95}
              />
            )}

            {projectedPoints.map((p, idx) => (
              <Point
                key={`point-${idx}`}
                x={p.x}
                y={p.y}
                color="#9fd0ff"
                svgCircleProps={{ r: 4.2 }}
              />
            ))}

            {optimal2D && (
              <>
                <Point x={optimal2D.x} y={optimal2D.y} color="#f58f8f" svgCircleProps={{ r: 7 }} />
                <Circle
                  center={[optimal2D.x, optimal2D.y]}
                  radius={optimalRingRadius}
                  color="#f58f8f"
                  fillOpacity={0}
                  strokeOpacity={0.55}
                  weight={2}
                />
                <Text
                  x={optimal2D.x}
                  y={optimal2D.y}
                  color="#f6b2b2"
                  attach="ne"
                  attachDistance={16}
                  size={11}
                >
                  ponto ideal (proj.)
                </Text>
              </>
            )}
          </Mafs>
        </div>

        <div className="pointer-events-none absolute bottom-2 right-3 z-20 font-['IBM_Plex_Mono',monospace] text-[10px] tracking-[0.08em] uppercase text-[#7a7a7a]">
          Arraste para pan · scroll para zoom
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] font-['IBM_Plex_Mono',monospace] uppercase tracking-[0.06em]">
        <div className="border border-[#22372f] bg-[#101814] text-[#82b59c] px-3 py-2">Regiao viavel (proj.)</div>
        <div className="border border-[#2a2a2a] bg-[#121212] text-[#89a7d8] px-3 py-2">Pontos candidatos</div>
        <div className="border border-[#472d2d] bg-[#1b1313] text-[#d9a0a0] px-3 py-2">Ponto otimo</div>
      </div>

      {optimalVector && (
        <div className="mt-5 pt-5 border-t border-[#1a1a1a] text-[13px] text-[#888] leading-[1.75]">
          <div className="mb-2 text-[#9f9f9f]">Vetor da solucao:</div>
          <div className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#b5b5b5] break-all">
            [{optimalVector.map((v) => formatNum(v)).join(", ")}]
          </div>
        </div>
      )}
    </section>
  );
}
