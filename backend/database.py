import json
import sqlite3
from pathlib import Path

from data import INCIDENTS, RESOURCES

DB_PATH = Path(__file__).with_name("aegisflow.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS incidents (
                id TEXT PRIMARY KEY,
                payload TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS resources (
                id TEXT PRIMARY KEY,
                payload TEXT NOT NULL
            )
            """
        )
        conn.executemany(
            "INSERT OR REPLACE INTO incidents (id, payload) VALUES (?, ?)",
            [(item["id"], json.dumps(item)) for item in INCIDENTS],
        )
        conn.executemany(
            "INSERT OR REPLACE INTO resources (id, payload) VALUES (?, ?)",
            [(item["id"], json.dumps(item)) for item in RESOURCES],
        )


def list_incidents():
    with get_connection() as conn:
        rows = conn.execute("SELECT payload FROM incidents ORDER BY id").fetchall()
    return [json.loads(row["payload"]) for row in rows]


def list_resources():
    with get_connection() as conn:
        rows = conn.execute("SELECT payload FROM resources ORDER BY id").fetchall()
    return [json.loads(row["payload"]) for row in rows]
