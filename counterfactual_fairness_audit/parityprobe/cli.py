from __future__ import annotations

import argparse
import json
from pathlib import Path

from .demo import run_demo
from .report import render_html


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the reproducible ParityProbe counterfactual audit")
    parser.add_argument("--json", default="parityprobe-report.json")
    parser.add_argument("--html", default="parityprobe-report.html")
    args = parser.parse_args()
    report = run_demo()
    Path(args.json).write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")
    Path(args.html).write_text(render_html(report), encoding="utf-8")
    summary = {"dataset": report["dataset"], "baseline": report["models"]["baseline"], "masked": report["models"]["masked"], "validity": {k: v for k, v in report["validity"].items() if k != "results"}, "intersection_coverage": report["intersection_coverage"]}
    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()

