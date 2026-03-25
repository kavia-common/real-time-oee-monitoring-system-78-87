import React, { useEffect, useMemo, useRef, useState } from "react";
import { clamp01 } from "../../utils/math";

function useSize(ref) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cr = e.contentRect;
        setSize({ w: Math.round(cr.width), h: Math.round(cr.height) });
      }
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, [ref]);

  return size;
}

function toPath(points, x, y) {
  if (!points.length) return "";
  let d = `M ${x(points[0])} ${y(points[0])}`;
  for (let i = 1; i < points.length; i += 1) d += ` L ${x(points[i])} ${y(points[i])}`;
  return d;
}

function niceTicks() {
  return [0.0, 0.25, 0.5, 0.75, 1.0];
}

// PUBLIC_INTERFACE
export default function TrendChart({ series, ariaLabel }) {
  /** Lightweight multi-series line chart rendered with SVG (no chart library).
   *
   * series: [{t,oee,availability,performance,quality}]
   */
  const containerRef = useRef(null);
  const { w, h } = useSize(containerRef);

  const padding = { l: 42, r: 14, t: 10, b: 26 };
  const innerW = Math.max(10, w - padding.l - padding.r);
  const innerH = Math.max(10, h - padding.t - padding.b);

  const data = Array.isArray(series) ? series : [];

  const domain = useMemo(() => {
    if (!data.length) return { minT: 0, maxT: 1 };
    return { minT: data[0].t, maxT: data[data.length - 1].t };
  }, [data]);

  const x = (p) => {
    const span = Math.max(1, domain.maxT - domain.minT);
    return padding.l + ((p.t - domain.minT) / span) * innerW;
  };

  const y = (p, key) => {
    const v = clamp01(p[key] ?? 0);
    return padding.t + (1 - v) * innerH;
  };

  const ticks = niceTicks();

  const paths = useMemo(() => {
    const oeePath = toPath(data, x, (p) => y(p, "oee"));
    const aPath = toPath(data, x, (p) => y(p, "availability"));
    const pPath = toPath(data, x, (p) => y(p, "performance"));
    const qPath = toPath(data, x, (p) => y(p, "quality"));
    return { oeePath, aPath, pPath, qPath };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, w, h]);

  return (
    <div className="chartContainer" ref={containerRef} aria-label={ariaLabel}>
      {w <= 10 || h <= 10 ? null : (
        <svg width={w} height={h} role="img" aria-label={ariaLabel}>
          <defs>
            <linearGradient id="oeeStroke" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#2563EB" stopOpacity="0.95" />
              <stop offset="1" stopColor="#F59E0B" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          {/* grid + y ticks */}
          {ticks.map((t) => {
            const yy = padding.t + (1 - t) * innerH;
            return (
              <g key={t}>
                <line
                  x1={padding.l}
                  x2={w - padding.r}
                  y1={yy}
                  y2={yy}
                  stroke="rgba(17,24,39,0.07)"
                  strokeWidth="1"
                />
                <text
                  x={padding.l - 10}
                  y={yy + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="rgba(17,24,39,0.50)"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
                >
                  {Math.round(t * 100)}%
                </text>
              </g>
            );
          })}

          {/* series */}
          <path d={paths.aPath} fill="none" stroke="#F59E0B" strokeOpacity="0.65" strokeWidth="2" />
          <path d={paths.pPath} fill="none" stroke="#64748B" strokeOpacity="0.70" strokeWidth="2" />
          <path d={paths.qPath} fill="none" stroke="#14B8A6" strokeOpacity="0.70" strokeWidth="2" />
          <path d={paths.oeePath} fill="none" stroke="url(#oeeStroke)" strokeWidth="3.2" />

          {/* axes baseline */}
          <line
            x1={padding.l}
            x2={w - padding.r}
            y1={padding.t + innerH}
            y2={padding.t + innerH}
            stroke="rgba(17,24,39,0.10)"
            strokeWidth="1"
          />
        </svg>
      )}
    </div>
  );
}
