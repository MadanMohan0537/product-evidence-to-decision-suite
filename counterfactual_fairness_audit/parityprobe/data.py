from __future__ import annotations

from .models import Candidate


def candidates() -> list[Candidate]:
    rows = []
    names = [("Alex", "group-a", "neutral"), ("Jordan", "group-b", "neutral"), ("Maya", "group-a", "female"), ("Noah", "group-b", "male")]
    for index in range(48):
        name, group, gender = names[index % len(names)]
        skill = 58 + (index * 7) % 39
        experience = 1 + (index * 3) % 10
        qualification = (skill + experience * 2) >= 76
        region = "north" if index % 2 == 0 else "south"
        zip_code = ("10" if region == "north" else "20") + f"{index:03d}"
        rows.append(Candidate(f"C-{index:03d}", skill, experience, qualification and "advanced" or "standard", name, group, gender, zip_code, region, qualification))
    return rows
