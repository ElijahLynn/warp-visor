---
name: warp-visor-dev
description: >-
  Runs the Warp Visor GNOME Shell nested dev loop via the warp-visor-dev script.
  Use when the user says /warp-visor-dev, warp-visor-dev, nested shell testing,
  devkit testing, extension dev loop, or testing Warp Visor after code changes.
---

# Warp Visor dev loop

This file lives in the **warp-visor git repository** at `.cursor/skills/warp-visor-dev/SKILL.md`. Clone or pull the repo so Cursor loads the project skill; do not maintain a separate copy under `~/.cursor/skills`.

Use the project script. Do not hand-roll `gnome-shell --devkit` on the host session.

## Commands

| Command | Where |
|---------|--------|
| `warp-visor-dev host-prep` | Host desktop |
| `warp-visor-dev enter` | Host — opens nested `dbus-run-session` |
| `warp-visor-dev start` | Inside `enter` |
| `warp-visor-dev reload` | Inside `enter` — after code edits |
| `warp-visor-dev enable` | Inside `enter` — if start finished before Shell was ready |
| `warp-visor-dev stop` | Inside `enter` |
| `warp-visor-dev host-restore` | Host — after nested testing |

Install to PATH once: `make install-dev-cmd` (symlinks `warp-visor-dev` in `~/.local/bin`).

## Agent workflow

1. Run `make test` when extension or geometry code changed.
2. On host: `warp-visor-dev host-prep` then `warp-visor-dev enter` (interactive — stay in that session for `start`).
3. Inside nested session: `warp-visor-dev start`. A **Mutter Development Kit** window opens in ~**30–60 seconds** (nested GNOME desktop with top bar inside that window). User clicks inside it, then tests Shift+Alt+T/B/R. Target app is **GNOME Console**, not Warp.
4. After edits: `warp-visor-dev reload` from the same nested session.
5. User `exit` nested session, then host: `warp-visor-dev host-restore`.
6. Confirm host behavior: Shift+Alt+T/B with Warp, Shift+Alt+R if geometry was wrong.
7. When nested **and/or** host behavior is **confirmed working**, run **Finish and land** below before closing the task.

## Never

- Run `gnome-shell --devkit` or `gnome-extensions enable` on the host outside `enter`.
- Run `gnome-extensions enable` on the host immediately after `make install` without logout (can crash Shell).
- Use Warp as `warp-app-id` inside nested testing.
- Leave `scripts/warp-visor-dev`, this skill, and README out of sync after a verified workflow change.

## If shortcuts do nothing on host

```sh
gsettings set org.gnome.shell disable-user-extensions false
warp-visor-dev host-restore
```

## Finish and land (required after confirmed working)

Run this only after the user or agent confirms nested and/or host testing works. Do not skip because tests passed in theory—behavior must be verified (shortcuts, geometry, reset, restore).

### 1. Update the repo (docs first)

1. **`scripts/warp-visor-dev`** — Source of truth for commands and messages; update `usage()` when subcommands change.
2. **`README.md`** — **Quick dev loop (`warp-visor-dev`)**, **GNOME Wayland development loop**, and **Troubleshooting** must match the script and verified behavior (enable, stop/reload timing, Shift+Alt+R, host-restore, crash recovery).
3. **This skill** (`.cursor/skills/warp-visor-dev/SKILL.md`) — Keep command table, workflow, never-do list, and this section aligned with the script and README. Do not duplicate the full README here.
4. **`MEMORY.md`** — Short agent pointer only; same command names and safety notes.

Do not update docs for unverified experiments.

### 2. Commit to the repository

After docs are in sync, **create a git commit** with all related changes (extension, script, skill, README, tests, schemas, `MEMORY.md`). Do not commit unrelated files.

- Use a clear message focused on **why** (e.g. dev loop helper, geometry reset, full-width visor).
- Follow the repo’s commit style; use a HEREDOC for the message.
- Do not push unless the user asks.
- If the user said work is confirmed but did not ask to commit, **ask once** whether to commit; if they already asked to land or finish the dev task, commit without re-asking.

Checklist before marking the task done:

- [ ] `warp-visor-dev help` matches documented subcommands
- [ ] README and this skill describe the same workflow
- [ ] Host shortcuts and Shift+Alt+R verified (or user confirmed)
- [ ] No references to `warp-visor-test` remain in the repo
- [ ] Changes committed to git (or user declined)

## Details

See [README.md](../../README.md) — **GNOME Wayland development loop** and **Troubleshooting**.
