import unittest
from synthseal.fixtures import adults
from synthseal.studio import *

class StudioTests(unittest.TestCase):
    def setUp(self): self.real=adults(); self.train,self.test=self.real[:180],self.real[180:]
    def test_generate_count(self): self.assertEqual(len(generate(self.train,50)),50)
    def test_generate_deterministic(self): self.assertEqual(generate(self.train,5),generate(self.train,5))
    def test_generate_requires_data(self):
        with self.assertRaises(ValueError): generate([],2)
    def test_generate_positive_count(self):
        with self.assertRaises(ValueError): generate(self.train,0)
    def test_schema_preserved(self): self.assertEqual(set(generate(self.train,1)[0]),set(self.train[0]))
    def test_no_negative_numeric(self): self.assertTrue(all(r[k]>=0 for r in generate(self.train,50) for k in NUMERIC))
    def test_distribution_gap_identity(self): self.assertAlmostEqual(distribution_gap(self.train,self.train),0)
    def test_model_accuracy_range(self): self.assertTrue(0<=model_accuracy(self.train,self.test)<=1)
    def test_nearest_count(self): self.assertEqual(len(nearest_distances(self.train,generate(self.train,9))),9)
    def test_exact_copy_attack(self): self.assertEqual(membership_attack_rate(self.train,[dict(self.train[0])]),1)
    def test_generated_attack_bounded(self): self.assertLess(membership_attack_rate(self.train,generate(self.train,180)),.2)
    def test_rare_key_exists(self): self.assertEqual(rarity_counts(self.real)[("Graduate","Remote",1)],1)
    def test_rare_copy_detected(self):
        synth=generate(self.real,40)+[dict(self.real[-1])]
        self.assertTrue(any(f.exposed for f in rare_disclosure_audit(self.real,synth)))
    def test_common_copy_not_rare_challenge(self):
        row=next(r for r in self.real if rarity_counts(self.real)[(r["education"],r["region"],r["target"])]>2)
        self.assertFalse(any(f.exposed for f in rare_disclosure_audit(self.real,[dict(row)])))
    def test_remove_exposed(self):
        synth=generate(self.real,30)+[dict(self.real[-1])]; fs=rare_disclosure_audit(self.real,synth)
        self.assertEqual(len(remove_exposed(synth,fs)),len(synth)-1)
    def test_removal_clears_exposure(self):
        synth=generate(self.real,30)+[dict(self.real[-1])]; clean=remove_exposed(synth,rare_disclosure_audit(self.real,synth))
        self.assertEqual(sum(f.exposed for f in rare_disclosure_audit(self.real,clean)),0)
    def test_report_fields(self):
        report=evaluate_release(self.train,self.test,generate(self.train,180))
        self.assertIn("utility_gap",report); self.assertIn("membership_attack_rate",report)
    def test_fixture_deterministic(self): self.assertEqual(adults(),adults())
    def test_fixture_has_holdout(self): self.assertEqual(len(self.test),60)
    def test_utility_reasonable(self): self.assertLess(abs(evaluate_release(self.train,self.test,generate(self.train,180))["utility_gap"]),.25)

    def test_membership_auc_is_bounded(self):
        value=membership_inference_auc(self.train,self.test,generate(self.train,180))
        self.assertTrue(0<=value<=1)

    def test_memorized_training_table_has_maximum_membership_auc(self):
        self.assertEqual(1,membership_inference_auc(self.train,self.test,[dict(r) for r in self.train]))

    def test_attribute_attack_reports_denominator_and_baseline(self):
        result=attribute_inference(self.train,self.test,generate(self.train,180))
        self.assertEqual(len(self.test),result["cases"])
        self.assertTrue(0<=result["accuracy"]<=1)
        self.assertTrue(0<=result["majority_baseline"]<=1)

    def test_attack_ensemble_finds_seeded_rare_copy(self):
        source=self.train[:-1]+[self.real[-1]]
        synth=generate(source,180)+[dict(self.real[-1])]
        result=attack_ensemble(source,self.test,synth)
        rare=next(a for a in result["attacks"] if a["name"]=="rare_record_copy")
        self.assertTrue(rare["risk_flag"])
        self.assertEqual("BLOCK_FOR_PRIVACY_REVIEW",result["release_recommendation"])

    def test_remediation_clears_rare_attack_flag(self):
        source=self.train[:-1]+[self.real[-1]]
        synth=generate(source,180)+[dict(self.real[-1])]
        clean=remove_exposed(synth,rare_disclosure_audit(source,synth))
        rare=next(a for a in attack_ensemble(source,self.test,clean)["attacks"] if a["name"]=="rare_record_copy")
        self.assertFalse(rare["risk_flag"])

    def test_attack_ensemble_rejects_empty_inputs(self):
        with self.assertRaises(ValueError): attack_ensemble([],self.test,generate(self.train,2))
        with self.assertRaises(ValueError): evaluate_release(self.train,self.test,[])

    def test_attack_limits_are_validated(self):
        with self.assertRaises(ValueError): attack_ensemble(self.train,self.test,generate(self.train,5),membership_auc_limit=.4)
        with self.assertRaises(ValueError): attack_ensemble(self.train,self.test,generate(self.train,5),attribute_advantage_limit=-.1)

if __name__=="__main__": unittest.main()

