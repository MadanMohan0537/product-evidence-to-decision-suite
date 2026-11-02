"""Generate a deterministic synthetic SaaS dataset with a planted activation regression."""

import argparse
import random
import sqlite3
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backend.app.database import Database  # noqa: E402


def generate(path: str, end: date = date(2026, 9, 1), days: int = 28, users_per_day: int = 120) -> dict:
    rng = random.Random(42)
    database = Database(path)
    database.initialize()
    release_day = end - timedelta(days=7)
    events = []
    for offset in range(days):
        event_day = end - timedelta(days=days - offset)
        for index in range(users_per_day):
            user_id = f"u-{offset:02d}-{index:03d}"
            platform = rng.choices(["ios", "android", "web"], [0.35, 0.4, 0.25])[0]
            country = rng.choices(["US", "UK", "IN", "DE"], [0.46, 0.17, 0.25, 0.12])[0]
            segment = rng.choices(["self-serve", "SMB", "enterprise"], [0.45, 0.4, 0.15])[0]
            source = rng.choice(["organic", "paid-search", "partner", "referral"])
            version = "4.18" if event_day >= release_day else "4.17"
            device = rng.choice(["phone", "tablet"]) if platform != "web" else "desktop"
            permission_screen = platform == "android" and country == "US" and version == "4.18"
            feature_usage = "payment-permission" if permission_screen else rng.choice(["templates", "import", "none"])
            dimensions = (platform, country, segment, source, version, device, feature_usage)
            events.append((f"{user_id}-signup", user_id, "signup", event_day.isoformat(), *dimensions, "account_created"))
            probability = 0.73
            if permission_screen:
                probability -= 0.34
            if segment == "enterprise":
                probability += 0.05
            if rng.random() < probability:
                events.append((f"{user_id}-activated", user_id, "onboarding_completed", event_day.isoformat(), *dimensions, "workspace_created"))
            if rng.random() < 0.22:
                events.append((f"{user_id}-paid", user_id, "subscription_started", event_day.isoformat(), *dimensions, "billing_complete"))
            if rng.random() < 0.58:
                events.append((f"{user_id}-retained", user_id, "retained", event_day.isoformat(), *dimensions, "return_visit"))
    with database.connect() as connection:
        connection.execute("DELETE FROM events")
        connection.execute("DELETE FROM releases")
        connection.executemany("INSERT INTO events VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", events)
        connection.execute("INSERT INTO releases VALUES (?,?,?)", ("4.18", release_day.isoformat(), "Introduced a payment-permission step for Android onboarding."))
    return {"path": path, "users": days * users_per_day, "events": len(events), "release": "4.18", "release_day": release_day.isoformat()}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="data/product_analytics.db")
    parser.add_argument("--end", default="2026-09-01")
    args = parser.parse_args()
    print(generate(args.output, date.fromisoformat(args.end)))
