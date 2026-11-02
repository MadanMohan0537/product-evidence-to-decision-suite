from __future__ import annotations

from dataclasses import replace

from .models import Candidate, Counterfactual


def generate(candidate: Candidate, attribute: str) -> Counterfactual:
    if attribute == "name_group":
        group = "group-b" if candidate.name_group == "group-a" else "group-a"
        name = "Jordan" if group == "group-b" else "Alex"
        variant = replace(candidate, name=name, name_group=group)
        edits = ("name", "name_group")
    elif attribute == "gender_marker":
        marker = "male" if candidate.gender_marker == "female" else "female"
        variant = replace(candidate, gender_marker=marker)
        edits = ("gender_marker",)
    elif attribute == "zip_proxy":
        if candidate.region == "north":
            variant = replace(candidate, zip_code="20" + candidate.zip_code[2:], region="south")
        else:
            variant = replace(candidate, zip_code="10" + candidate.zip_code[2:], region="north")
        edits = ("zip_code", "region")
    else:
        raise ValueError(f"unsupported attribute: {attribute}")
    return Counterfactual(f"{candidate.record_id}:{attribute}", attribute, candidate, variant, edits)


def suite(candidates: list[Candidate], attributes: tuple[str, ...] = ("name_group", "gender_marker", "zip_proxy")) -> list[Counterfactual]:
    return [generate(candidate, attribute) for candidate in candidates for attribute in attributes]
