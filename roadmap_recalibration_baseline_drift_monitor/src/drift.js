const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const REQUIRED_CONSUMERS = [
  "roadmap_scheduler",
  "estimate_adoption",
  "estimate_effectiveness",
  "estimate_drift",
  "recalibration_controller",
];

function text(value, name, maximum = 500) {
  if (typeof value !== "string" || !value.trim() || value.length > maximum) {
    throw new Error(`${name} must contain 1–${maximum} characters`);
  }
  return value.trim();
}

function timestamp(value, name) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error(`${name} must be an ISO timestamp`);
  }
  return new Date(value).toISOString();
}

function integer(value, name, minimum, maximum) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer from ${minimum} to ${maximum}`);
  }
  return value;
}

function number(value, name, minimum, maximum) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be a number from ${minimum} to ${maximum}`);
  }
  return value;
}

function uniqueStrings(raw, name, maximum = 50) {
  if (!Array.isArray(raw) || !raw.length || raw.length > maximum) {
    throw new Error(`${name} must contain 1–${maximum} values`);
  }
  const values = raw.map((value, index) => text(value, `${name} ${index + 1}`, 120));
  if (new Set(values).size !== values.length) throw new Error(`${name} values must be unique`);
  return values;
}

const round = value => Number(value.toFixed(4));
const hoursBetween = (start, end) => round((Date.parse(end) - Date.parse(start)) / HOUR);
const daysBetween = (start, end) => round((Date.parse(end) - Date.parse(start)) / DAY);
const check = (id, passed, detail) => ({id, passed, detail});

function normalizeHandoff(report) {
  if (report?.schemaVersion !== "1.0.0" || !report.id || !report.manifest || !report.archive || !report.rollback || !report.monitoring || !report.review) {
    throw new Error("Provide a bounded Project 55 baseline handoff report");
  }
  return {
    id: text(report.id, "Project 55 id", 120),
    status: text(report.status, "Project 55 status", 40),
    reviewedAt: timestamp(report.review.reviewedAt, "Project 55 reviewedAt"),
    reviewer: text(report.review.reviewer, "Project 55 reviewer", 120),
    decision: text(report.review.decision, "Project 55 decision", 30),
    previousVersion: text(report.previousVersion, "Project 55 previousVersion", 80),
    activeVersion: text(report.activeVersion, "Project 55 activeVersion", 80),
    scope: uniqueStrings(report.scope, "Project 55 scope"),
    factorManifestId: text(report.manifest.factorManifestId, "Project 55 factorManifestId", 120),
    archiveOwner: text(report.archive.owner, "Project 55 archive owner", 120),
    rollbackOwner: text(report.rollback.owner, "Project 55 rollback owner", 120),
    maximumRecoveryHours: number(report.rollback.maximumRecoveryHours, "Project 55 maximumRecoveryHours", 0.01, 168),
    effectivenessOwner: text(report.monitoring.effectivenessOwner, "Project 55 effectiveness owner", 120),
    effectivenessDueAt: timestamp(report.monitoring.effectivenessDueAt, "Project 55 effectiveness dueAt"),
    driftOwner: text(report.monitoring.driftOwner, "Project 55 drift owner", 120),
    driftDueAt: timestamp(report.monitoring.driftDueAt, "Project 55 drift dueAt"),
  };
}

function normalizeConsumers(raw, snapshotName, expectedVersion) {
  if (!Array.isArray(raw) || raw.length !== REQUIRED_CONSUMERS.length) {
    throw new Error(`${snapshotName} must include all five required consumers`);
  }
  const seen = new Set();
  return raw.map((item, index) => {
    const type = text(item.type, `${snapshotName} consumer ${index + 1} type`, 40);
    if (seen.has(type) || !REQUIRED_CONSUMERS.includes(type)) {
      throw new Error(`${snapshotName} consumer types must be unique and required`);
    }
    seen.add(type);
    const acceptedVersion = text(item.acceptedVersion, `${snapshotName} ${type} acceptedVersion`, 80);
    return {
      type,
      acceptedVersion,
      healthy: item.healthy === true,
      owner: text(item.owner, `${snapshotName} ${type} owner`, 120),
      evidence: text(item.evidence, `${snapshotName} ${type} evidence`, 1000),
      converged: acceptedVersion === expectedVersion && item.healthy === true,
    };
  });
}

