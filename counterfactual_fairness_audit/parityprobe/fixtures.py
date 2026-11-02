from __future__ import annotations

from dataclasses import replace

from .counterfactuals import generate
from .data import candidates
from .models import Candidate, Counterfactual


def validity_fixture() -> list[tuple[Counterfactual, bool]]:
    base = candidates()[0]
    valid_name = generate(base, "name_group")
    valid_gender = generate(replace(base, gender_marker="female"), "gender_marker")
    valid_zip = generate(base, "zip_proxy")
    bad_skill = Counterfactual("bad-skill", "gender_marker", base, replace(base, gender_marker="female", skill_score=10), ("gender_marker", "skill_score"))
    bad_group = Counterfactual("bad-group", "name_group", base, replace(base, name="Jordan", name_group="group-a"), ("name",))
    bad_zip = Counterfactual("bad-zip", "zip_proxy", base, replace(base, zip_code="10099", region="south"), ("zip_code", "region"))
    bad_declaration = Counterfactual("bad-declaration", "gender_marker", base, replace(base, gender_marker="female"), ("name",))
    valid_name_2 = generate(candidates()[1], "name_group")
    return [(valid_name, True), (valid_gender, True), (valid_zip, True), (bad_skill, False), (bad_group, False), (bad_zip, False), (bad_declaration, False), (valid_name_2, True)]


def intersection_fixture() -> list[Counterfactual]:
    """Frozen fixture with one well-covered control and one sparse disparity."""
    pairs = []
    for index in range(12):
        candidate = Candidate(
            f"coverage-{index:02d}", 94, 8, "advanced", "Alex", "group-a",
            "neutral", f"10{index:03d}", "north", True,
        )
        pairs.append(generate(candidate, "name_group"))
    for index in range(6):
        candidate = Candidate(
            f"sparse-{index:02d}", 82, 4, "advanced", "Jordan", "group-b",
            "male", f"20{index:03d}", "south", True,
        )
        pairs.append(generate(candidate, "name_group"))
    return pairs

