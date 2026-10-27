#!/usr/bin/env python3
"""Turn script lines into a timed beat sheet.

usage: beat_sheet.py SCRIPT.txt [--wpm 160] [--min 1.2] [--target 25]
One line per beat. Duration = words / wpm (spoken) but never below --min seconds,
which also suits on-screen-only text read at a calm pace.
"""
import argparse, sys


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("--wpm", type=float, default=160)
    ap.add_argument("--min", type=float, default=1.2, dest="minimum")
    ap.add_argument("--target", type=float, default=0, help="target total seconds; warns if exceeded")
    a = ap.parse_args()
    lines = [l.strip() for l in open(a.script, encoding="utf-8") if l.strip() and not l.startswith("#")]
    t = 0.0
    print(f"{'#':>2}  {'start':>6} {'dur':>5}  text")
    for i, line in enumerate(lines, 1):
        dur = max(a.minimum, len(line.split()) / a.wpm * 60)
        print(f"{i:>2}  {t:6.1f} {dur:5.1f}  {line}")
        t += dur
    print(f"total {t:.1f}s  ({int(t * 30)} frames at 30fps)")
    if a.target and t > a.target:
        print(f"WARNING: {t - a.target:.1f}s over the {a.target:.0f}s target")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
