"""Small, strict validator for generated analytical SQL."""

import re


FORBIDDEN = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|ATTACH|DETACH|PRAGMA|VACUUM|REINDEX|REPLACE|TRUNCATE)\b",
    re.IGNORECASE,
)
COMMENT = re.compile(r"(--|/\*)")
TABLE = re.compile(r"\b(?:FROM|JOIN)\s+([a-zA-Z_][\w]*)", re.IGNORECASE)


def validate_sql(sql: str, allowed_tables: set[str] | None = None) -> str:
    statement = str(sql or "").strip()
    if not statement:
        raise ValueError("SQL must not be empty")
    if COMMENT.search(statement):
        raise ValueError("SQL comments are not allowed")
    if statement.count(";") > 1 or (";" in statement and not statement.endswith(";")):
        raise ValueError("only one SQL statement is allowed")
    statement = statement.rstrip(";").strip()
    if not re.match(r"^(SELECT|WITH)\b", statement, re.IGNORECASE):
        raise ValueError("only SELECT queries are allowed")
    if FORBIDDEN.search(statement):
        raise ValueError("mutating SQL is forbidden")
    tables = {match.lower() for match in TABLE.findall(statement)}
    unknown = tables - {table.lower() for table in (allowed_tables or {"events", "releases"})}
    if unknown:
        raise ValueError(f"table is not allowlisted: {sorted(unknown)[0]}")
    return statement


def metric_sql(metric, start: str, end: str, dimension: str | None = None) -> tuple[str, tuple]:
    if dimension and not re.fullmatch(r"[a-z_]+", dimension):
        raise ValueError("invalid dimension")
    group = f", {dimension} AS dimension_value" if dimension else ""
    group_by = f" GROUP BY {dimension}" if dimension else ""
    sql = f"""
        SELECT
          COUNT(DISTINCT CASE WHEN event_name = ? THEN user_id END) AS numerator,
          COUNT(DISTINCT CASE WHEN event_name = ? THEN user_id END) AS denominator
          {group}
        FROM events
        WHERE event_date >= ? AND event_date < ?
          AND event_name IN (?, ?)
        {group_by}
    """
    params = (
        metric.numerator_event,
        metric.denominator_event,
        start,
        end,
        metric.numerator_event,
        metric.denominator_event,
    )
    return validate_sql(sql), params
