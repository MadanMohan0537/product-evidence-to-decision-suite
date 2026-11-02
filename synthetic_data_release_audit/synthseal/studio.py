"""Dependency-free synthetic table generator and release evidence."""
from __future__ import annotations
from collections import Counter, defaultdict
from dataclasses import dataclass, asdict
from math import sqrt
from random import Random
from statistics import mean, pstdev
from typing import Any

Row = dict[str, Any]
NUMERIC = ("age", "income", "hours")
CATEGORICAL = ("education", "region", "target")

def _distance(a: Row, b: Row, scales: dict[str,float]) -> float:
    numeric=sum(((float(a[k])-float(b[k]))/scales[k])**2 for k in NUMERIC)
    categorical=sum(a[k]!=b[k] for k in ("education","region"))
    return sqrt(numeric+categorical)

def _scales(rows: list[Row]) -> dict[str,float]:
    return {k:max(pstdev(float(r[k]) for r in rows),1.0) for k in NUMERIC}

def generate(real: list[Row], count: int, seed: int=7) -> list[Row]:
    """Conditional marginal sampler: preserves target/education groups without copying rows."""
    if not real or count < 1: raise ValueError("real data and positive count required")
    rng=Random(seed); groups:dict[tuple[str,int],list[Row]]=defaultdict(list)
    for row in real: groups[(row["education"],row["target"])].append(row)
    keys=list(groups)
    weights=[len(groups[k]) for k in keys]
    out=[]
    for _ in range(count):
        key=rng.choices(keys,weights=weights,k=1)[0]; pool=groups[key]
        row={"education":key[0],"target":key[1]}
        row["region"]=rng.choice(pool)["region"]
        for field in NUMERIC:
            values=[float(r[field]) for r in pool]
            value=rng.gauss(mean(values),max(pstdev(values),1.0))
            row[field]=round(max(0,value),2)
        out.append(row)
    return out

def distribution_gap(real:list[Row], synth:list[Row]) -> float:
    scales=_scales(real)
    numeric=[abs(mean(float(r[k]) for r in real)-mean(float(r[k]) for r in synth))/scales[k] for k in NUMERIC]
    categorical=[]
    for k in CATEGORICAL:
        rv=Counter(r[k] for r in real); sv=Counter(r[k] for r in synth); cats=set(rv)|set(sv)
        categorical.append(sum(abs(rv[c]/len(real)-sv[c]/len(synth)) for c in cats)/2)
    return mean(numeric+categorical)

def _centroids(train:list[Row]) -> dict[int,dict[str,float]]:
    result={}
    for label in (0,1):
        rows=[r for r in train if r["target"]==label]
        result[label]={k:mean(float(r[k]) for r in rows) for k in NUMERIC}
    return result

def model_accuracy(train:list[Row], test:list[Row]) -> float:
    centers=_centroids(train); scales=_scales(train)
    correct=0
    for row in test:
        pred=min((0,1),key=lambda label:sum(((float(row[k])-centers[label][k])/scales[k])**2 for k in NUMERIC))
        correct += pred==row["target"]
    return correct/len(test)

def nearest_distances(real:list[Row], synth:list[Row]) -> list[float]:
    scales=_scales(real)
    return [min(_distance(s,r,scales) for r in real) for s in synth]

def membership_attack_rate(real:list[Row], synth:list[Row], threshold:float=.02) -> float:
    if not real or not synth: raise ValueError("real and synthetic data must be non-empty")
    return sum(d<=threshold for d in nearest_distances(real,synth))/len(synth)

def membership_inference_auc(members:list[Row], nonmembers:list[Row], synth:list[Row]) -> float:
    """Optimistic attacker AUC: smaller distance to the release predicts membership."""
    if not members or not nonmembers or not synth:
        raise ValueError("members, nonmembers, and synthetic data must be non-empty")
    scales=_scales(members+nonmembers)
    member_dist=[min(_distance(row,s,scales) for s in synth) for row in members]
    nonmember_dist=[min(_distance(row,s,scales) for s in synth) for row in nonmembers]
    wins=sum(m<n for m in member_dist for n in nonmember_dist)
    ties=sum(m==n for m in member_dist for n in nonmember_dist)
    return (wins+.5*ties)/(len(member_dist)*len(nonmember_dist))

