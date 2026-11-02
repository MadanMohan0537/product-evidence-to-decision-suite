# Method and limitations

RiskCouncil uses fixed propose, rebut, and concede rounds. Each persona receives the same structured brief plus distinct private context. The moderator validates mechanisms, ownership, mitigations, score ranges, and removes near-duplicate titles only within the same assumption.

The shipped implementation is deterministic so experiments are reproducible and require no paid model. It demonstrates orchestration and evaluation mechanics, not the creative range of an LLM panel.

The P1 intervention changes only the audience assumption from a 100-customer pilot to a global 10,000-customer launch. Success is defined before execution: all four audience-linked mechanisms change, while all four support-model controls remain stable. This is a structural test; blind human ratings are planned and not claimed.

P2 creates one falsification card per validated risk. A card must name the
test, metric direction, threshold, minimum sample, exact evidence scope, power
limitation, and decision deadline. Evidence can produce keep,
retire_candidate, or insufficient_evidence. A threshold pass with too little
data or the wrong scope is insufficient; the software never automatically
deletes or declares a risk false.

The frozen experiment resolves four of eight cards in four authored review
hours, versus zero mechanically resolved risks in a plain register. That
demonstrates workflow arithmetic only. It is not evidence that the tests are
cheap, adequately powered, or useful in a real launch.

Important limitations:

- Generated risks are hypotheses, not forecasts, legal advice, or substitutes for affected experts.
- Token overlap is not a semantic gold standard and can misclassify paraphrases.
- Persona templates reflect their author's framing and can omit stakeholders.
- Synthetic briefs cannot establish real-world recall or reviewer value.
- Likelihood and impact scores are ordinal prompts for discussion, not calibrated probabilities.
- Human-baseline comparison is sensitive to wording and the completeness of the human list.
- Falsification thresholds, review hours, and sample sizes are synthetic inputs, not measured operating results.
- A retirement candidate means only that declared evidence passed its declared test; hidden mechanisms and weak test power can remain.