function normalizeClasses(raw, snapshotName, scope, expectedManifest) {
  if (!Array.isArray(raw) || raw.length !== scope.length) {
    throw new Error(`${snapshotName} must cover the complete Project 55 scope`);
  }
  const seen = new Set();
  return raw.map((item, index) => {
    const referenceClass = text(item.referenceClass, `${snapshotName} class ${index + 1}`, 120);
    if (seen.has(referenceClass) || !scope.includes(referenceClass)) {
      throw new Error(`${snapshotName} reference classes must be unique and in scope`);
    }
    seen.add(referenceClass);
    const factorManifestId = text(item.factorManifestId, `${snapshotName} ${referenceClass} factorManifestId`, 120);
    const status = text(item.status, `${snapshotName} ${referenceClass} status`, 20);
    return {
      referenceClass,
      factorManifestId,
      status,
      evidence: text(item.evidence, `${snapshotName} ${referenceClass} evidence`, 1000),
      aligned: factorManifestId === expectedManifest && status === "active",
    };
  });
}

function normalizeSnapshots(raw, handoff, asOf) {
  if (!Array.isArray(raw) || !raw.length || raw.length > 100) throw new Error("Provide 1–100 configuration snapshots");
  const ids = new Set();
  let previousAt = handoff.reviewedAt;
  return raw.map((item, index) => {
    const name = `snapshot ${index + 1}`;
    const id = text(item.id, `${name} id`, 120);
    if (ids.has(id)) throw new Error("Snapshot ids must be unique");
    ids.add(id);
    const observedAt = timestamp(item.observedAt, `${name} observedAt`);
    if (observedAt <= previousAt || observedAt > asOf) throw new Error("Snapshots must be chronological after Project 55 and not exceed asOf");
    previousAt = observedAt;
    const activeVersion = text(item.activeVersion, `${name} activeVersion`, 80);
    const factorManifestId = text(item.factorManifestId, `${name} factorManifestId`, 120);
    const referenceClasses = normalizeClasses(item.referenceClasses, name, handoff.scope, handoff.factorManifestId);
    const consumers = normalizeConsumers(item.consumers, name, handoff.activeVersion);
    const aligned = activeVersion === handoff.activeVersion && factorManifestId === handoff.factorManifestId && referenceClasses.every(entry => entry.aligned) && consumers.every(entry => entry.converged);
    return {id, observedAt, activeVersion, factorManifestId, referenceClasses, consumers, aligned};
  });
}

function normalizeMonitoring(raw, handoff, asOf) {
  const definitions = [
    ["effectiveness", handoff.effectivenessOwner, handoff.effectivenessDueAt],
    ["drift", handoff.driftOwner, handoff.driftDueAt],
  ];
  if (!Array.isArray(raw) || raw.length !== definitions.length) throw new Error("Provide effectiveness and drift monitoring obligations");
  const byType = new Map(raw.map(item => [item.type, item]));
  return definitions.map(([type, expectedOwner, expectedDueAt]) => {
    const item = byType.get(type);
    if (!item) throw new Error(`Missing ${type} monitoring obligation`);
    const owner = text(item.owner, `${type} monitoring owner`, 120);
    const dueAt = timestamp(item.dueAt, `${type} monitoring dueAt`);
    const status = text(item.status, `${type} monitoring status`, 20);
    if (!['scheduled', 'completed'].includes(status)) throw new Error(`${type} monitoring status must be scheduled or completed`);
    const completedAt = item.completedAt == null ? null : timestamp(item.completedAt, `${type} completedAt`);
    if (completedAt && completedAt > asOf) throw new Error(`${type} completedAt cannot exceed asOf`);
    const due = dueAt <= asOf;
    return {
      type, owner, dueAt, status, completedAt,
      evidence: text(item.evidence, `${type} monitoring evidence`, 1000),
      aligned: owner === expectedOwner && dueAt === expectedDueAt,
      current: due ? status === "completed" && completedAt !== null && completedAt <= dueAt : status === "scheduled" || status === "completed",
    };
  });
}

