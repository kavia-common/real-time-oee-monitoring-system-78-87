import { clamp01 } from "../utils/math";
import { uid } from "../utils/uid";

function rangeToPoints(timeRange) {
  switch (timeRange) {
    case "15m":
      return 30;
    case "1h":
      return 60;
    case "8h":
      return 96;
    case "24h":
      return 144;
    default:
      return 60;
  }
}

function rangeToStepMs(timeRange) {
  switch (timeRange) {
    case "15m":
      return 30 * 1000;
    case "1h":
      return 60 * 1000;
    case "8h":
      return 5 * 60 * 1000;
    case "24h":
      return 10 * 60 * 1000;
    default:
      return 60 * 1000;
  }
}

function lineProfile(lineId) {
  const profiles = {
    "line-1": { base: 0.74, volatility: 0.03, name: "Filling Line A" },
    "line-2": { base: 0.68, volatility: 0.04, name: "Packaging Line B" },
    "line-3": { base: 0.80, volatility: 0.025, name: "Assembly Line C" },
  };
  return profiles[lineId] ?? { base: 0.72, volatility: 0.03, name: "Line" };
}

function pickSeverity(oee) {
  if (oee < 0.55) return "critical";
  if (oee < 0.68) return "warning";
  return "info";
}

function createEvent({ lineId, oee }) {
  const severity = pickSeverity(oee);
  const options =
    severity === "critical"
      ? [
          {
            title: "Unplanned downtime",
            message: "Machine stopped unexpectedly. Check safety interlocks and sensors.",
            code: "DT-UNPLANNED",
            category: "Downtime",
          },
          {
            title: "Quality alarm",
            message: "Reject rate spiked above threshold. Inspect material feed and calibration.",
            code: "QL-ALARM",
            category: "Quality",
          },
        ]
      : severity === "warning"
        ? [
            {
              title: "Micro-stop detected",
              message: "Short stoppages increasing. Consider lubrication and feeder alignment.",
              code: "DT-MICROSTOP",
              category: "Downtime",
            },
            {
              title: "Performance loss",
              message: "Speed loss observed; verify ideal cycle time and conveyor flow.",
              code: "PF-LOSS",
              category: "Performance",
            },
          ]
        : [
            {
              title: "Stable production",
              message: "Line operating within expected band. No action required.",
              code: "INFO-STABLE",
              category: "Info",
            },
          ];

  const chosen = options[Math.floor(Math.random() * options.length)];
  return {
    id: uid("evt"),
    ts: Date.now(),
    severity,
    title: chosen.title,
    message: chosen.message,
    meta: {
      lineId,
      code: chosen.code,
      category: chosen.category,
    },
  };
}

function computeOee(a, p, q) {
  return clamp01(a * p * q);
}

// PUBLIC_INTERFACE
export function createMockOeeEngine() {
  /** Creates a mock OEE engine that simulates real-time KPI drift and events.
   *
   * Intended for local/dev usage or when backend is not configured.
   *
   * Returns:
   *  - Engine with start({lineId, timeRange, onTick}) and getState({lineId, timeRange})
   */
  const stateByLine = new Map();

  function initLine(lineId, timeRange) {
    const profile = lineProfile(lineId);

    const points = rangeToPoints(timeRange);
    const stepMs = rangeToStepMs(timeRange);
    const now = Date.now();

    // Initialize component metrics around a base with slight offsets
    let availability = clamp01(profile.base + 0.08);
    let performance = clamp01(profile.base + 0.04);
    let quality = clamp01(profile.base + 0.12);
    let oee = computeOee(availability, performance, quality);

    const series = [];
    for (let i = points - 1; i >= 0; i -= 1) {
      const t = now - i * stepMs;
      // gentle random walk for history
      const jitter = () => (Math.random() - 0.5) * profile.volatility;
      availability = clamp01(availability + jitter());
      performance = clamp01(performance + jitter());
      quality = clamp01(quality + jitter());
      oee = computeOee(availability, performance, quality);

      series.push({
        t,
        oee,
        availability,
        performance,
        quality,
      });
    }

    const events = [createEvent({ lineId, oee })];

    const lineState = {
      lineId,
      timeRange,
      profile,
      stepMs,
      points,
      series,
      events,
      lastKpis: { availability, performance, quality, oee },
      lastKpisPrev: { availability, performance, quality, oee },
    };

    stateByLine.set(lineId, lineState);
    return lineState;
  }

  function ensureLine(lineId, timeRange) {
    const existing = stateByLine.get(lineId);
    if (!existing || existing.timeRange !== timeRange) {
      return initLine(lineId, timeRange);
    }
    return existing;
  }

  function tick(lineId, timeRange) {
    const s = ensureLine(lineId, timeRange);
    const { volatility } = s.profile;

    const jitter = () => (Math.random() - 0.5) * volatility;

    // drift towards base + small oscillations, clamped
    const base = s.profile.base;
    const pull = (x, target) => x + (target - x) * 0.15;

    const prev = s.lastKpis;
    const nextAvailability = clamp01(pull(prev.availability, base + 0.08) + jitter());
    const nextPerformance = clamp01(pull(prev.performance, base + 0.04) + jitter());
    const nextQuality = clamp01(pull(prev.quality, base + 0.12) + jitter());
    const nextOee = computeOee(nextAvailability, nextPerformance, nextQuality);

    s.lastKpisPrev = s.lastKpis;
    s.lastKpis = {
      availability: nextAvailability,
      performance: nextPerformance,
      quality: nextQuality,
      oee: nextOee,
    };

    const nextPoint = {
      t: Date.now(),
      oee: nextOee,
      availability: nextAvailability,
      performance: nextPerformance,
      quality: nextQuality,
    };

    s.series.push(nextPoint);
    while (s.series.length > s.points) s.series.shift();

    // occasional event
    const eventChance =
      nextOee < 0.58 ? 0.22 : nextOee < 0.68 ? 0.14 : 0.06;
    if (Math.random() < eventChance) {
      s.events.unshift(createEvent({ lineId, oee: nextOee }));
      s.events = s.events.slice(0, 12);
    }

    return getState({ lineId, timeRange });
  }

  function computeTrends(prevKpis, kpis) {
    const delta = (a, b) => (typeof a === "number" && typeof b === "number" ? b - a : 0);
    return {
      availability: delta(prevKpis.availability, kpis.availability),
      performance: delta(prevKpis.performance, kpis.performance),
      quality: delta(prevKpis.quality, kpis.quality),
      oee: delta(prevKpis.oee, kpis.oee),
    };
  }

  function getState({ lineId, timeRange }) {
    const s = ensureLine(lineId, timeRange);
    const kpis = s.lastKpis;
    const trends = computeTrends(s.lastKpisPrev, s.lastKpis);

    return {
      snapshot: {
        kpis,
        trends,
        context: { lineId, timeRange },
      },
      series: s.series,
      events: s.events,
    };
  }

  function start({ lineId, timeRange, onTick }) {
    const s = ensureLine(lineId, timeRange);
    const interval = setInterval(() => {
      const state = tick(lineId, timeRange);
      onTick?.(state);
    }, Math.max(1200, Math.min(4000, s.stepMs / 2)));

    return () => clearInterval(interval);
  }

  return {
    start,
    getState,
  };
}
