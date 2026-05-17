"""Export games catalog from SQLite to docs/data/games.json."""
import json
import os
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "instance" / "game_store.db"
OUT = ROOT / "docs" / "data" / "games.json"


def main():
    if not DB.exists():
        raise SystemExit(f"Database not found: {DB}")

    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT id, name, price, description, image_url, category, developer, release_year "
        "FROM games ORDER BY id"
    ).fetchall()

    games = []
    for row in rows:
        game = dict(row)
        url = game.get("image_url") or ""
        if url.startswith("/static/"):
            game["image_url"] = url[1:]
        games.append(game)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(games, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Exported {len(games)} games to {OUT}")


if __name__ == "__main__":
    main()
