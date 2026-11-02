import argparse, json
from pathlib import Path
from .fixtures import month, year
from .monitor import DriftMonitor, alert_lead_month, calibrate_false_alarm_budget

def main() -> None:
    p=argparse.ArgumentParser(); p.add_argument("--output",type=Path,default=Path("drift-report.json")); args=p.parse_args()
    reference=month(1,"reference")
    stable_history=[month(1000+i,f"history-{i:02d}") for i in range(60)]
    alarm_budget=calibrate_false_alarm_budget(reference,stable_history)
    monitor=DriftMonitor(reference,alarm_budget=alarm_budget)
    decisions=[monitor.analyze(b) for b in year()]
    report={"product":"DriftDocket","months":[{"month":d.month,"action":d.action,"mature_labels":d.mature_labels,
      "performance_drop":d.performance_drop,"estimated_cost":d.estimated_cost,
      "features":[{"name":f.feature,"psi":f.psi,"ks":f.ks} for f in d.findings]} for d in decisions],
      "alert_lead_months":alert_lead_month(decisions),
      "false_alarm_budget":{"monthly_budget":alarm_budget.monthly_budget,
        "psi_threshold":alarm_budget.psi_threshold,"ks_threshold":alarm_budget.ks_threshold,
        "calibration_draws":alarm_budget.calibration_draws,"calibration_windows":alarm_budget.calibration_windows,
        "block_size":alarm_budget.block_size,
        "calibration_alarm_rate":alarm_budget.calibration_alarm_rate},
      "tickets":[d.issue_body() for d in decisions if d.action=="OPEN_RETRAIN_TICKET"]}
    args.output.write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps({"months":len(decisions),"tickets":len(report["tickets"]),"alert_lead_months":report["alert_lead_months"],"calibration_alarm_rate":alarm_budget.calibration_alarm_rate},indent=2))
if __name__=="__main__": main()

