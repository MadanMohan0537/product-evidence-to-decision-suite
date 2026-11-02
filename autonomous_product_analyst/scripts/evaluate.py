"""Evaluate the deterministic engine against planted synthetic ground truth."""

import json
import tempfile
from pathlib import Path

from generate_data import generate

from backend.app.database import Database
from backend.app.service import analyze_question


cases = json.loads(Path("evaluation/cases.json").read_text())["cases"]
with tempfile.TemporaryDirectory() as directory:
    path = str(Path(directory) / "evaluation.db")
    generate(path)
    results = []
    for case in cases:
        output = analyze_question(Database(path), case["question"], case.get("end"))
        investigation = output["investigation"]
        checks = []
        if "expected_direction" in case:
            checks.append(("direction", investigation["delta"] < 0, case["expected_direction"]))
        if "expected_primary_dimension" in case:
            checks.append(("primary_dimension", investigation["primary_contributor"]["dimension"] == case["expected_primary_dimension"], case["expected_primary_dimension"]))
        if "expected_primary_value" in case:
            checks.append(("primary_value", investigation["primary_contributor"]["value"] == case["expected_primary_value"], case["expected_primary_value"]))
        if "minimum_z_score" in case:
            checks.append(("z_score", investigation["overall_z_score"] >= case["minimum_z_score"], case["minimum_z_score"]))
        if "expected_metric" in case:
            checks.append(("metric", investigation["metric"]["name"] == case["expected_metric"], case["expected_metric"]))
        results.append({"question": case["question"], "passed": all(check[1] for check in checks), "checks": checks})

report = {"cases": len(results), "passed": sum(result["passed"] for result in results), "results": results}
print(json.dumps(report, indent=2))
if report["passed"] != report["cases"]:
    raise SystemExit(1)
