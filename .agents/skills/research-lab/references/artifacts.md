# Research Lab Artifacts

Use these schemas for every research item. Keep details concise enough that a
future run can resume without rereading the entire conversation.

## Workspace

```text
research/<slug>/
  README.md
  state.md
  hypotheses.md
  decision.md              # created only after the decision phase passes
  runs/
    <YYYYMMDD-HHMMSS>-<phase>/
      plan.md
      results.md
      metadata.json        # optional but preferred for measured/source-heavy runs
      raw/                 # raw outputs, source extracts, logs, or notes
```

Use an existing repo-specific research path if one already exists, but keep the
same artifact roles.

## `README.md`

- Exact research item or question.
- Theme/domain and intended final output.
- Owning module, artifact, stakeholder, audience, or decision context.
- Scope and non-goals.
- Correctness, validity, performance, cost, safety, or quality risks.
- User constraints and assumptions.

## `state.md`

Keep these sections current after every phase:

- `Status`: `prepared`, `specified`, `baseline-measured`, `exploring`,
  `matrix-complete`, `decision-ready`, `applied`, `reviewing`, `closed`, or a
  repo-specific equivalent.
- `Research item`: exact task, question, checklist item, or issue text.
- `Theme/domain`: domain, audience, and final artifact type.
- `Current best strategy`: current leading approach or `none yet`.
- `Completed runs`: run directory names with one-line outcomes.
- `Evidence summary`: compact findings for correctness, validity, performance,
  cost, quality, output size, token use, or other relevant criteria.
- `Open questions`: unresolved missing evidence or implementation risks.
- `Next phase`: exact next phase name or loop-back target.

## `hypotheses.md`

List candidate approaches, sources, models, strategies, or explanations to test.
For each hypothesis, include expected upside, expected risk, and how it could be
falsified.

## `plan.md`

Each run plan should state:

- Phase and run directory.
- Strategy, question, or comparison being evaluated.
- Inputs, sources, corpus, cases, or workload.
- Methods, commands, prompts, search strategy, or evaluation process.
- Metrics and qualitative criteria.
- Win/loss criteria and expected failure modes.
- Reproducibility notes and constraints.

## `results.md`

Each measured or evidence-gathering run should include:

- `Phase`: phase name and run directory.
- `Strategy`: approach tested, compared, or reviewed.
- `Evidence set`: sources, corpus, cases, workload, or dataset with provenance.
- `Environment`: OS, tool versions, model names, date, and relevant limits.
- `Methods`: commands, searches, prompts, interviews, reviews, or analysis steps.
- `Metrics`: timing, memory, cost, output size, quality scores, accuracy, source
  counts, confidence, or other criteria from the spec.
- `Validity`: passing/failing cases, edge cases, bias risks, and observed failure
  modes.
- `Comparison`: relationship to prior runs or the decision benchmark summary.
- `Conclusion`: whether the strategy remains viable and the next phase.

## `metadata.json`

Use a sidecar when reproducibility matters. Capture structured values for phase,
timestamp, strategy, evidence identifiers, environment, methods, metrics,
validity status, artifacts produced, and source links or local paths. In
`results.md`, include only a compact metadata summary and link to the sidecar.

## `decision.md`

The decision phase writes these sections:

- `Selected approach`: chosen method, conclusion, or final direction.
- `Why it won`: evidence-based rationale.
- `Rejected approaches`: alternatives and rejection reasons.
- `Requirements`: behavior, claims, edge cases, validity rules, or quality bars
  the final artifact must satisfy.
- `Evidence summary`: measured workloads, source details, criteria, and key
  results.
- `Application scope`: files, report sections, deliverables, recommendations, or
  decisions expected to change.
- `Required validation`: tests, reviews, benchmarks, citations, stakeholder
  checks, or acceptance criteria.
- `Risks`: issues to monitor after application.
- `Exceptions`: accepted baseline-only, no-matrix, source-limited, or deferred
  evidence justifications.
