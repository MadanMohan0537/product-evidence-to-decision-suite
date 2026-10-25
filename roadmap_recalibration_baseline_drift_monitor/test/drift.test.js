import assert from "node:assert/strict";
import test from "node:test";
import {monitorRoadmapRecalibrationBaselineDrift} from "../src/drift.js";

const handoff = (overrides = {}) => ({
  schemaVersion: "1.0.0", id: "handoff-1", status: "baseline_handoff_complete", previousVersion: "policy-3", activeVersion: "policy-5", scope: ["onboarding"],
  manifest: {factorManifestId: "factors-5"}, archive: {owner: "Records owner"},
  rollback: {owner: "Delivery operations", maximumRecoveryHours: 4},
  monitoring: {effectivenessOwner: "Effectiveness council", effectivenessDueAt: "2027-05-08T00:00:00Z", driftOwner: "Drift council", driftDueAt: "2027-06-08T00:00:00Z"},
  review: {reviewer: "Baseline chair", decision: "complete_handoff", reviewedAt: "2027-04-08T07:00:00Z"}, ...overrides,
});
const consumers = (version = "policy-5", healthy = true) => ["roadmap_scheduler", "estimate_adoption", "estimate_effectiveness", "estimate_drift", "recalibration_controller"].map((type, index) => ({type, acceptedVersion: version, healthy, owner: `Owner ${index}`, evidence: `Reviewed ${type} configuration.`}));
const snapshot = (id, observedAt, overrides = {}) => ({id, observedAt, activeVersion: "policy-5", factorManifestId: "factors-5", referenceClasses: [{referenceClass: "onboarding", factorManifestId: "factors-5", status: "active", evidence: "Reviewed class registry."}], consumers: consumers(), ...overrides});
const input = (overrides = {}) => ({
  id: "drift-1", asOf: "2027-04-11T07:00:00Z", minimumSnapshots: 3, maximumSnapshotGapHours: 24, maximumSnapshotAgeHours: 24, minimumArchiveRemainingDays: 300, maximumRollbackTestAgeDays: 14,
  snapshots: [snapshot("day-1", "2027-04-09T07:00:00Z"), snapshot("day-2", "2027-04-10T07:00:00Z"), snapshot("day-3", "2027-04-11T07:00:00Z")],
  archive: {version: "policy-3", owner: "Records owner", available: true, immutable: true, verifiedAt: "2027-04-11T06:00:00Z", retentionUntil: "2028-04-08T00:00:00Z", evidence: "Reviewed immutable archive receipt."},
  rollback: {targetVersion: "policy-3", owner: "Delivery operations", testedAt: "2027-04-10T00:00:00Z", maximumRecoveryHours: 4, evidence: "Reviewed rollback exercise."},
  monitoring: [{type: "effectiveness", owner: "Effectiveness council", dueAt: "2027-05-08T00:00:00Z", status: "scheduled", evidence: "Reviewed calendar entry."}, {type: "drift", owner: "Drift council", dueAt: "2027-06-08T00:00:00Z", status: "scheduled", evidence: "Reviewed calendar entry."}],
  review: {reviewer: "Configuration assurance chair", decision: "retain_baseline", rationale: "All configuration controls remain aligned.", reviewedAt: "2027-04-11T08:00:00Z"}, ...overrides,
});
const run = (report = handoff(), options = input()) => monitorRoadmapRecalibrationBaselineDrift(report, options);

