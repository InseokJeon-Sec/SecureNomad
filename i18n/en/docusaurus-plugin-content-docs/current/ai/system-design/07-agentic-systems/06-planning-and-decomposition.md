---
title: "Planning and Decomposition"
sidebar_position: 6
description: "Korean-site mirror of the original English chapter from Om Bharatiya's AI System Design Guide (MIT)."
---

:::info Source / License
Original (English) from [ai-system-design-guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/07-agentic-systems/06-planning-and-decomposition.md) by Om Bharatiya — MIT License, © 2026 Om Bharatiya. Reproduced with attribution; see [About · Source · License](../index.md). Snapshot: upstream `ed955b2` (2026-10-09). Links to not-yet-mirrored chapters point to the original repository.
:::

Planning is the "System 2" component that allows agents to solve multi-stage problems without "wandering." Production agents have moved from simple "Chain-of-Thought" to **Recursive Decomposition** and **Tree Search**, with reasoning-native models (Claude Opus 5.5 and Fable 5.1, GPT-6 Astra and GPT-6.1 Sol) doing the heavy planning internally at whatever effort level you set.

## Table of Contents

- [The Planning Spectrum](#the-planning-spectrum)
- [Static vs. Dynamic Planning](#static-vs-dynamic-planning)
- [Clarify Before You Decompose](#clarify-before-you-decompose)
- [Chain-of-Thought (CoT) and Reasoning Models](#cot-and-reasoning-models)
- [Recursive Task Decomposition](#recursive-task-decomposition)
- [Tree Search (MCTS) for Agent Paths](#tree-search-mcts)
- [Interview Questions](#interview-questions)
- [References](#references)

---

## The Planning Spectrum

| Method | Strategy | Complexity | Best For |
|--------|----------|------------|----------|
| **Linear** | One step at a time | Low | Simple tools |
| **Branching** | If-Then-Else logic | Medium | Conditional flows |
| **Hierarchical** | Master-Plan -> Sub-Plans | High | Software engineering |
| **Search-Based** | Try multiple paths internally | Max | Scientific Research |

---

## Static vs. Dynamic Planning

### Static (Plan-and-Solve)
The agent writes a 10-step plan and follows it strictly.
- **Pros**: High performance, easy to parallelize.
- **Cons**: Brittle. If step 2 fails, steps 3-10 are useless.

### Dynamic (Adaptive)
The agent writes a plan, but **Re-evaluates** after every tool call.
- **Best practice**: Use **Checkpointed Planning**. The agent is forced to "Commit" its progress to a state store after every major sub-goal to allow for recovery and "Backtracking" if the plan fails.

---

## Clarify Before You Decompose

The most expensive planning error is decomposing the wrong goal, and 2026 measurements say agents rarely ask. In Sierra's hyper-tau-bench (September 2026), where a developer agent must recover requirements from business records and a client interview and then build a customer-service agent, Claude Opus 5 working alone in Claude Code passed 23.9% of held-out tests, while the same class of model paired with an engineer who had deep context reached 82.2%. The developer agents opened fewer than 80 of roughly 1,700 available banking files and asked at most 4 client questions when the client alone held 20 to 25 requirements. One sentence of architecture advice doubled a telecom score from 31% to 67%. OSWorld 2.0's failure analysis names the same gap for desktop agents: missing information, because agents rarely ask to clarify.

Design consequences:

- **Make requirement elicitation an explicit plan step** with its own budget, not something the model may choose to skip.
- **Ask only where the answer changes the plan.** OpenAI describes GPT-6 Astra in Codex as asking focused questions only for consequential decisions and continuing with work that does not depend on the answer. That is the right shape: a blocking question per fork, not a questionnaire.
- **Feed in the architecture hint.** If a human knows the right shape, one sentence in the plan prompt is cheaper than any amount of agent exploration.

---

## CoT and Reasoning Models

The model's internal "Thinking" window (Inference scaling) acts as a **Hidden Planner**.
- Instead of using a separate "Planner LLM," we use a reasoning model (Claude Opus 5.5, GPT-6 Astra) to generate a "Mental Draft."
- This draft is translated into a **Task DAG (Directed Acyclic Graph)** that the orchestrator executes.
- **Effort is the planning budget.** Run the planning call at high effort and execution steps at low effort on the same model, rather than switching models. Pin effort explicitly: defaults change between versions (Opus 5.5 defaults to `medium`, Opus 5 defaulted to `high`).

---

## Recursive Task Decomposition

For massive tasks (e.g., "Build a full-stack app"), we use **Sub-Agent Spawning**.
1. **Master Agent**: Decomposes "Project" into "Frontend," "Backend," and "DB."
2. **Sub-Agents**: Each receives a "Sub-Goal" and performs its own decomposition.
3. **Consolidation**: The Master Agent merges the results.

**Critical Nuance**: Each sub-agent is given a **Minimal Context** (only what it needs) to prevent token bloat and hallucination.

**Bound the fan-out at the platform, not in the prompt.** Coordinator products now spawn subagents at scale (Cursor's Projects beta delegates to as many parallel subagents as a plan needs), so the cap has to live outside the model: OpenAI's Agents API exposes `max_concurrent_subagents` (default 6), and a total budget for the whole tree belongs at the gateway.

---

## Tree Search (MCTS)

For high-stakes decisions, we use **Monte Carlo Tree Search (MCTS)** within the agent loop.
- The agent "Simulates" 10 possible tool calls.
- A **Reward Model** (or a separate LLM prompt) scores each simulation.
- The agent follows the path with the highest reward.

---

## Interview Questions

### Q: How do you prevent an agent from "Infinite Recursion" during task decomposition?

**Strong answer:**
We implement **Decomposition Depth Limits** (usually 3 levels) and **Granularity Checks**. Before spawning a sub-agent, we ask the Supervisor model: "Is this task small enough to be solved by a single tool call?" If yes, we execute. If no, we decompose. We also use a **Global Controller** that tracks the total "Agent Count" to prevent a recursive bomb (fork bomb) that could drain the API budget. On a managed runtime I set the platform's own concurrency cap (for example `max_concurrent_subagents` in OpenAI's Agents API) and a session spend cap (Claude Managed Agents pauses with `budget_reached`), because a limit the model can talk itself past is not a limit.

### Q: Why is "Plan Revision" often more expensive than "Plan Generation"?

**Strong answer:**
Plan generation is a "Fresh Start." Plan revision requires **Context Re-evaluation**: the model must understand what was *already done*, why the *previous step failed*, and how to fix it without undoing previous successes. This requires a much higher "Reasoning Density." In production, we spend more on the **Revision** step than on the initial plan: either a stronger model (e.g., Claude Opus 5.5 or GPT-6 Astra) or, more often now, the same model at a higher effort setting, which keeps the context and cache intact while buying more thinking.

---

## References
- Silver et al. "Mastering the game of Go with deep neural networks and tree search" (Nature, 2016), the origin of MCTS-plus-learned-value search applied to LLM agents
- Wang et al. "Self-Consistency Improves Chain of Thought Reasoning in Language Models" (2022). https://arxiv.org/abs/2203.11171
- LangGraph. "Multi-Agent Planning Patterns" (2025)
- Sierra. "hyper-tau-bench: evaluating agents that build agents" (September 2026). https://sierra.ai/blog/hyper-t-bench-evaluating-agents-that-build-agents

---

*Next: [Error Handling and Recovery](07-error-handling-and-recovery.md)*

