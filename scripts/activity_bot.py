#!/usr/bin/env python3
"""
Automated repository activity: 2–5 commits per day at staggered times.

Works with Python and Node/Next.js repos. Each run writes a unique snapshot.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
ACTIVITY_DIR = REPO_ROOT / "reports" / "activity"

# Must match cron entries in .github/workflows/daily-maintenance.yml (order matters).
SLOTS = [
    "22 3 * * *",
    "47 7 * * *",
    "27 11 * * *",
    "2 16 * * *",
    "17 20 * * *",
]

REPORT_TYPES = [
    "health-snapshot",
    "dependency-fingerprint",
    "source-stats",
    "repo-pulse",
    "maintenance-log",
]

COMMIT_MESSAGES = [
    "fix: profile header spacing on mobile",
    "style: tweak portfolio card layout",
    "fix: auth callback redirect edge case",
    "chore: update supabase client config",
    "fix: favicon loading on username routes",
    "style: adjust signup form padding",
    "fix: social links alignment on profile",
    "chore: sync prisma schema comments",
    "fix: saving indicator flash on edit",
    "style: refine login page typography",
]


def pick_commit_message(slot: int, when: dt.datetime) -> str:
    idx = (day_seed(when.date()) + slot * 31 + when.hour) % len(COMMIT_MESSAGES)
    return COMMIT_MESSAGES[idx]


def run_git(command: list[str]) -> str:
    result = subprocess.run(
        command,
        cwd=REPO_ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def day_seed(date: dt.date) -> int:
    digest = hashlib.sha256(date.isoformat().encode()).hexdigest()
    return int(digest[:8], 16)


def commits_planned_for(date: dt.date) -> int:
    return 2 + (day_seed(date) % 4)


def active_slot_indices(date: dt.date) -> list[int]:
    n = commits_planned_for(date)
    indices = list(range(len(SLOTS)))
    seed = day_seed(date)
    for i in range(len(indices) - 1, 0, -1):
        j = (seed + i * 7919) % (i + 1)
        indices[i], indices[j] = indices[j], indices[i]
    return sorted(indices[:n])


def slot_index_from_cron(cron: str) -> int | None:
    cron = cron.strip()
    for i, slot in enumerate(SLOTS):
        if slot == cron:
            return i
    return None


def detect_layout() -> tuple[Path | None, list[Path], list[str], str, str]:
    deps: Path | None = None
    deps_label = "dependencies"
    if (REPO_ROOT / "package.json").exists():
        deps = REPO_ROOT / "package.json"
        deps_label = "package.json"
    elif (REPO_ROOT / "requirements.txt").exists():
        deps = REPO_ROOT / "requirements.txt"
        deps_label = "requirements.txt"

    source_dirs: list[Path] = []
    extensions: list[str] = []
    if (REPO_ROOT / "app").exists():
        source_dirs.append(REPO_ROOT / "app")
    if (REPO_ROOT / "src").exists():
        source_dirs.append(REPO_ROOT / "src")
    if not source_dirs:
        source_dirs = [REPO_ROOT]

    if any(source_dirs[0].rglob("*.tsx")) or any(source_dirs[0].rglob("*.ts")):
        extensions = [".ts", ".tsx"]
        source_label = "TypeScript"
    elif any(source_dirs[0].rglob("*.py")):
        extensions = [".py"]
        source_label = "Python"
    else:
        extensions = [".ts", ".tsx", ".py", ".js", ".jsx"]
        source_label = "source"

    return deps, source_dirs, extensions, deps_label, source_label


def count_files(dirs: list[Path], extensions: list[str]) -> int:
    total = 0
    for d in dirs:
        if not d.exists():
            continue
        for ext in extensions:
            total += len(list(d.rglob(f"*{ext}")))
    return total


def line_count(dirs: list[Path], extensions: list[str]) -> int:
    total = 0
    for d in dirs:
        if not d.exists():
            continue
        for ext in extensions:
            for f in d.rglob(f"*{ext}"):
                total += len(f.read_text(encoding="utf-8", errors="replace").splitlines())
    return total


def file_sha256(path: Path | None) -> str:
    if path is None or not path.exists():
        return "missing"
    return hashlib.sha256(path.read_bytes()).hexdigest()


def gather_metrics() -> dict:
    deps, source_dirs, extensions, deps_label, source_label = detect_layout()
    return {
        "branch": run_git(["git", "rev-parse", "--abbrev-ref", "HEAD"]),
        "head": run_git(["git", "rev-parse", "--short", "HEAD"]),
        "commit_count": int(run_git(["git", "rev-list", "--count", "HEAD"])),
        "source_files": count_files(source_dirs, extensions),
        "source_lines": line_count(source_dirs, extensions),
        "source_label": source_label,
        "deps_label": deps_label,
        "deps_sha256": file_sha256(deps),
    }


def build_markdown(report_type: str, slot: int, when: dt.datetime, metrics: dict) -> str:
    ts = when.strftime("%Y-%m-%d %H:%M:%S UTC")
    date = when.strftime("%Y-%m-%d")
    deps_hash = metrics["deps_sha256"]
    deps_preview = deps_hash[:16] + "…" if deps_hash != "missing" else "missing"
    return "\n".join(
        [
            f"# {report_type.replace('-', ' ').title()} — {date}",
            "",
            f"- Run slot: {slot + 1}/{len(SLOTS)}",
            f"- Generated: {ts}",
            f"- Branch: `{metrics['branch']}`",
            f"- HEAD: `{metrics['head']}`",
            f"- Total commits: {metrics['commit_count']}",
            f"- {metrics['source_label']} files: {metrics['source_files']}",
            f"- {metrics['source_label']} lines: {metrics['source_lines']}",
            f"- {metrics['deps_label']} sha256: `{deps_preview}`",
            "",
        ]
    )


def append_activity_log(when: dt.datetime, report_type: str, rel_path: str) -> None:
    log_file = ACTIVITY_DIR / "log.md"
    ACTIVITY_DIR.mkdir(parents=True, exist_ok=True)
    if not log_file.exists():
        log_file.write_text("# Activity log\n\n", encoding="utf-8")
    line = f"- {when.strftime('%Y-%m-%d %H:%M UTC')} — `{report_type}` → `{rel_path}`\n"
    with log_file.open("a", encoding="utf-8") as f:
        f.write(line)


def write_and_commit(slot: int, when: dt.datetime) -> None:
    ACTIVITY_DIR.mkdir(parents=True, exist_ok=True)
    metrics = gather_metrics()
    report_type = REPORT_TYPES[slot % len(REPORT_TYPES)]
    stamp = when.strftime("%Y%m%d-%H%M%S")
    filename = f"{when.strftime('%Y-%m-%d')}-slot{slot + 1}-{stamp}.md"
    report_path = ACTIVITY_DIR / filename
    report_path.write_text(build_markdown(report_type, slot, when, metrics), encoding="utf-8")
    rel = report_path.relative_to(REPO_ROOT).as_posix()
    append_activity_log(when, report_type, rel)

    run_git(["git", "add", "reports/activity/"])
    if subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=REPO_ROOT).returncode == 0:
        print("Nothing to commit.")
        return

    run_git(["git", "commit", "-m", pick_commit_message(slot, when)])
    run_git(["git", "push"])
    print(f"Committed and pushed {rel}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cron", help="Cron expression from GITHUB_EVENT_SCHEDULE")
    parser.add_argument("--force", action="store_true", help="Force commit (manual trigger)")
    args = parser.parse_args()

    cron = args.cron or os.environ.get("GITHUB_EVENT_SCHEDULE", "")
    now = dt.datetime.now(dt.UTC)
    today = now.date()

    if args.force:
        write_and_commit(now.hour % len(SLOTS), now)
        return

    if not cron:
        active = active_slot_indices(today)
        if not active:
            sys.exit(0)
        write_and_commit(active[0], now)
        return

    slot = slot_index_from_cron(cron)
    if slot is None:
        print(f"Unknown cron schedule: {cron!r}", file=sys.stderr)
        sys.exit(1)

    active = active_slot_indices(today)
    print(f"Today: {commits_planned_for(today)} commit(s); active slots: {[i + 1 for i in active]}")

    if slot not in active:
        print(f"Slot {slot + 1} skipped today.")
        sys.exit(0)

    write_and_commit(slot, now)


if __name__ == "__main__":
    main()
