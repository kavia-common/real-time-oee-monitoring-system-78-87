function clamp01(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function minutesBetween(a, b) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, ms / 60000);
}

/**
 * Computes OEE for a run.
 * Availability = (runTime - downtime) / runTime
 * Performance = totalUnits / (idealRate * runTime)
 * Quality = goodUnits / totalUnits
 *
 * Notes:
 * - runTime uses actual start..end if stopped else start..now
 * - idealRate is run.targetRatePerMinute
 */
function computeOeeForRun({ run, downtimeEvents = [] }) {
  const now = new Date();
  const end = run.endTime ? new Date(run.endTime) : now;

  const runMinutes = Math.max(0.0001, minutesBetween(run.startTime, end));
  const downtimeMinutes = downtimeEvents.reduce((acc, e) => acc + (Number(e.durationMinutes) || 0), 0);

  const operatingMinutes = Math.max(0, runMinutes - downtimeMinutes);

  const availability = clamp01(operatingMinutes / runMinutes);

  const totalUnits = (Number(run.goodUnits) || 0) + (Number(run.rejectUnits) || 0);
  const idealUnits = Math.max(0.0001, (Number(run.targetRatePerMinute) || 0) * operatingMinutes);
  const performance = clamp01(totalUnits / idealUnits);

  const quality = totalUnits > 0 ? clamp01((Number(run.goodUnits) || 0) / totalUnits) : 1;

  const oee = clamp01(availability * performance * quality);

  return {
    availability,
    performance,
    quality,
    oee,
    totals: {
      runMinutes,
      downtimeMinutes,
      operatingMinutes,
      totalUnits,
      goodUnits: Number(run.goodUnits) || 0,
      rejectUnits: Number(run.rejectUnits) || 0,
    },
  };
}

module.exports = { computeOeeForRun };
