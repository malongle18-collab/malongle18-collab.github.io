#!/usr/bin/env python3
"""Materialize images/recipes/*.jpg from adjacent .jpg.b64 sidecars (text-safe in git)."""
from __future__ import annotations

import base64
import pathlib
import sys

ROOT = pathlib.Path("images/recipes")


def main() -> int:
    if not ROOT.is_dir():
        print("no images/recipes directory", file=sys.stderr)
        return 1
    files = sorted(ROOT.glob("*.jpg.b64"))
    if not files:
        print("no .jpg.b64 sidecars found", file=sys.stderr)
        return 1
    for src in files:
        dest = ROOT / src.name[: -len(".b64")]
        data = base64.b64decode(src.read_text().strip())
        dest.write_bytes(data)
        print(f"wrote {dest} ({len(data)} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