export function monitorRoadmapRecalibrationBaselineDrift(handoffReport, input = {}) {
  const handoff = normalizeHandoff(handoffReport);
  const id = text(input.id, "monitor id", 120);
  const asOf = timestamp(input.asOf, "asOf");
  if (asOf <= handoff.reviewedAt) throw new Error("asOf must follow Project 55 review");
  const policy = {
    minimumSnapshots: integer(input.minimumSnapshots, "minimumSnapshots", 2, 100),
    maximumSnapshotGapHours: integer(input.maximumSnapshotGapHours, "maximumSnapshotGapHours", 1, 2160),
    maximumSnapshotAgeHours: integer(input.maximumSnapshotAgeHours, "maximumSnapshotAgeHours", 1, 2160),
    minimumArchiveRemainingDays: integer(input.minimumArchiveRemainingDays, "minimumArchiveRemainingDays", 1, 3650),
    maximumRollbackTestAgeDays: integer(input.maximumRollbackTestAgeDays, "maximumRollbackTestAgeDays", 1, 90),
  };
  const snapshots = normalizeSnapshots(input.snapshots, handoff, asOf);
  const gaps = snapshots.map((snapshot, index) => hoursBetween(index === 0 ? handoff.reviewedAt : snapshots[index - 1].observedAt, snapshot.observedAt));
  const latestAgeHours = hoursBetween(snapshots.at(-1).observedAt, asOf);
  const archive = {
    version: text(input.archive?.version, "archive version", 80),
    owner: text(input.archive?.owner, "archive owner", 120),
    available: input.archive?.available === true,
    immutable: input.archive?.immutable === true,
    verifiedAt: timestamp(input.archive?.verifiedAt, "archive verifiedAt"),
    retentionUntil: timestamp(input.archive?.retentionUntil, "archive retentionUntil"),
    evidence: text(input.archive?.evidence, "archive evidence", 1000),
  };
  if (archive.verifiedAt > asOf) throw new Error("Archive verification cannot exceed asOf");
  const archiveRemainingDays = daysBetween(asOf, archive.retentionUntil);
  const rollback = {
    targetVersion: text(input.rollback?.targetVersion, "rollback targetVersion", 80),
    owner: text(input.rollback?.owner, "rollback owner", 120),
    testedAt: timestamp(input.rollback?.testedAt, "rollback testedAt"),
    maximumRecoveryHours: number(input.rollback?.maximumRecoveryHours, "rollback maximumRecoveryHours", 0.01, 168),
    evidence: text(input.rollback?.evidence, "rollback evidence", 1000),
  };
  if (rollback.testedAt > asOf) throw new Error("Rollback test cannot exceed asOf");
  const rollbackAgeDays = daysBetween(rollback.testedAt, asOf);
  const monitoring = normalizeMonitoring(input.monitoring, handoff, asOf);
  const reviewer = text(input.review?.reviewer, "review reviewer", 120);
  const reviewedAt = timestamp(input.review?.reviewedAt, "review reviewedAt");
  if (reviewedAt < asOf) throw new Error("Review cannot precede asOf");
  const decision = text(input.review?.decision, "review decision", 30);
  if (!['retain_baseline', 'remediate_drift', 'freeze_changes'].includes(decision)) throw new Error("Review decision is invalid");
  const checks = [
    check("verified-handoff", handoff.status === "baseline_handoff_complete" && handoff.decision === "complete_handoff", "Project 55 must establish a completed baseline handoff."),
    check("snapshot-coverage", snapshots.length >= policy.minimumSnapshots, `${snapshots.length} snapshot(s) supplied against ${policy.minimumSnapshots}.`),
    check("snapshot-cadence", gaps.every(gap => gap <= policy.maximumSnapshotGapHours) && latestAgeHours <= policy.maximumSnapshotAgeHours, `Maximum gap is ${Math.max(...gaps)} hour(s); latest age is ${latestAgeHours} hour(s).`),
    check("manifest-continuity", snapshots.every(snapshot => snapshot.activeVersion === handoff.activeVersion && snapshot.factorManifestId === handoff.factorManifestId), "Every snapshot preserves the Project 55 version and factor manifest."),
    check("class-continuity", snapshots.every(snapshot => snapshot.referenceClasses.every(entry => entry.aligned)), "Every reference class remains active on the handed-off manifest."),
    check("consumer-convergence", snapshots.every(snapshot => snapshot.consumers.every(entry => entry.converged)), "All five consumers remain healthy on the handed-off version."),
    check("archive-availability", archive.version === handoff.previousVersion && archive.owner === handoff.archiveOwner && archive.available && archive.immutable && archiveRemainingDays >= policy.minimumArchiveRemainingDays, "The superseded baseline remains available, immutable, owned, and sufficiently retained."),
    check("rollback-current", rollback.targetVersion === handoff.previousVersion && rollback.owner === handoff.rollbackOwner && rollback.maximumRecoveryHours <= handoff.maximumRecoveryHours && rollbackAgeDays <= policy.maximumRollbackTestAgeDays, "Rollback remains exact, owned, time-bounded, and recently tested."),
    check("monitoring-current", monitoring.every(item => item.aligned && item.current), "Effectiveness and drift obligations preserve Project 55 ownership, deadlines, and completion state."),
    check("independent-review", reviewer !== handoff.reviewer && reviewedAt >= asOf, "The final reviewer is independent from the Project 55 reviewer."),
  ];
  const allChecksPassed = checks.every(item => item.passed);
  const driftSnapshots = snapshots.filter(snapshot => !snapshot.aligned);
  const driftedConsumers = [...new Set(snapshots.flatMap(snapshot => snapshot.consumers.filter(item => !item.converged).map(item => item.type)))];
  return {
    schemaVersion: "1.0.0", id, asOf,
    status: decision === "retain_baseline" ? (allChecksPassed ? "configuration_stable" : "blocked_retention") : "action_required",
    sourceHandoffId: handoff.id,
    previousVersion: handoff.previousVersion,
    activeVersion: handoff.activeVersion,
    factorManifestId: handoff.factorManifestId,
    scope: handoff.scope,
    policy,
    snapshots,
    archive: {...archive, remainingDays: archiveRemainingDays},
    rollback: {...rollback, ageDays: rollbackAgeDays},
    monitoring,
    summary: {
      snapshots: snapshots.length,
      alignedSnapshots: snapshots.length - driftSnapshots.length,
      driftSnapshots: driftSnapshots.length,
      driftedConsumers,
      maximumSnapshotGapHours: Math.max(...gaps),
      latestSnapshotAgeHours: latestAgeHours,
      allChecksPassed,
    },
    checks,
    review: {reviewer, decision, rationale: text(input.review?.rationale, "review rationale", 1000), reviewedAt},
    method: "deterministic Project 55 lineage, snapshot coverage, cadence, version, factor-manifest, reference-class, required-consumer, archive, rollback, monitoring-obligation, and independent human-review checks; this monitor never changes configuration, factors, estimates, schedules, consumers, archives, rollback, monitoring, or product state",
  };
}
