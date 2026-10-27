#!/usr/bin/env python3
"""Lint an Instagram caption against a brand profile.

usage: lint_caption.py CAPTION.txt [--brand ../brands/<brand>/brand.json]
Exit code 0 = clean, 1 = problems found. Reads stdin when CAPTION is '-'.
"""
import argparse, json, re, sys

VISIBLE = 125  # characters shown before "... more" in the feed


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("caption")
    ap.add_argument("--brand")
    a = ap.parse_args()
    text = sys.stdin.read() if a.caption == "-" else open(a.caption, encoding="utf-8").read()
    text = text.strip()
    problems, notes = [], []

    first = text[:VISIBLE]
    notes.append(f"visible before '... more' ({len(first)} chars): {first!r}")
    if len(text) < 20:
        problems.append("caption is very short")
    if len(text) > 2200:
        problems.append("longer than Instagram's 2200-character limit")

    tags = re.findall(r"#\w+", text)
    if len(tags) > 5:
        problems.append(f"{len(tags)} hashtags; keep it to 3-5")
    if re.search(r"[–—]", text):
        problems.append("contains en/em dashes (reads as machine text); use a comma or hyphen")
    if re.search(r"\{\{.*?\}\}|\bTODO\b", text):
        problems.append("unresolved placeholder or TODO")
    emojis = re.findall(r"[\U0001F300-\U0001FAFF☀-➿]", text)
    if len(emojis) > 3:
        problems.append(f"{len(emojis)} emojis; brand voice allows very few")
    if re.search(r"[​‌‍⁠﻿]", text):
        notes.append("contains zero-width characters (normal in Kurdish/Arabic joining; check only if unexpected)")
    if not re.search(r"[؀-ۿ]", text):
        notes.append("no Arabic-script text found; expected Kurdish or Arabic for these brands")

    if a.brand:
        b = json.load(open(a.brand, encoding="utf-8"))
        low = text.lower()
        for word in b.get("forbidden", []):
            if word.lower() in low:
                problems.append(f"brand-forbidden word: {word!r}")
        if re.search(r"https?://", text) is None and b.get("site") and b["site"] not in text:
            notes.append(f"site {b['site']} not mentioned")

    for n in notes:
        print("note:", n)
    for p in problems:
        print("PROBLEM:", p)
    print("OK" if not problems else f"{len(problems)} problem(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
