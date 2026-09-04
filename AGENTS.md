# AGENTS.md

## Project

Cachito is a desktop ERP application built with Tauri v2, React, TypeScript, Rust and SQLite.

Read the following files when relevant:

- `ARCHITECTURE.md` — architecture and architectural constraints
- `SECURITY.md` — security requirements
- `TESTING.md` — testing strategy and requirements
- `CONTRIBUTING.md` — development workflow

## General Rules

- Understand the existing implementation before modifying it.
- Prefer small, focused changes over large rewrites.
- Do not change architecture without justification.
- Do not introduce dependencies without a clear reason.
- Do not duplicate existing functionality.
- Preserve existing behavior unless the task explicitly requires changing it.
- Never remove or weaken tests just to make them pass.

## Code Changes

Before modifying code:

1. Inspect the relevant files and dependencies.
2. Identify the existing pattern used by the project.
3. Determine which layers are affected.
4. Make the smallest appropriate change.

After modifying code:

1. Format the code.
2. Run relevant tests.
3. Check for compilation/type errors.
4. Review the final diff.
5. Report what was changed and what was tested.

## Architecture

Follow `ARCHITECTURE.md`.

Do not:

- Access SQLite directly from the frontend.
- Put business logic in Tauri commands.
- Put SQL queries outside repositories.
- Bypass established application layers.

## Security

Follow `SECURITY.md`.

Never:

- Expose secrets or private keys to the frontend.
- Commit credentials or secrets.
- Trust frontend input without validation.
- Add unnecessary Tauri capabilities or permissions.

## Testing

Follow `TESTING.md`.

New behavior should include appropriate automated tests.

Bug fixes should include a regression test when practical.

## Agent Behavior

- Do not modify unrelated files.
- Do not perform broad refactors unless explicitly requested.
- Do not assume undocumented behavior.
- If requirements are ambiguous, inspect the codebase before making assumptions.
- If a change has architectural or security implications, explicitly report them.