# Domain Adaptation

Map the generic research workflow to the target domain before writing the spec.
Use the user's terms in artifacts, but keep the same phase gates.

## Universal Mapping

- Research item: task, question, checklist item, issue, decision, claim, or
  artifact request.
- Strategy: method, design, algorithm, source-selection plan, thesis,
  recommendation, process, or implementation option.
- Evidence set: corpus, dataset, local files, literature, examples, cases,
  user interviews, prior decisions, experiments, or benchmarks.
- Metric: objective measurement, qualitative rubric, acceptance criterion,
  source quality signal, risk score, cost, latency, accuracy, completeness, or
  stakeholder value.
- Baseline: current state, incumbent approach, null hypothesis, simplest draft,
  standard-library solution, common practice, or minimal viable recommendation.
- Benchmark matrix: repeatable comparison across strategies and criteria, not
  necessarily a numeric benchmark.
- Apply: implement code, write the final report, recommend a policy, create a
  design, update documentation, or make the selected decision concrete.

## Domain Patterns

- Software engineering: evidence from local code, tests, benchmarks, issue
  reports, API contracts, performance profiles, and maintainability review.
- Data science or ML: evidence from dataset provenance, train/test splits,
  leakage checks, metrics, ablations, baseline models, and error analysis.
- Academic or literature research: evidence from search strategy,
  inclusion/exclusion criteria, source quality, citations, competing theories,
  and counterevidence.
- Product or strategy: evidence from user segments, jobs-to-be-done, business
  constraints, market examples, cost/risk matrix, and success metrics.
- Policy or governance: evidence from legal constraints, stakeholder impact,
  precedents, risk controls, auditability, and implementation burden.
- Writing or documentation: evidence from audience needs, outline alternatives,
  source support, examples, review rubric, clarity, accuracy, and completeness.
- Operations or process design: evidence from throughput, failure modes, handoff
  costs, compliance needs, observability, and rollback or escalation paths.

## Evidence Quality Rules

- Prefer primary sources, local observed behavior, and reproducible measurements
  over assumptions.
- Separate measured facts from interpretation and recommendation.
- Record negative evidence and discarded options; it prevents repeated loops.
- Note source limits, access limits, sampling bias, missing stakeholders, and
  stale data.
- Use the smallest evidence set that can falsify an approach first, then scale
  to real-world or stress cases only when the decision depends on it.
- Treat qualitative judgments as criteria with explicit rubrics, not vibes.

## Output Calibration

- For exploratory user requests, stop after `Decide` unless the user asks for
  implementation or a final artifact.
- For delivery requests, continue through `Apply` and `Review` when feasible.
- For time-boxed tasks, document which evidence gates were compressed or
  deferred and lower confidence accordingly.
- For domains with external sources, cite or link sources in `results.md` and
  preserve source extracts under `raw/` when allowed.
