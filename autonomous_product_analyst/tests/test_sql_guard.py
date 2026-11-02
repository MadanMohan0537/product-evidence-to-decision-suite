import unittest

from backend.app.metrics import get_metric
from backend.app.sql_guard import metric_sql, validate_sql


class SqlGuardTests(unittest.TestCase):
    def test_allows_one_select(self):
        self.assertEqual(validate_sql("SELECT * FROM events"), "SELECT * FROM events")

    def test_allows_cte(self):
        self.assertTrue(validate_sql("WITH x AS (SELECT * FROM events) SELECT * FROM x", {"events", "x"}).startswith("WITH"))

    def test_rejects_mutation(self):
        for statement in ("DELETE FROM events", "DROP TABLE events", "UPDATE events SET user_id='x'"):
            with self.subTest(statement=statement), self.assertRaises(ValueError):
                validate_sql(statement)

    def test_rejects_multiple_statements_and_comments(self):
        with self.assertRaises(ValueError):
            validate_sql("SELECT * FROM events; SELECT * FROM events")
        with self.assertRaises(ValueError):
            validate_sql("SELECT * FROM events -- unsafe")

    def test_rejects_unknown_table(self):
        with self.assertRaisesRegex(ValueError, "allowlisted"):
            validate_sql("SELECT * FROM secrets")

    def test_metric_query_is_parameterized(self):
        sql, params = metric_sql(get_metric("activation"), "2026-01-01", "2026-01-08", "platform")
        self.assertNotIn("2026-01-01", sql)
        self.assertIn("2026-01-01", params)


if __name__ == "__main__":
    unittest.main()