test("reports a stable baseline", () => {const result = run(); assert.equal(result.status, "configuration_stable"); assert.equal(result.summary.alignedSnapshots, 3); assert.ok(result.checks.every(item => item.passed));});
test("blocks an incomplete Project 55 handoff", () => assert.equal(run(handoff({status: "blocked_handoff"})).status, "blocked_retention"));
test("requires the complete handoff decision", () => assert.equal(run(handoff({review: {reviewer: "Baseline chair", decision: "continue_transition", reviewedAt: "2027-04-08T07:00:00Z"}})).status, "blocked_retention"));
test("requires asOf after handoff", () => assert.throws(() => run(handoff(), input({asOf: "2027-04-08T06:00:00Z"})), /follow Project 55/));
test("requires enough snapshots", () => {const value = input(); value.snapshots.pop(); assert.equal(run(handoff(), value).status, "blocked_retention");});
test("rejects duplicate snapshot ids", () => {const value = input(); value.snapshots[1].id = "day-1"; assert.throws(() => run(handoff(), value), /unique/);});
test("rejects nonchronological snapshots", () => {const value = input(); value.snapshots[1].observedAt = "2027-04-09T06:00:00Z"; assert.throws(() => run(handoff(), value), /chronological/);});
test("detects snapshot cadence gaps", () => {const value = input(); value.maximumSnapshotGapHours = 12; assert.equal(run(handoff(), value).status, "blocked_retention");});
test("detects a stale latest snapshot", () => {const value = input(); value.maximumSnapshotAgeHours = 12; value.snapshots[2].observedAt = "2027-04-10T13:00:00Z"; assert.equal(run(handoff(), value).status, "blocked_retention");});
test("detects active-version drift", () => {const value = input(); value.snapshots[2].activeVersion = "policy-6"; const result = run(handoff(), value); assert.equal(result.summary.driftSnapshots, 1); assert.equal(result.status, "blocked_retention");});
test("detects factor-manifest drift", () => {const value = input(); value.snapshots[1].factorManifestId = "factors-6"; assert.equal(run(handoff(), value).status, "blocked_retention");});
test("detects class registration drift", () => {const value = input(); value.snapshots[0].referenceClasses[0].status = "inactive"; assert.equal(run(handoff(), value).status, "blocked_retention");});
test("requires complete class scope", () => {const value = input(); value.snapshots[0].referenceClasses = []; assert.throws(() => run(handoff(), value), /complete Project 55 scope/);});
test("detects consumer version drift", () => {const value = input(); value.snapshots[1].consumers[2].acceptedVersion = "policy-3"; const result = run(handoff(), value); assert.deepEqual(result.summary.driftedConsumers, ["estimate_effectiveness"]);});
test("detects unhealthy consumers", () => {const value = input(); value.snapshots[2].consumers[4].healthy = false; assert.equal(run(handoff(), value).status, "blocked_retention");});
test("requires exactly five consumer types", () => {const value = input(); value.snapshots[0].consumers.pop(); assert.throws(() => run(handoff(), value), /five required/);});
test("requires the superseded archive", () => {const value = input(); value.archive.available = false; assert.equal(run(handoff(), value).status, "blocked_retention");});
test("requires immutable archive retention", () => {const value = input(); value.archive.immutable = false; assert.equal(run(handoff(), value).status, "blocked_retention");});
test("requires sufficient archive runway", () => {const value = input(); value.archive.retentionUntil = "2027-05-01T00:00:00Z"; assert.equal(run(handoff(), value).status, "blocked_retention");});
test("requires current exact rollback", () => {const value = input(); value.rollback.targetVersion = "policy-2"; value.rollback.testedAt = "2027-01-01T00:00:00Z"; assert.equal(run(handoff(), value).status, "blocked_retention");});
test("requires aligned monitoring obligations", () => {const value = input(); value.monitoring[0].owner = "Other council"; assert.equal(run(handoff(), value).status, "blocked_retention");});
test("requires due monitoring completion", () => {const value = input({asOf: "2027-05-09T00:00:00Z", maximumSnapshotGapHours: 720, maximumSnapshotAgeHours: 720, review: {reviewer: "Configuration assurance chair", decision: "retain_baseline", rationale: "Review due obligations.", reviewedAt: "2027-05-09T01:00:00Z"}}); value.snapshots[2].observedAt = "2027-05-08T23:00:00Z"; assert.equal(run(handoff(), value).checks.find(item => item.id === "monitoring-current").passed, false);});
test("accepts monitoring completed by its deadline", () => {const value = input({asOf: "2027-05-09T00:00:00Z", maximumSnapshotGapHours: 720, maximumSnapshotAgeHours: 720, review: {reviewer: "Configuration assurance chair", decision: "retain_baseline", rationale: "Review completed obligations.", reviewedAt: "2027-05-09T01:00:00Z"}}); value.snapshots[2].observedAt = "2027-05-08T23:00:00Z"; value.monitoring[0].status = "completed"; value.monitoring[0].completedAt = "2027-05-07T00:00:00Z"; assert.equal(run(handoff(), value).checks.find(item => item.id === "monitoring-current").passed, true);});
test("requires an independent reviewer", () => {const value = input(); value.review.reviewer = "Baseline chair"; assert.equal(run(handoff(), value).status, "blocked_retention");});
test("preserves remediation and freeze as human actions", () => {for (const decision of ["remediate_drift", "freeze_changes"]) {const value = input(); value.review.decision = decision; assert.equal(run(handoff(), value).status, "action_required");}});
test("rejects invalid policies and malformed reports", () => {assert.throws(() => run({}, input()), /Project 55/); assert.throws(() => run(handoff(), input({minimumSnapshots: 1})), /2 to 100/);});
