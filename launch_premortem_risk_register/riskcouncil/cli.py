from __future__ import annotations

import argparse
import json
from dataclasses import asdict

from .demo import run_demo


def main() -> None:
    parser = argparse.ArgumentParser(description="Run RiskCouncil's deterministic launch premortem")
    parser.add_argument("--markdown", default="premortem.md")
    parser.add_argument("--json", default="premortem.json")
    args = parser.parse_args()
    report = run_demo()
    with open(args.markdown, "w", encoding="utf-8") as handle:
        handle.write(report.pop("markdown"))
    serializable = {**report, "brief": asdict(report["brief"])}
    with open(args.json, "w", encoding="utf-8") as handle:
        json.dump(serializable, handle, indent=2, sort_keys=True)
    print(json.dumps({k: v for k, v in serializable.items() if k != "intervention"}, indent=2))


if __name__ == "__main__":
    main()
