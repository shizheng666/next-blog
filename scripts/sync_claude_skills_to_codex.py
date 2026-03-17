#!/usr/bin/env python3
"""Sync project Claude skills into a Codex-friendly mirror.

The source of truth stays in `.claude/skills`. This script copies that tree
into `.agents/skills` and applies a small set of text substitutions so the
generated mirror reads as Codex-oriented documentation.
"""

from __future__ import annotations

import shutil
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
SOURCE_ROOT = REPO_ROOT / ".claude" / "skills"
TARGET_ROOT = REPO_ROOT / ".agents" / "skills"

DOC_SUFFIXES = {
    ".md",
    ".txt",
    ".html",
}

DOC_FILENAMES = {
    "SKILL.md",
    "AGENTS.md",
    "README.md",
    "LICENSE.txt",
}

REPLACEMENTS = [
    ("Claude Code", "Codex"),
    ("Claude.ai", "Codex.ai"),
    ("Claude's", "Codex's"),
    ("Claude", "Codex"),
    ("`claude`", "`codex`"),
    ("claude-with-access-to-the-skill", "codex-with-access-to-the-skill"),
    ("claude -p", "codex exec"),
    (".claude/", ".agents/"),
]


def is_doc_file(path: Path) -> bool:
    return path.suffix.lower() in DOC_SUFFIXES or path.name in DOC_FILENAMES


def transform_text(content: str) -> str:
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)
    return content


def remove_stale_files(source_files: set[Path]) -> None:
    if not TARGET_ROOT.exists():
        return

    for target_path in sorted(TARGET_ROOT.rglob("*"), reverse=True):
        relative_path = target_path.relative_to(TARGET_ROOT)
        source_path = SOURCE_ROOT / relative_path
        if target_path.is_file() and relative_path not in source_files:
            target_path.unlink()
        elif target_path.is_dir() and not source_path.exists():
            target_path.rmdir()


def sync_file(source_path: Path, target_path: Path) -> None:
    target_path.parent.mkdir(parents=True, exist_ok=True)

    if is_doc_file(source_path):
        text = source_path.read_text(encoding="utf-8")
        rendered = transform_text(text)
        target_path.write_text(rendered, encoding="utf-8")
        shutil.copystat(source_path, target_path)
        return

    shutil.copy2(source_path, target_path)


def main() -> None:
    if not SOURCE_ROOT.exists():
        raise SystemExit(f"Source skills directory does not exist: {SOURCE_ROOT}")

    TARGET_ROOT.mkdir(parents=True, exist_ok=True)

    source_files = {
        path.relative_to(SOURCE_ROOT)
        for path in SOURCE_ROOT.rglob("*")
        if path.is_file()
    }

    remove_stale_files(source_files)

    for relative_path in sorted(source_files):
        sync_file(SOURCE_ROOT / relative_path, TARGET_ROOT / relative_path)

    print(f"Synced {len(source_files)} files from {SOURCE_ROOT} to {TARGET_ROOT}")


if __name__ == "__main__":
    main()