def attribute_inference(members:list[Row], targets:list[Row], synth:list[Row]) -> dict[str,float|int]:
    """Infer target from quasi-identifiers using the nearest released row."""
    if not members or not targets or not synth:
        raise ValueError("members, targets, and synthetic data must be non-empty")
    fields=("age","hours")
    scales={k:max(pstdev(float(r[k]) for r in members+targets),1.0) for k in fields}
    def distance(a:Row,b:Row)->float:
        numeric=sum(((float(a[k])-float(b[k]))/scales[k])**2 for k in fields)
        categorical=sum(a[k]!=b[k] for k in ("education","region"))
        return sqrt(numeric+categorical)
    predictions=[min(synth,key=lambda s:distance(row,s))["target"] for row in targets]
    accuracy=mean(pred==row["target"] for pred,row in zip(predictions,targets))
    majority=max(Counter(r["target"] for r in synth).values())/len(synth)
    return {"cases":len(targets),"accuracy":accuracy,"majority_baseline":majority,"advantage":accuracy-majority}

def rarity_counts(real:list[Row]) -> Counter:
    return Counter((r["education"],r["region"],r["target"]) for r in real)

@dataclass(frozen=True)
class Disclosure:
    synthetic_index:int
    rare_key:tuple[Any,...]
    nearest_distance:float
    exposed:bool

def rare_disclosure_audit(real:list[Row], synth:list[Row], rare_max:int=2, threshold:float=.02) -> list[Disclosure]:
    counts=rarity_counts(real); scales=_scales(real); findings=[]
    for i,row in enumerate(synth):
        key=(row["education"],row["region"],row["target"])
        if counts[key] <= rare_max:
            distance=min(_distance(row,r,scales) for r in real)
            findings.append(Disclosure(i,key,distance,distance<=threshold))
    return findings

def remove_exposed(synth:list[Row], findings:list[Disclosure]) -> list[Row]:
    blocked={f.synthetic_index for f in findings if f.exposed}
    return [row for i,row in enumerate(synth) if i not in blocked]

def attack_ensemble(
    real_train:list[Row],
    real_test:list[Row],
    synth:list[Row],
    membership_auc_limit:float=.65,
    attribute_advantage_limit:float=.15,
) -> dict[str,Any]:
    if not .5 <= membership_auc_limit <= 1 or not 0 <= attribute_advantage_limit <= 1:
        raise ValueError("attack limits are out of range")
    rare=rare_disclosure_audit(real_train,synth)
    auc=membership_inference_auc(real_train,real_test,synth)
    attribute=attribute_inference(real_train,real_test,synth)
    attacks=[
      {"name":"rare_record_copy","cases":len(rare),"metric":sum(f.exposed for f in rare),
       "limit":0,"risk_flag":any(f.exposed for f in rare)},
      {"name":"membership_inference_auc","cases":len(real_train)+len(real_test),"metric":auc,
       "limit":membership_auc_limit,"risk_flag":auc>=membership_auc_limit},
      {"name":"attribute_inference_advantage","cases":attribute["cases"],"metric":attribute["advantage"],
       "limit":attribute_advantage_limit,"risk_flag":attribute["advantage"]>=attribute_advantage_limit},
    ]
    return {"attacks":attacks,"risk_flags":sum(a["risk_flag"] for a in attacks),
      "release_recommendation":"BLOCK_FOR_PRIVACY_REVIEW" if any(a["risk_flag"] for a in attacks) else "NO_ATTACK_EXCEEDED_LIMIT",
      "attribute_inference":attribute}

def evaluate_release(real_train:list[Row], real_test:list[Row], synth:list[Row]) -> dict[str,Any]:
    if not real_train or not real_test or not synth:
        raise ValueError("training, holdout, and synthetic data must be non-empty")
    real_acc=model_accuracy(real_train,real_test); synth_acc=model_accuracy(synth,real_test)
    findings=rare_disclosure_audit(real_train,synth)
    attacks=attack_ensemble(real_train,real_test,synth)
    return {"rows":len(synth),"distribution_gap":distribution_gap(real_train,synth),
      "real_train_accuracy":real_acc,"synthetic_train_accuracy":synth_acc,
      "utility_gap":real_acc-synth_acc,"membership_attack_rate":membership_attack_rate(real_train,synth),
      "rare_rows_audited":len(findings),"rare_exposures":sum(f.exposed for f in findings),
      "rare_findings":[asdict(f) for f in findings],"attack_ensemble":attacks}

