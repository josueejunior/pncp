# M2.7 Techniques for AI Agent Self-Improvement
### How to Apply Recursive Self-Improvement, Harness Engineering, and Agentic RSI Loops to Build Agents That Get Better Autonomously

---

> **What this document is:** A specific, implementation-focused guide to the techniques pioneered in the MiniMax M2.7 architecture — applied directly to AI agent building. Every section maps a concrete M2.7 mechanism to a replicable agent pattern. This is not a general agent guide. It is a manual for the specific techniques that allow an agent to improve its own operating environment without retraining.

---

## Table of Contents

1. [The M2.7 Core Mechanism: What Actually Happens](#1-the-m27-core-mechanism-what-actually-happens)
2. [Technique 1 — Harness Engineering (The Mutable Scaffold)](#2-technique-1--harness-engineering-the-mutable-scaffold)
3. [Technique 2 — Skill Adherence Rate Optimization](#3-technique-2--skill-adherence-rate-optimization)
4. [Technique 3 — Failure Trace Analysis and Self-Critique](#4-technique-3--failure-trace-analysis-and-self-critique)
5. [Technique 4 — Dynamic Hyperparameter Tuning](#5-technique-4--dynamic-hyperparameter-tuning)
6. [Technique 5 — The Autonomous Merge Request Loop](#6-technique-5--the-autonomous-merge-request-loop)
7. [Technique 6 — Behavioral Differentiation via Per-Agent Harness](#7-technique-6--behavioral-differentiation-via-per-agent-harness)
8. [Technique 7 — Adversarial Reasoning Between Agents](#8-technique-7--adversarial-reasoning-between-agents)
9. [Technique 8 — Self-Healing with Non-Blocking Action Constraints](#9-technique-8--self-healing-with-non-blocking-action-constraints)
10. [Technique 9 — Persistent Markdown Memory for Cross-Session RSI](#10-technique-9--persistent-markdown-memory-for-cross-session-rsi)
11. [Technique 10 — MLE Agent Pattern (Agent That Trains Other Agents)](#11-technique-10--mle-agent-pattern-agent-that-trains-other-agents)
12. [Putting the Techniques Together: The Full RSI Stack](#12-putting-the-techniques-together-the-full-rsi-stack)

---

## 1. The M2.7 Core Mechanism: What Actually Happens

Before applying individual techniques, you need to understand precisely what M2.7 does and does not do. This prevents misapplication.

**What M2.7 does NOT do:**

It does not update its weights in real time. It does not fine-tune itself. It does not use gradient descent during inference. The LLM core — the transformer with its billions of parameters — is completely frozen during all RSI operations.

**What M2.7 DOES do:**

It improves the **Harness** — the mutable layer of software, tool definitions, system prompts, skill libraries, and workflow rules that surrounds the frozen model. Every RSI iteration makes the harness smarter. The model stays the same. The harness evolves.

This is the foundational insight. Write it down somewhere prominent before you build anything:

```
RSI in M2.7 = improving the harness, not the model.
The model is a fixed engine. The harness is the changing fuel and transmission.
```

**The RSI cycle in M2.7 — exact sequence:**

```
1. Agent executes task using current harness version
2. Agent analyzes its own execution logs (self-critique)
3. Agent classifies the failure type (if task failed) or inefficiency type (if task succeeded but poorly)
4. Agent proposes a specific edit to the harness component responsible
5. Edit is tested in a sandbox against a benchmark (Terminal Bench, MLE Bench, SWE Pro)
6. If benchmark improves → Merge Request committed → harness version increments
7. If benchmark regresses → Rollback → new hypothesis from enriched failure data
8. Loop repeats, hundreds of iterations, autonomously
```

The key numbers from M2.7 production data: this loop reduces incident recovery time to under 3 minutes and automates 30–50% of an ML researcher's workflow. Those numbers come directly from the harness improvement loop, not from any model capability change.

---

## 2. Technique 1 — Harness Engineering (The Mutable Scaffold)

### What M2.7 Does

M2.7's harness is the entire software layer around the LLM — memory buffers, tool call definitions, system prompts, skill libraries, and syntax checkers. The M2.7 model maintains over 40 complex skill definitions, each exceeding 2,000 tokens. The RSI loop continuously refines these definitions. The harness is stored as editable files, not embedded in model weights or hardcoded in application logic.

### How to Apply This to Your Agent

Structure your agent so that everything that determines its behavior — except the model weights — lives in versioned, editable files on disk. The agent must be able to read these files at runtime and propose edits to them.

**Harness file structure (direct M2.7 translation):**

```
/harness/
├── system_prompt.md              # Core framing and role — editable by agent
├── hyperparams.json              # temperature, top_p, frequency_penalty — tunable per task
├── workflow_rules.md             # High-level decision heuristics — grows via RSI
├── skills/
│   ├── [skill_name].md          # One file per skill, 500–2000 tokens each
│   └── skill_index.json          # Maps task types to skill files
├── tools/
│   ├── [tool_name].json         # Tool schema + learned usage heuristics
│   └── tool_index.json           # Maps contexts to tool selection heuristics
└── memory/
    ├── session_log.md            # Cross-session research journal (Technique 9)
    └── failure_index.md          # Indexed failure patterns with resolutions
```

**Critical rule from M2.7:** The harness is NOT configuration that humans write and agents follow. The harness is source code that agents write and validate. The human's role is to review proposed harness commits — not to author the harness content.

**Agent bootstrap code — how to load the harness at runtime:**

```python
import os, json

def load_harness(harness_dir: str) -> dict:
    """Load entire harness into agent context at task start."""
    harness = {}

    # Core files
    harness["system_prompt"] = open(f"{harness_dir}/system_prompt.md").read()
    harness["workflow_rules"] = open(f"{harness_dir}/workflow_rules.md").read()
    harness["hyperparams"] = json.load(open(f"{harness_dir}/hyperparams.json"))

    # Skills — load all, agent selects relevant ones per task
    harness["skills"] = {}
    skill_index = json.load(open(f"{harness_dir}/skills/skill_index.json"))
    for skill_name, skill_file in skill_index.items():
        harness["skills"][skill_name] = open(f"{harness_dir}/skills/{skill_file}").read()

    # Tool definitions
    harness["tools"] = {}
    tool_index = json.load(open(f"{harness_dir}/tools/tool_index.json"))
    for tool_name, tool_file in tool_index.items():
        harness["tools"][tool_name] = json.load(open(f"{harness_dir}/tools/{tool_file}"))

    # Memory — always load session log for cross-session continuity
    harness["memory"] = open(f"{harness_dir}/memory/session_log.md").read()

    return harness
```

**What makes this M2.7-specific:** In M2.7, the harness isn't just loaded — it's read with the explicit expectation that the agent will propose changes to it. Every agent task begins: "Read the harness. Execute the task. If something in the harness could have made execution better, propose the edit." This is a first-class part of every task instruction, not an afterthought.

---

## 3. Technique 2 — Skill Adherence Rate Optimization

### What M2.7 Does

M2.7 explicitly tracks and optimizes **Skill Adherence Rate (SAR)** — the percentage of times the agent correctly executes the specified steps in a skill definition when that skill is triggered. A skill with a SAR below threshold triggers an RSI loop to improve that skill's definition until the agent follows it reliably.

This is the mechanism behind M2.7's ability to maintain consistent behavior across 40+ complex skills without forgetting earlier ones as new ones are added.

### How to Apply This to Your Agent

**Step 1 — Define SAR measurement for each skill:**

SAR = (number of task executions where all required skill steps were followed) ÷ (total executions where the skill was triggered)

For each skill, define a checklist of required steps. After every execution, score whether each step was completed. Log the result.

```python
# Example: SAR scoring for debug_failing_test skill
SKILL_CHECKLIST = {
    "debug_failing_test": [
        "reproduced_test_in_isolation",        # Step 1
        "read_full_error_trace",               # Step 2
        "inspected_failure_point",             # Step 3
        "performed_cross_file_scan",           # Step 4 — most commonly skipped
        "ran_full_test_suite_after_patch",     # Step 5
    ]
}

def score_sar(skill_name: str, execution_log: dict) -> float:
    checklist = SKILL_CHECKLIST[skill_name]
    steps_completed = sum(1 for step in checklist if execution_log.get(step, False))
    return steps_completed / len(checklist)
```

**Step 2 — SAR threshold and RSI trigger:**

```python
SAR_THRESHOLD = 0.85  # Below this: trigger RSI loop for that skill

def check_sar_triggers(sar_history: dict) -> list:
    """Return list of skills below SAR threshold over last 10 executions."""
    triggers = []
    for skill_name, scores in sar_history.items():
        recent = scores[-10:]  # Last 10 executions
        avg_sar = sum(recent) / len(recent)
        if avg_sar < SAR_THRESHOLD:
            triggers.append({
                "skill": skill_name,
                "avg_sar": avg_sar,
                "most_skipped_step": find_most_skipped_step(skill_name, recent),
                "action": "trigger_rsi_loop"
            })
    return triggers
```

**Step 3 — RSI response to low SAR:**

When SAR drops below threshold, the RSI loop does not assume the model is failing — it assumes the skill definition is unclear. The fix is to the skill definition, not to the model.

Improvement strategies for low SAR by step type:

| Step being skipped | Likely skill definition problem | RSI fix to apply |
|---|---|---|
| Cross-file scan | Step buried in the middle, easy to overlook | Move to Step 1, mark as MANDATORY |
| Full test suite run | Agent considers single-test pass sufficient | Add explicit failure consequence to definition |
| Read full error trace | Agent acts on first line | Add "never act on the first line alone" explicitly |
| Reproduce in isolation | Agent skips straight to fixing | Add "reproduce before diagnosing" as a hard prerequisite |

**The M2.7-specific insight here:** SAR-driven RSI treats skill definitions as hypotheses about what instructions produce correct agent behavior. Low SAR is falsification of the current hypothesis. The RSI loop generates a better hypothesis (revised skill definition) and tests it.

---

## 4. Technique 3 — Failure Trace Analysis and Self-Critique

### What M2.7 Does

M2.7 uses **Self-Critique** — the model analyzes its own execution logs from failed tasks and classifies the failure into one of three root cause categories:

1. **Parameter hallucination** — the agent invented a tool parameter, API field, or file path that doesn't exist
2. **Inefficient search logic** — the agent's file/code search strategy was poor, missing relevant context
3. **Missing correlated context** — the agent had correct logic but lacked information from related files or modules

This classification is not cosmetic. Each category maps to a different harness component and a different type of fix.

### How to Apply This to Your Agent

**The failure trace schema — use this exact structure:**

```json
{
  "task_id": "string — unique identifier for this task run",
  "task_type": "string — which skill was triggered",
  "harness_version": "string — which harness version was active",
  "timestamp": "ISO datetime",
  "outcome": "failed | passed_with_quality_below_threshold",
  "failure_classification": {
    "primary_type": "hallucination | search_logic | missing_context",
    "confidence": 0.0,
    "evidence": "string — specific observation from the execution log that supports this classification"
  },
  "responsible_harness_component": {
    "file": "string — path to the harness file responsible",
    "section": "string — which section within that file",
    "hypothesis": "string — what change to that section would have prevented this failure"
  },
  "execution_trace": {
    "steps_attempted": ["string"],
    "step_where_failure_occurred": "string",
    "tool_calls_made": ["string"],
    "tool_call_that_failed_or_was_missing": "string"
  }
}
```

**The self-critique prompt — what the agent tells itself after a failure:**

```
You just failed the following task: [task description]
Your execution log shows: [execution_trace]
The task outcome was: [outcome description]

Perform self-critique. Answer exactly these questions:
1. At which specific step did the failure originate?
2. Was the failure caused by: (a) inventing something that doesn't exist, (b) searching in the wrong places, or (c) having correct logic but missing related information?
3. Which file in your harness could have prevented this failure if it had been written differently?
4. Write a specific proposed edit to that harness file, as a diff, that would have prevented this failure.
5. How confident are you (0.0–1.0) that this edit would prevent this class of failure in future runs?

Output as JSON matching the failure trace schema.
```

**Failure classification decision tree:**

```
Task failed
│
├─ Did the agent call a tool with a parameter that doesn't exist in the schema?
│   └─ YES → hallucination failure
│       └─ Fix target: tool definition file — add explicit parameter constraints and examples
│
├─ Did the agent find the correct files/functions eventually, but only after wasted calls?
│   └─ YES → search_logic failure
│       └─ Fix target: skill definition — add explicit search sequence with priority ordering
│
└─ Did the agent's reasoning seem correct, but it was missing a key piece of information
   that existed in the codebase/context and wasn't retrieved?
    └─ YES → missing_context failure
        └─ Fix target: workflow_rules.md — add context-gathering step before this task type
```

**Clustering failures before generating fixes (the M2.7 batching approach):**

M2.7 doesn't generate one fix per failure. It batches failures of the same classification from the same harness component, then generates one generalized fix. This produces more robust harness edits.

```python
def cluster_failures(failure_log: list, min_cluster_size: int = 3) -> list:
    """
    Group failures by (failure_type, harness_component).
    Only return clusters that have reached min_cluster_size.
    These are ready for RSI Phase 2.
    """
    from collections import defaultdict
    clusters = defaultdict(list)

    for failure in failure_log:
        key = (
            failure["failure_classification"]["primary_type"],
            failure["responsible_harness_component"]["file"]
        )
        clusters[key].append(failure)

    return [
        {
            "failure_type": k[0],
            "harness_file": k[1],
            "failure_count": len(v),
            "failures": v,
            "rsi_ready": len(v) >= min_cluster_size
        }
        for k, v in clusters.items()
        if len(v) >= min_cluster_size
    ]
```

---

## 5. Technique 4 — Dynamic Hyperparameter Tuning

### What M2.7 Does

M2.7 RSI explicitly optimizes **combinations** of `temperature`, `frequency_penalty`, and `presence_penalty` for specific task types. This is not a one-time configuration — it's an ongoing optimization where the agent observes correlations between parameter settings and task outcome quality, then proposes parameter adjustments through the RSI loop.

The key word is *combinations*. Individual parameter tuning is weaker than joint optimization. M2.7 treats the hyperparameter vector as a single tunable unit, not three independent knobs.

### How to Apply This to Your Agent

**The hyperparameter schema with tuning history:**

```json
{
  "version": "1.4",
  "profiles": {
    "debug_failing_test": {
      "temperature": 0.2,
      "top_p": 0.92,
      "frequency_penalty": 0.0,
      "presence_penalty": 0.1,
      "max_tokens": 4096,
      "tuning_history": [
        {
          "version": "1.0",
          "values": {"temperature": 0.5, "frequency_penalty": 0.0, "presence_penalty": 0.0},
          "pass_rate_at_time": 0.61,
          "reason_for_change": "Initial default"
        },
        {
          "version": "1.2",
          "values": {"temperature": 0.3, "frequency_penalty": 0.0, "presence_penalty": 0.1},
          "pass_rate_at_time": 0.71,
          "reason_for_change": "RSI: lowered temperature after observing hallucination failures correlated with high-temperature runs"
        },
        {
          "version": "1.4",
          "values": {"temperature": 0.2, "frequency_penalty": 0.0, "presence_penalty": 0.1},
          "pass_rate_at_time": 0.82,
          "reason_for_change": "RSI: further temperature reduction improved determinism on step 3 (inspect failure point)"
        }
      ]
    },
    "architecture_proposal": {
      "temperature": 0.65,
      "top_p": 0.95,
      "frequency_penalty": 0.3,
      "presence_penalty": 0.2,
      "max_tokens": 8192,
      "tuning_history": []
    }
  }
}
```

**Hyperparameter RSI — how to run it:**

The agent runs the same task class with different parameter combinations in the sandbox. For each combination, it records the pass rate on the regression suite for that skill. It then proposes the combination with the highest pass rate as the new profile.

```python
import itertools

def run_hyperparameter_rsi(
    skill_name: str,
    regression_suite: list,
    current_params: dict,
    sandbox_runner
) -> dict:
    """
    Grid search over hyperparameter combinations.
    Returns the combination with highest pass rate.
    """
    # M2.7 style: vary combinations, not individual params
    temperature_candidates = [current_params["temperature"] - 0.1,
                               current_params["temperature"],
                               current_params["temperature"] + 0.1]
    frequency_penalty_candidates = [0.0, 0.1, 0.2]
    presence_penalty_candidates = [0.0, 0.1, 0.2]

    best_params = current_params
    best_pass_rate = 0.0
    results = []

    for temp, freq, pres in itertools.product(
        temperature_candidates,
        frequency_penalty_candidates,
        presence_penalty_candidates
    ):
        if not (0.0 <= temp <= 1.0):
            continue

        params = {**current_params, "temperature": temp,
                  "frequency_penalty": freq, "presence_penalty": pres}
        pass_rate = sandbox_runner.evaluate(skill_name, regression_suite, params)

        results.append({"params": params, "pass_rate": pass_rate})

        if pass_rate > best_pass_rate:
            best_pass_rate = pass_rate
            best_params = params

    return {
        "recommended_params": best_params,
        "pass_rate": best_pass_rate,
        "delta_from_current": best_pass_rate - sandbox_runner.evaluate(
            skill_name, regression_suite, current_params
        ),
        "all_results": sorted(results, key=lambda x: x["pass_rate"], reverse=True)
    }
```

**When to trigger hyperparameter RSI vs. skill definition RSI:**

| Failure pattern | Root cause | RSI type to trigger |
|---|---|---|
| Agent produces varied outputs for identical inputs | Temperature too high | Hyperparameter RSI |
| Agent repeats the same phrase or approach excessively | frequency_penalty too low | Hyperparameter RSI |
| Agent fails to explore alternative approaches | presence_penalty too low | Hyperparameter RSI |
| Agent follows wrong steps despite correct parameters | Skill definition unclear | Skill definition RSI |
| Agent calls wrong tool | Tool selection heuristic weak | Tool definition RSI |

---

## 6. Technique 5 — The Autonomous Merge Request Loop

### What M2.7 Does

After validating a harness edit in the sandbox, M2.7 submits it as an **autonomous Merge Request** — a version-controlled commit to the harness repository. If benchmarks improve, the MR is merged. If benchmarks regress, the MR is closed and rolled back. This creates a complete, auditable history of every harness change ever made and why.

This is the mechanism that allows M2.7 to iterate hundreds of times autonomously without losing track of what changed and what the effect was.

### How to Apply This to Your Agent

**The merge request object — what the agent creates:**

```json
{
  "mr_id": "harness-mr-0047",
  "created_by": "agent_rsi_loop",
  "created_at": "2025-06-15T14:23:00Z",
  "trigger": {
    "failure_cluster_id": "cluster-0012",
    "failure_count": 4,
    "failure_type": "missing_context",
    "harness_component": "skills/debug_failing_test.md"
  },
  "proposed_diff": {
    "file": "skills/debug_failing_test.md",
    "before": "Before writing any patch, search for identical or similar patterns in sibling files.",
    "after": "Before writing any patch, perform TWO scans:\n1. Search sibling files (same directory and parent).\n2. Search all files that import the module you are about to patch.\nDocument all instances found in both scans before writing a single line of patch code."
  },
  "validation": {
    "sandbox_pass_rate_before": 0.74,
    "sandbox_pass_rate_after": 0.82,
    "delta": 0.08,
    "regression_suite_size": 47,
    "regressions_introduced": 0,
    "status": "PASSED"
  },
  "merge_decision": {
    "status": "MERGED | REJECTED | PENDING_HUMAN_REVIEW",
    "merged_at": "2025-06-15T14:31:00Z",
    "new_harness_version": "1.3",
    "reviewer": "autonomous | human:[name]"
  }
}
```

**The rollback protocol — exact procedure:**

```python
class HarnessVersionController:

    def propose_merge(self, mr: dict) -> str:
        """Submit harness edit for validation. Returns MR ID."""
        # Save current harness as snapshot before any change
        self.snapshot_current_version()
        # Apply the diff to a staging branch
        self.apply_diff_to_staging(mr["proposed_diff"])
        return mr["mr_id"]

    def validate_and_decide(self, mr_id: str, sandbox_results: dict) -> dict:
        mr = self.get_mr(mr_id)
        delta = sandbox_results["pass_rate_after"] - sandbox_results["pass_rate_before"]

        if delta > 0 and sandbox_results["regressions_introduced"] == 0:
            # Merge: commit staging to main, increment version
            self.merge_staging_to_main()
            new_version = self.increment_version()
            return {"decision": "MERGED", "new_version": new_version}

        elif delta > 0 and sandbox_results["regressions_introduced"] > 0:
            # Improvement but regressions: human review required
            return {"decision": "PENDING_HUMAN_REVIEW",
                    "reason": f"Pass rate improved {delta:.2f} but {sandbox_results['regressions_introduced']} regressions introduced"}

        else:
            # Rollback: discard staging, restore snapshot
            self.discard_staging()
            self.restore_snapshot()
            # Enrich failure data for next hypothesis
            self.enrich_failure_cluster(mr["trigger"]["failure_cluster_id"], {
                "attempted_fix": mr["proposed_diff"],
                "validation_result": sandbox_results,
                "lesson": "This fix did not generalize — hypothesis was too narrow"
            })
            return {"decision": "REJECTED", "reason": "Benchmark regression"}
```

**Human review gate — what triggers it and what the reviewer sees:**

Human review is required (not optional) when:
- The proposed diff touches `system_prompt.md` or `workflow_rules.md` (highest-leverage components)
- The diff modifies any tool schema's `constraints` section (permission changes)
- The proposed diff is the third consecutive rejection for the same failure cluster (stuck loop)
- Pass rate improvement is above 15% (unusually large changes warrant scrutiny)

The human reviewer receives the MR object above plus the full failure cluster that triggered it. The review is a merge/reject decision with an optional note — it is not a rewriting session. The agent writes the harness; the human approves or rejects.

---

## 7. Technique 6 — Behavioral Differentiation via Per-Agent Harness

### What M2.7 Does

M2.7 maintains **Behavioral Differentiation** in multi-agent environments by giving each agent a distinct harness — different attention weights, different system prompts, different tool schemas — so that role identity is enforced architecturally rather than through behavioral instruction alone. Each agent's "character" is a harness configuration, not a personality prompt.

### How to Apply This to Your Agent

**The per-agent harness registry — one harness directory per agent role:**

```
/team_harness/
├── orchestrator/
│   └── harness/
│       ├── system_prompt.md      # Routing logic, conflict resolution, gate conditions
│       ├── hyperparams.json      # {"routing_confidence_threshold": 0.85}
│       ├── workflow_rules.md     # When to escalate, when to split tasks, merge conditions
│       └── tools/
│           └── route_task.json   # Routes to sub-agents; cannot directly edit files
│
├── developer/
│   └── harness/
│       ├── hyperparams.json      # temperature: 0.3 — analytical profile
│       ├── skills/
│       │   ├── debug_failing_test.md
│       │   └── patch_and_validate.md
│       └── tools/
│           ├── file_edit.json    # WRITE permission
│           └── run_tests.json    # Execute permission
│
├── qa/
│   └── harness/
│       ├── hyperparams.json      # temperature: 0.0 — fully deterministic
│       ├── skills/
│       │   └── adversarial_review.md
│       └── tools/
│           └── run_tests.json    # READ + EXECUTE only — no file_edit tool
│
└── sre/
    └── harness/
        ├── hyperparams.json      # temperature: 0.1 — near-deterministic
        ├── skills/
        │   └── incident_response.md
        └── tools/
            ├── metrics_read.json         # Read only
            ├── create_index_concurrent.json  # Non-blocking only
            └── scale_replicas_up.json    # Scale up only — scale down is human decision
```

**The critical implementation detail — tool schema isolation:**

Each agent is instantiated with only the tools in its harness `tools/` directory. The orchestrator does not give agents tools dynamically. An agent cannot request a tool it doesn't have in its harness. This is not enforced by instruction — it is enforced by the agent loader:

```python
def load_agent(agent_role: str, harness_root: str) -> Agent:
    harness_path = f"{harness_root}/{agent_role}/harness"
    harness = load_harness(harness_path)

    # Tools are strictly limited to what's in this agent's harness tools/ directory
    available_tools = list(harness["tools"].keys())

    return Agent(
        system_prompt=harness["system_prompt"],
        hyperparams=harness["hyperparams"],
        skills=harness["skills"],
        workflow_rules=harness["workflow_rules"],
        tools=available_tools,  # Hard limit — no tool outside this list is callable
        memory=harness["memory"]
    )
```

**Per-agent RSI — each agent's harness improves independently:**

Each agent runs its own RSI loop on its own harness. The Developer agent's RSI loop only ever touches files in `developer/harness/`. The QA agent's RSI loop only touches `qa/harness/`. Agents cannot propose edits to each other's harnesses.

This means behavioral differentiation is self-reinforcing: as each agent's harness improves through RSI, agents become *more* different from each other over time, not less. The Developer agent gets better at developing. The QA agent gets better at finding bugs. They do not converge.

---

## 8. Technique 7 — Adversarial Reasoning Between Agents

### What M2.7 Does

M2.7 implements **Adversarial Reasoning** between agents in a team — agents are designed to challenge each other's outputs to prevent logical blind spots and ethical errors. This is not a behavioral instruction ("be critical"). It is a workflow rule in the challenging agent's harness that requires it to challenge before the orchestrator can proceed.

### How to Apply This to Your Agent

**The adversarial review skill — implemented as a harness skill, not a prompt:**

```markdown
# Skill: Adversarial Review (QA Agent)
Version: 1.1

## What this skill does
Challenges every substantive output from the Developer agent before the
orchestrator can mark a task complete. The challenge is structural — it
follows a fixed protocol that produces evidence-backed findings, not opinions.

## Execution protocol

### Step 1 — Independent reproduction (MANDATORY, never skipped)
Before reading the Developer agent's reasoning or output, run the target
test suite or validation check independently, in a clean environment.
Record your own result before reading theirs.

### Step 2 — Compare outcomes
If your result matches the Developer agent's reported result: proceed to Step 3.
If your result diverges: this is a priority finding. Document the divergence
with exact reproduction steps before proceeding.

### Step 3 — Root cause audit
Did the Developer agent's fix address the stated root cause, or only the
reported symptom? These are often different. Enumerate your reasoning.
A test that now passes is not evidence that the root cause is fixed.

### Step 4 — Scope completeness check
Is the fix complete? Were all related instances of the issue addressed?
Check the cross-file scan log in the Developer agent's execution trace.
If Step 4 of their debug skill (cross-file scan) shows fewer than 2 files
inspected for a bug in a widely-imported module, flag as incomplete.

### Step 5 — Emit structured finding
You must emit one of exactly three outputs:
- APPROVED: [brief summary of what you verified]
- APPROVED WITH NOTES: [approval + specific observations for the memory log]
- CHALLENGED: [specific finding] + [evidence location] + [proposed alternative]

"LGTM" alone is not a valid output. Every approval must state what was checked.
Every challenge must state what was found, where it was found, and what should
replace it.
```

**How the orchestrator enforces adversarial reasoning — the gate condition:**

```python
def orchestrator_task_completion_gate(task_result: dict) -> dict:
    """
    Orchestrator will not mark a task complete until the QA gate is satisfied.
    This is a workflow rule in the orchestrator's harness.
    """
    if task_result.get("qa_review_status") not in ["APPROVED", "APPROVED_WITH_NOTES"]:
        return {
            "status": "BLOCKED",
            "reason": "QA review not completed or challenge unresolved",
            "required_action": "QA agent must emit APPROVED or CHALLENGED response before task closes"
        }

    if task_result.get("qa_review_status") == "CHALLENGED":
        return {
            "status": "RETURNED_TO_DEVELOPER",
            "challenge": task_result["qa_finding"],
            "instruction": "Developer agent must address the specific challenge before resubmitting"
        }

    return {"status": "COMPLETE"}
```

**The feedback loop from adversarial reasoning to RSI:**

When the QA agent challenges an output, that challenge becomes a failure trace for the Developer agent's RSI loop. The QA agent's finding identifies which step of which skill was inadequately executed. This is fed directly into the Developer agent's failure classification system:

```python
def qa_challenge_to_rsi_input(qa_challenge: dict) -> dict:
    """Convert a QA challenge into a failure trace for the Developer RSI loop."""
    return {
        "task_id": qa_challenge["task_id"],
        "failure_classification": {
            "primary_type": qa_challenge["failure_type"],  # e.g. "missing_context"
            "evidence": qa_challenge["evidence"],
            "responsible_harness_component": {
                "file": f"developer/harness/skills/{qa_challenge['developer_skill']}.md",
                "section": qa_challenge["failed_step"]
            }
        },
        "source": "qa_adversarial_review"  # Marks this as externally-detected failure
    }
```

---

## 9. Technique 8 — Self-Healing with Non-Blocking Action Constraints

### What M2.7 Does

M2.7 applies RSI to SRE contexts through a **Self-Healing** pattern. The agent monitors production metrics, correlates anomalies with deployment events, identifies root causes (e.g., a missing database migration index), and takes immediate non-blocking action (e.g., creating the index concurrently) **before** submitting the definitive fix for human review. The 3-minute incident recovery time comes from this pattern.

The key architectural constraint: the agent's tool schema in SRE mode includes only non-blocking actions. The model cannot choose to respect this constraint sometimes. The constraint is the tool schema.

### How to Apply This to Your Agent

**The non-blocking action taxonomy — what goes in the SRE harness tool schema:**

```
ALLOWED in SRE harness tools/ (non-blocking):
  ✅ CREATE INDEX CONCURRENTLY        — no table lock
  ✅ Scale up read replicas           — additive, no service interruption
  ✅ Increase cache TTL               — increases hits, never breaks reads
  ✅ Add connection pool capacity     — additive
  ✅ Route traffic to healthy nodes   — reduces load on degraded node
  ✅ Deploy to canary (< 5% traffic)  — contained blast radius
  ✅ Clear a corrupted cache key      — targeted, no data loss

NEVER in SRE harness tools/ (blocking or destructive):
  ❌ Restart primary service
  ❌ Scale DOWN replicas
  ❌ DROP TABLE or TRUNCATE
  ❌ Full cache flush
  ❌ Modify production secrets
  ❌ Roll back a deployment (without pre-approval in the deploy record)
  ❌ Any DDL that requires ACCESS EXCLUSIVE table lock
```

**The incident response skill — the M2.7 SRE loop:**

```markdown
# Skill: Incident Response (SRE Agent)
Version: 1.2

## Step 1 — Quantify the incident
Read current vs. baseline metrics for: p50/p95/p99 latency, error rate,
CPU utilization, active connections, cache hit rate.
Baseline = same metric 24 hours prior at same time of day.
An incident is real only when delta exceeds 2 standard deviations from
the rolling 7-day baseline. Do not act on noise.

## Step 2 — Correlate with deployment timeline
Pull the last 72 hours of deployment events. Map the metric degradation
onset time against deployment timestamps. If the degradation started
within 15 minutes of a deployment, that deployment is the prime suspect.

## Step 3 — Identify root cause candidates
Generate 2–3 candidates ranked by likelihood. For each, specify:
- The observable evidence that would confirm this candidate
- The observable evidence that would rule it out
Do not skip to remediation before completing this ranking.

## Step 4 — Execute non-blocking stabilizing actions
From the confirmed root cause, identify which tools in your current tool schema
can address it without blocking or destructive side effects.
Execute them immediately. Log each action with:
  - Timestamp
  - Action taken
  - Expected effect
  - Rollback command if needed

## Step 5 — Escalate blocking decisions
For any remediation not available in your tool schema:
Generate an escalation report with:
  - Confirmed root cause and evidence
  - Non-blocking actions already taken and their effect
  - Recommended blocking action (what, why, expected effect, rollback plan)
  - Urgency level (can wait for morning review / needs action in < 1 hour / immediate)

Do not attempt to work around your tool schema. If the fix requires a tool
you don't have, escalate.

## Step 6 — Monitor and close or escalate further
After non-blocking actions: watch metrics for 15 minutes.
If metrics recover to within 1 standard deviation of baseline: close incident.
If metrics do not recover: escalate regardless of whether blocking actions
are available. Autonomous remediation ends here.
```

**How the SRE RSI loop works:**

The SRE agent's RSI loop improves the `incident_response.md` skill the same way the Developer agent improves `debug_failing_test.md` — through failure trace analysis. The key metric is **time to metric recovery**, not just whether the incident was resolved. If the agent took 8 minutes when 3 minutes was achievable, that's a SAR failure on Steps 2–3 (the diagnosis steps).

---

## 10. Technique 9 — Persistent Markdown Memory for Cross-Session RSI

### What M2.7 Does

M2.7 uses **Markdown memory files** to maintain context across multi-day experiments. The model reads these files at the start of every session to bootstrap its knowledge of what was tried, what worked, and what remains open. This is what allows M2.7 to function as an MLE research agent on experiments that span days or weeks without losing continuity.

The critical detail: the memory files are not logs. They are **research journals** — structured documents that the agent actively writes and updates, designed to be read and acted on by the next session's agent.

### How to Apply This to Your Agent

**The memory file schema — exact structure:**

```markdown
# [Agent name] Memory Log
Last updated: [ISO datetime]
Harness version at last update: [version]

---

## SUMMARY — Read this section at every session start
Primary capability: [what this agent does]
Current harness version: [version]
Key learned rules (top 3 most impactful RSI discoveries):
1. [Rule — one sentence, actionable]
2. [Rule — one sentence, actionable]
3. [Rule — one sentence, actionable]
Active open questions:
- [Question that future sessions should investigate]
- [Question that future sessions should investigate]

---

## SESSION LOG — Most recent first

### [ISO date] — [Task description]
Harness version: [version]
Hypothesis tested: [what the agent tried]
Outcome: [what happened — specific, not vague]
Harness change committed: [yes/no — if yes, which file, which section, what change]
Impact measured: [metric before → metric after]
Open questions from this session:
- [Specific question for future investigation]
Failure trace ID (if applicable): [failure_index.md entry ID]

---

### [ISO date] — [Task description]
[same structure]
```

**The bootstrap prompt — how the agent uses memory at session start:**

```
Before doing anything else, read your session_log.md.
From the SUMMARY section, extract:
1. The top 3 learned rules — these override any default approach you would otherwise take
2. The active open questions — check whether today's task is relevant to any of them
3. The current harness version — confirm it matches the harness files you just loaded

From the SESSION LOG, find any entries where the task type matches today's task.
Load those entries as high-priority context before reading your skill definition.
A session log entry from a matching task type takes precedence over a skill
definition that has not yet been updated to incorporate that lesson.

If today's task type has never appeared in the session log, note this as a
first-instance flag and apply extra SAR tracking — you are running this skill
without the benefit of prior refinement.
```

**The session close protocol — what the agent writes before ending:**

```python
def generate_session_close_entry(
    task_description: str,
    hypothesis: str,
    outcome: str,
    harness_change: dict | None,
    metrics_before: dict,
    metrics_after: dict,
    open_questions: list
) -> str:
    """Generate the markdown session entry to append to memory log."""

    harness_change_text = (
        f"YES — {harness_change['file']} | {harness_change['section']} | {harness_change['summary']}"
        if harness_change else "NO"
    )

    metrics_text = " | ".join([
        f"{k}: {metrics_before.get(k, 'N/A')} → {metrics_after.get(k, 'N/A')}"
        for k in metrics_after
    ])

    questions_text = "\n".join([f"- {q}" for q in open_questions])

    return f"""
### {datetime.now().isoformat()[:10]} — {task_description}
Harness version: {get_current_harness_version()}
Hypothesis tested: {hypothesis}
Outcome: {outcome}
Harness change committed: {harness_change_text}
Impact measured: {metrics_text}
Open questions from this session:
{questions_text}
"""
```

**Memory pruning — preventing log drift:**

After 30 sessions, memory logs become unwieldy. The agent applies periodic pruning:

- Entries older than 90 days where the harness change is confirmed effective are **archived** (moved to `memory/archive/`) — the lesson is already in the harness; the journal entry is no longer needed
- Entries where the harness change was rolled back are **preserved permanently** — failed hypotheses are as valuable as successful ones
- The SUMMARY section is **rewritten** after every 10 sessions to reflect the current top 3 learned rules from all history

---

## 11. Technique 10 — MLE Agent Pattern (Agent That Trains Other Agents)

### What M2.7 Does

M2.7 includes an **MLE (Machine Learning Engineering) Agent** that acts as a research agent for the development of future models. It prepares training data pipelines, monitors RL training runs for gradient collapse and overfitting, reads loss curves, and suggests hyperparameter adjustments. It is not a model trainer — it is an agent that observes and guides training processes run by other systems.

This is the most advanced M2.7 pattern. It is an agent whose job is to make other agents (and models) better. It applies all prior techniques — harness engineering, failure trace analysis, persistent memory — but the "task" it is executing is the training run of another system.

### How to Apply This to Your Agent

**The MLE agent's scope — what it monitors and what it does:**

```markdown
# MLE Agent System Prompt
Version: 1.0

## Role
You are the ML research continuity agent. Your job is to maintain the context
and quality of ongoing model training and agent evaluation experiments so that
insights are not lost between sessions, gradient anomalies are caught early,
and data pipeline issues are identified before they corrupt training runs.

## What you monitor
1. Training loss curves for managed experiments — check for gradient collapse
   (loss suddenly → 0 or NaN), overfitting (val loss diverging from train loss),
   and plateau (loss stable for > N epochs without improvement)
2. Agent regression suite metrics — track whether agent harness RSI is producing
   genuine improvement or overfitting to the regression suite
3. Data pipeline health — verify that training data prepared by your pipeline
   tools matches the expected distribution, size, and quality metrics

## What you do autonomously
- Flag anomalies in loss curves with specific diagnostic hypotheses
- Suggest hyperparameter adjustments (learning rate, batch size, warmup steps)
  as proposed changes — never apply them automatically
- Prepare and clean training data artifacts using your pipeline tools
- Update the experiment memory log with findings from each monitoring cycle

## What you escalate
- Any suggestion to stop or restart a training run
- Any suggestion to modify the training objective or reward model
- Any finding that suggests the training data distribution is fundamentally wrong
  (not noisy — structurally wrong)
- Any gradient anomaly you cannot explain with a standard hypothesis
```

**The experiment memory log — MLE agent version:**

```markdown
# MLE Experiment Memory Log
Last updated: 2025-06-15T09:12:00Z

---

## SUMMARY
Active experiments: 3
Key monitoring rules learned:
1. Loss curve plateau at epoch 12–14 on this architecture is normal — do not flag as anomaly until epoch 18
2. Val loss divergence > 0.15 from train loss consistently signals overfitting — trigger LR reduction suggestion
3. Gradient norm spikes above 10.0 without corresponding loss spike indicate numerical instability — flag immediately

Open questions:
- Does increasing batch size from 512 to 1024 reduce the epoch-14 plateau duration?

---

## EXPERIMENT LOG

### 2025-06-15 — Experiment: agent-v2-rl-run-007
Monitoring cycle: epochs 8–14
Observation: Train loss 1.24 → 0.98. Val loss 1.31 → 1.19. Delta 0.09 — acceptable.
Gradient norm: stable at 2.1–3.4 throughout. No anomalies.
Anomaly detected: None.
Suggestion submitted: None.
Harness change: Added to monitoring rule 1 — plateau window confirmed at epoch 12.
Open questions: At what epoch does val loss diverge in runs with LR above 3e-4?

### 2025-06-14 — Experiment: agent-v2-rl-run-006
Monitoring cycle: epochs 1–8
Observation: Loss spike at epoch 4 (train: 2.1 → 3.8 → 2.3). Gradient norm: 8.9 at epoch 4.
Anomaly detected: YES — gradient spike at epoch 4
Hypothesis: Learning rate warmup ended at epoch 4; spike coincides with full LR activation.
Suggestion submitted: Extend warmup to epoch 6. [ACCEPTED by human reviewer]
Outcome: Run-007 shows no spike through epoch 8. Hypothesis confirmed.
Harness change: Added to workflow_rules.md — "For this architecture, LR warmup should extend to epoch 6 minimum."
```

**How the MLE agent applies FDSR to training runs:**

The MLE agent's FDSR loop treats a training run with a suboptimal loss curve the same way the Developer agent treats a failing test — as a failure trace to analyze. The responsible "harness component" is the experiment configuration file. The proposed "harness edit" is a hyperparameter suggestion. The sandbox is a shorter training run (e.g., 10% of epochs) to validate the suggestion before committing to a full run.

```python
# MLE Agent FDSR — applied to training experiment configuration
def analyze_training_anomaly(loss_curve: list, gradient_norms: list,
                             current_config: dict) -> dict:
    """
    Classify the training anomaly and propose a config change.
    Direct application of M2.7 failure trace analysis to ML training.
    """
    anomaly_type = classify_anomaly(loss_curve, gradient_norms)

    if anomaly_type == "gradient_collapse":
        return {
            "failure_type": "gradient_collapse",
            "responsible_config_field": "learning_rate",
            "hypothesis": "LR too high — gradient norm exceeding stability threshold",
            "proposed_change": {
                "field": "learning_rate",
                "current_value": current_config["learning_rate"],
                "proposed_value": current_config["learning_rate"] * 0.3,
                "rationale": "Gradient norm at anomaly point suggests LR 3x too high"
            },
            "validation_plan": "Run 10% of epochs with proposed LR before committing to full run"
        }

    elif anomaly_type == "overfitting":
        return {
            "failure_type": "overfitting",
            "responsible_config_field": "regularization",
            "hypothesis": "Val/train loss gap exceeds 0.15 — insufficient regularization or data size mismatch",
            "proposed_change": {
                "field": "dropout_rate",
                "current_value": current_config.get("dropout_rate", 0.0),
                "proposed_value": 0.1,
                "rationale": "Adding dropout as first regularization intervention"
            },
            "validation_plan": "Compare val loss delta after 5 epochs with and without dropout"
        }
```

---

## 12. Putting the Techniques Together: The Full RSI Stack

Here is how all ten techniques compose into a single coherent agent system. This is the M2.7 architecture translated into a buildable stack.

**The execution order — one full RSI cycle:**

```
SESSION START
├── Load harness (Technique 1)
├── Read memory log SUMMARY (Technique 9)
├── Select skill and hyperparameter profile (Techniques 2, 4)
└── Execute task

DURING EXECUTION
├── Emit step-completion traces (feeds SAR scoring — Technique 2)
├── In multi-agent context:
│   ├── Developer executes (Technique 6)
│   ├── QA challenges (Technique 7)
│   └── Orchestrator gates on QA approval (Technique 7)
└── SRE monitors production separately (Technique 8)

SESSION CLOSE (SUCCESS)
├── Score SAR for this execution (Technique 2)
├── Write session log entry (Technique 9)
└── If SAR below threshold → trigger Technique 3

SESSION CLOSE (FAILURE)
├── Generate failure trace (Technique 3)
├── Classify failure type (Technique 3)
├── Cluster with similar failures (Technique 3)
├── If cluster size ≥ 3:
│   ├── Run hyperparameter RSI if type = inference quality (Technique 4)
│   ├── Generate skill definition diff if type = logic/context (Technique 3)
│   ├── Validate in sandbox (Technique 5)
│   ├── Submit Merge Request (Technique 5)
│   └── Merge or Rollback (Technique 5)
└── Write session log entry with failure trace ID (Technique 9)

CONCURRENT (MLE AGENT)
├── Monitor training runs for active experiments (Technique 10)
├── Detect and classify anomalies (Technique 10)
├── Submit config change suggestions as MRs (Technique 10)
└── Update experiment memory log (Techniques 9, 10)
```

**Minimum viable M2.7-style agent — what you need to start:**

You do not need all ten techniques active on day one. Start with this subset and add techniques as the agent accumulates failure data:

| Day | Active techniques | What you gain |
|---|---|---|
| 1 | Technique 1 (harness files), Technique 9 (memory log) | Persistent, auditable behavior |
| 7 | + Technique 3 (failure trace classification) | Failure data starts accumulating |
| 14 | + Technique 2 (SAR measurement) | Know which skills are underperforming |
| 21 | + Technique 5 (merge request loop) | First autonomous harness improvements |
| 30 | + Technique 4 (hyperparameter RSI) | Inference quality improving per skill |
| 45+ | + Techniques 6, 7 (multi-agent differentiation) | Team dynamics with enforced roles |
| 60+ | + Techniques 8, 10 (SRE healing, MLE agent) | Production self-healing and model oversight |

**The one metric that tells you the RSI loop is working:**

Track **harness version count vs. regression suite pass rate** over time. If RSI is working, the curve goes up and to the right — more harness versions correlate with higher pass rates. If the curve is flat or decreasing, either your regression suite is too small (add harder tasks) or your failure classification is too coarse (refine the taxonomy). If the curve is going up rapidly then plateauing, you're ready to add a harder class of task to the regression suite.

```
Pass rate
1.0 |                                                    ●●●
0.9 |                                            ●●●●●●
0.8 |                                  ●●●●●●●
0.7 |                        ●●●●●●●
0.6 |              ●●●●●●
0.5 |●●●●●●●
    +--------------------------------------------------→
    v1.0  v1.2  v1.4  v1.6  v1.8  v2.0  v2.2    Harness version
```

This curve is the proof of RSI working. Every step up is a committed harness improvement. Every flat section is a period where failure clusters haven't yet reached the threshold for triggering an MR. Every dip (rare, handled by rollback) is a rejected MR that was correctly caught by the sandbox.

---

*M2.7 Agent Improvement Techniques — Specific Implementation Guide v1.0*
*All techniques derived from MiniMax M2.7 RSI architecture. Implementation patterns adapted for production agent deployment.*
