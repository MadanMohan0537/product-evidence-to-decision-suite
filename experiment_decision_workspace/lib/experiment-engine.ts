export type Counts = { controlVisitors: number; controlConversions: number; treatmentVisitors: number; treatmentConversions: number };
export type Guardrail = { name: string; control: number; treatment: number; maxRegression: number; direction: "higher" | "lower" };
export type Draft = { id: string; name: string; hypothesis: string; audience: string; metric: string; baseline: number; mde: number; counts: Counts; guardrails: Guardrail[]; decision: string; rollout: number; createdAt: string };

function finite(value: number, label: string, min = 0) {
  if (!Number.isFinite(value) || value < min) throw new Error(`${label} must be a finite number ≥ ${min}.`);
}
export function sampleSize(baseline: number, relativeMde: number) {
  finite(baseline, "Baseline"); finite(relativeMde, "Relative MDE");
  const treatment = baseline * (1 + relativeMde);
  if (baseline <= 0 || baseline >= 1 || relativeMde <= 0 || treatment >= 1) throw new Error("Baseline and target must lie between 0% and 100%; MDE must be positive.");
  const average = (baseline + treatment) / 2;
  return Math.ceil((1.96 * Math.sqrt(2 * average * (1 - average)) + 0.8416 * Math.sqrt(baseline * (1 - baseline) + treatment * (1 - treatment))) ** 2 / (treatment - baseline) ** 2);
}
function normalCdf(x: number) {
  const t = 1 / (1 + .2316419 * Math.abs(x));
  const tail = Math.exp(-x*x/2)/Math.sqrt(2*Math.PI) * t * (.319381530 + t * (-.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1-tail : tail;
}
export function analyze(counts: Counts, guardrails: Guardrail[], baseline: number, relativeMde: number) {
  const targetPerArm = sampleSize(baseline, relativeMde);
  for (const [key, value] of Object.entries(counts)) {
    finite(value, key); if (!Number.isSafeInteger(value)) throw new Error("Counts must be nonnegative safe integers.");
  }
  const {controlVisitors: n0, controlConversions: c0, treatmentVisitors: n1, treatmentConversions: c1} = counts;
  if (c0 > n0 || c1 > n1) throw new Error("Conversions cannot exceed visitors.");
  const checked = guardrails.map(g => {
    if (!g.name.trim() || !["higher", "lower"].includes(g.direction)) throw new Error("Each guardrail needs a name and preferred direction.");
    finite(g.control,g.name); finite(g.treatment,g.name); finite(g.maxRegression,"Allowed regression");
    const regression = g.direction === "higher" ? g.control - g.treatment : g.treatment - g.control;
    return {...g, regression, breached: regression > g.maxRegression};
  });
  if (!n0 || !n1) return {status:"Awaiting results",recommendation:"Hold",reason:"Both experiment arms need visitor counts.",targetPerArm,guardrails:checked};
  const p0=c0/n0,p1=c1/n1,pooled=(c0+c1)/(n0+n1),delta=p1-p0;
  const se=Math.sqrt(pooled*(1-pooled)*(1/n0+1/n1));
  const z=se ? delta/se : 0;
  const pValue=Math.min(1,Math.max(0,2*(1-normalCdf(Math.abs(z)))));
  const intervalSe=Math.sqrt(p0*(1-p0)/n0+p1*(1-p1)/n1);
  const chiSquare=(n0-n1)**2/(n0+n1);
  const sparse=Math.min(c0,n0-c0,c1,n1-c1)<5;
  const enough=n0>=targetPerArm && n1>=targetPerArm;
  let recommendation="Iterate",reason="The primary metric has not cleared the planned evidence and effect thresholds.";
  if (checked.some(g=>g.breached)) {recommendation="Rollback";reason="An entered guardrail exceeds its allowed regression.";}
  else if(chiSquare>6.635){recommendation="Hold";reason="Sample-ratio mismatch detected against planned 50/50 assignment (1% chi-square threshold).";}
  else if(sparse){recommendation="Hold";reason="Sparse outcomes invalidate this normal approximation; use an exact analysis.";}
  else if(!enough){recommendation="Hold";reason="The planned sample size has not been reached in both arms.";}
  else if(pValue<.05 && delta<0){recommendation="Rollback";reason="The primary metric shows a negative difference at the fixed 5% threshold.";}
  else if(pValue<.05 && delta>=baseline*relativeMde){recommendation=checked.length?"Ship":"Hold";reason=checked.length?"Planned sample, positive effect, fixed-horizon significance and entered guardrails clear the configured checks.":"Primary evidence clears the checks, but no guardrails were entered. Define them before a ship recommendation.";}
  return {status:"Analyzed",recommendation,reason,targetPerArm,controlRate:p0,treatmentRate:p1,absoluteLift:delta,relativeLift:p0 ? delta/p0 : null,pValue:sparse?null:pValue,confidenceInterval95:sparse?null:[Math.max(-1,delta-1.96*intervalSe),Math.min(1,delta+1.96*intervalSe)],sampleRatioMismatch:chiSquare>6.635,sparse,guardrails:checked,
    limitations:["Fixed-horizon two-proportion normal approximation; repeated peeking is not controlled.","Independent users and 50/50 randomized assignment are assumed, not verified.","A recommendation supports human review; rollout changes here are local planning state.",...(checked.length ? []:["No guardrails were entered; readiness is incomplete outside the primary metric."])]};
}
export function validateDraft(value: unknown): Draft {
  if (!value || typeof value !== "object") throw new Error("Invalid experiment draft.");
  const d=value as Draft;
  for (const key of ["id","name","hypothesis","audience","metric","createdAt"] as const) if(typeof d[key]!=="string" || !d[key].trim() || d[key].length>4000) throw new Error(`Invalid draft ${key}.`);
  if(!Number.isFinite(Date.parse(d.createdAt)) || !["Pending","Ship","Hold","Iterate","Rollback"].includes(d.decision))throw new Error("Invalid draft date or decision.");
  if(!Array.isArray(d.guardrails) || d.guardrails.length>20 || !d.counts)throw new Error("Invalid draft measurement data.");
  if(!Number.isInteger(d.rollout) || d.rollout<0 || d.rollout>100)throw new Error("Invalid draft rollout.");
  analyze(d.counts,d.guardrails,d.baseline,d.mde);
  return d;
}
