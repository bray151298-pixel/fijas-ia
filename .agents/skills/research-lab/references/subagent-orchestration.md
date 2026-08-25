# Subagent Orchestration

Use this mode only when the user asks to use subagents to run phases of the
Research Lab framework. The main agent remains accountable for sequencing,
review, state updates, and final judgment.

## Phase Delegation Workflow

1. Load `artifacts.md`, `phases.md`, and `domain-adaptation.md` as needed.
2. Identify the current phase from `research/<slug>/state.md` or start at
   Prepare when no research folder exists.
3. Delegate one framework phase at a time: Prepare, Specify, Baseline, Explore,
   Compare, Decide, Apply, or Review.
4. Give the subagent the exact phase instructions, read targets, allowed write
   targets, validation requirements, and expected artifacts.
5. Review the subagent output before marking the phase complete. If review fails,
   fix directly or delegate a narrow correction, then review again.
6. Update `state.md` and choose the next phase only after the review gate passes.
7. Continue phase by phase until the workflow reaches a valid handoff, decision,
   applied artifact, review result, or documented blocker.

## Delegation Rules

- Delegate only one phase at a time unless the user explicitly allows parallel
  phase work.
- Do not delegate the overall workflow, final decision ownership, or final user
  handoff.
- For research-only exploration, independent alternatives may be delegated in
  parallel only when their artifacts cannot conflict and the user did not ask for
  a serial review loop.
- Give each subagent exact read targets, write targets, constraints, validation
  commands, and output format.
- Tell subagents not to commit, push, rewrite unrelated files, or mark checklists
  complete.
- Preserve unrelated user or agent changes. If a delegated task conflicts with
  unexpected local changes, stop and ask or narrow the task.

## Subagent Prompt Template

Use a prompt shaped like this and fill in concrete paths:

```text
Research-lab delegated task.

Goal: run the <phase> phase for <research item>
Domain/theme: <domain>
Research path: <research/<slug>/>
Current phase: <Prepare|Specify|Baseline|Explore|Compare|Decide|Apply|Review>

Read first:
- <required instructions/specs>
- <research state/decision/results paths>
- <target source or artifact paths>

Allowed writes:
- <exact phase run directory and any phase artifacts the subagent may edit>

Constraints:
- Do not modify unrelated files.
- Do not mark trackers or checklists complete.
- Do not commit or push.
- Preserve existing behavior unless this task explicitly changes it.

Validation to run:
- <commands, checks, reviews, or citations required>

Return only:
- Summary of changes or evidence gathered.
- Files changed or artifacts created.
- Validation results.
- Risks, blockers, and recommended next step.
```

## Review Gate

After each subagent returns:

1. Read the reported files and relevant diffs or artifacts.
2. Compare the work against `state.md`, prior run artifacts, `decision.md` when
   present, and the phase success criteria.
3. Run or inspect required validation. Do not rely only on the subagent summary.
4. If valid, update `state.md` and any phase `results.md` with the review
   outcome and next phase.
5. If invalid, record the issue, fix it directly or delegate a narrow correction,
   then repeat the review gate.

## Phase Handoff

Each delegated phase should leave enough information for the main agent to
continue without reading the subagent conversation:

- Phase completed or blocked.
- Artifacts created or changed.
- Evidence gathered and validation results.
- Open questions or missing evidence.
- Recommended next phase or loop-back phase.
