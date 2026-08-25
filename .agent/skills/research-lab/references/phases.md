# Research Lab Phases

Use these instructions after loading `artifacts.md`. Each phase writes or updates
artifacts before reporting a handoff.

## 1. Prepare

Inputs: target research item, theme/domain, expected output, user constraints,
and any existing tracker item.

1. Read relevant local instructions, specs, prior research, source material,
   datasets, tests, examples, or project files.
2. Create a stable slug and create or update `research/<slug>/README.md`,
   `state.md`, `hypotheses.md`, and `runs/`.
3. In `README.md`, document the exact item, domain, intended artifact, scope,
   non-goals, constraints, and major risks.
4. In `hypotheses.md`, list candidate approaches or explanations to test.
5. In `state.md`, record status `prepared`, current best strategy if any,
   completed runs, evidence summary, open questions, and next phase `Specify`.
6. If an external checklist exists, mark the item in progress only when work has
   genuinely started.

Output: research path, candidate approaches, open questions, next phase.

## 2. Specify

Inputs: target slug and any changed constraints.

1. Read `README.md`, `state.md`, `hypotheses.md`, project instructions, and
   relevant source material.
2. Create `runs/<timestamp>-spec/plan.md`.
3. Define precise inputs, outputs, edge cases, failure modes, determinism or
   reproducibility requirements, resource constraints, metrics, evidence sets,
   and minimal validation required later.
4. Choose evidence tiers: small deterministic examples first, then real-world,
   diverse, adversarial, or stress cases only when relevant.
5. Update `state.md` with status `specified`, spec summary, changed assumptions,
   open questions, and next phase `Baseline`.

Output: run directory, success criteria, unresolved questions, next phase.

## 3. Baseline

Inputs: target slug and baseline constraints.

1. Read prior research notes and identify the simplest credible baseline:
   standard method, incumbent process, null hypothesis, obvious draft, or current
   implementation.
2. Create `runs/<timestamp>-baseline/` with `plan.md`, `results.md`, optional
   `metadata.json`, and optional `raw/`.
3. Build lab-only prototypes, analysis notes, prompts, benchmark harnesses, or
   evidence extracts as needed. Do not change final target artifacts.
4. Measure or assess the baseline on the smallest reliable evidence set first;
   scale only if the spec requires it.
5. Save commands, methods, raw outputs, metrics, correctness or validity notes,
   and limitations.
6. Update `state.md` with status `baseline-measured`, measured results, current
   best strategy, open questions, and next phase `Explore` or `Compare`.

Output: baseline strategy, measurements, validity observations, next phase.

## 4. Explore Loop

Inputs: target slug and optional strategy hint.

1. Read the full research history, especially `state.md`, `hypotheses.md`, and
   previous `results.md` files.
2. Choose the next most valuable untested or refined strategy based on validity,
   expected performance or cost, output quality, simplicity, maintainability,
   risk reduction, and user constraints.
3. Create `runs/<timestamp>-explore-<strategy-slug>/`.
4. Write `plan.md` explaining why this strategy is tested now, what prior result
   it challenges, and what would make it win or lose.
5. Run comparable research, prototypes, evaluations, or benchmarks using the
   same fixtures and criteria where possible.
6. Save `results.md`, optional `metadata.json`, and raw outputs.
7. Update `state.md` with the strategy tested, result summary, candidate status,
   and next phase `Explore`, `Compare`, or `Decide`.

Output: difference from prior runs, comparison, candidate status, next phase.

## 5. Compare

Inputs: target slug and constraints for scale, runtime, sources, or metrics.

1. Read all prior runs and identify strategies that remain viable.
2. Create `runs/<timestamp>-comparison-matrix/`.
3. Build a shared matrix covering realistic workloads, evidence sets, source
   types, use cases, edge cases, no-signal cases, high-signal cases, diverse
   cases, and stress cases where relevant.
4. Use consistent methodology: repeated measurements when useful, same criteria,
   environment capture, source provenance, and explicit assumptions.
5. Save raw outputs and summarize winners, contradictions, and limitations in
   `results.md`.
6. Update `state.md` with status `matrix-complete`, comparative ranking,
   confidence level, open questions, and next phase `Decide` or `Explore`.

Output: comparison table summary, winner per workload or criterion,
contradictions, next phase.

## 6. Decide

Inputs: target slug and decision constraints.

1. Read `state.md`, all `results.md` files, and the source task or tracker.
2. Verify gates: spec exists, baseline exists, alternatives were explored or a
   baseline-only exception is justified, comparison matrix exists or no-matrix
   exception is justified, and required metrics or validations were measured or
   explicitly deferred.
3. If evidence is insufficient, update `state.md` with missing evidence and send
   the task back to `Explore` or `Compare`; do not write a final decision.
4. If evidence is sufficient, write `decision.md` using the schema in
   `artifacts.md` and update `state.md` to `decision-ready`.

Output: selected approach or missing evidence, exact next phase.

## 7. Apply

Inputs: target slug and implementation or final-artifact constraints.

1. Read project instructions, source task, and `decision.md`.
2. Modify only the files, deliverables, recommendations, or decisions named in
   the decision unless a necessary adjacent change is justified.
3. Convert prototypes or draft notes into clean final work; do not blindly copy
   experimental artifacts.
4. Add or update required validation before or with the final artifact. If a
   required validation cannot be done, document the blocker instead of claiming
   completion.
5. Run targeted validation, tests, reviews, citations checks, or benchmarks.
6. Update `state.md` with status `applied`, changed artifacts, validation
   results, and next phase `Review` or `Closed`.
7. Mark an external checklist complete only when application, evidence,
   validation, and documentation are complete.

Output: artifacts changed, validation run, evidence summary, tracker status.

## 8. Review

Inputs: target slug and adjacent changes or suspected regression area.

1. Read `decision.md`, `state.md`, final artifacts, validation files, sources,
   and benchmarks or review criteria.
2. Rerun targeted validation and compare current results against the saved
   decision summary.
3. Create `runs/<timestamp>-review/` with `results.md`, optional
   `metadata.json`, and raw outputs.
4. If regression or invalid evidence is found, update `state.md`, reopen the
   tracker if present, and recommend `Explore`, `Compare`, or a new `Decide`.
5. If the selected approach remains valid, update `state.md` with the review
   date, outcome, and status `closed` when no further work remains.

Output: pass/fail, regressions or evidence drift, tracker status, next phase.
