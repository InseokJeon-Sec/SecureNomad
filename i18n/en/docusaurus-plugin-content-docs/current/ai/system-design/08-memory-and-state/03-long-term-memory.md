---
title: "Long-Term Memory"
sidebar_position: 3
description: "Korean-site mirror of the original English chapter from Om Bharatiya's AI System Design Guide (MIT)."
---

:::info Source / License
Original (English) from [ai-system-design-guide](https://github.com/ombharatiya/ai-system-design-guide/blob/main/08-memory-and-state/03-long-term-memory.md) by Om Bharatiya — MIT License, © 2026 Om Bharatiya. Reproduced with attribution; see [About · Source · License](../index.md). Snapshot: upstream `ed955b2` (2026-10-09). Links to not-yet-mirrored chapters point to the original repository.
:::

Long-term memory (L2 & L3) provides persistence across sessions. Production stacks have moved from simple "History RAG" to **Multi-Representation Stores** that combine Vector, Graph, Relational, and file-based data. Dedicated memory services now take three distinct shapes: fact stores on top of your vector database (Mem0), temporal knowledge graphs (Zep/Graphiti, Cognee), and git-backed memory files (Letta MemFS, the Claude memory tool).

## Table of Contents

- [Episodic Memory: The Personal Log](#episodic-memory-the-personal-log)
- [Semantic Memory: The Fact Store](#semantic-memory-the-fact-store)
- [Hybrid Vector-Graph Storage](#hybrid-vector-graph-storage)
- [Memory Pruning and Decay](#memory-pruning-and-decay)
- [Privacy and Multi-Tenancy](#privacy-and-multi-tenancy)
- [Interview Questions](#interview-questions)
- [References](#references)

---

## Episodic Memory: The Personal Log

Episodic memory stores **Trajectories**: sequences of events and their outcomes.
- **Data Structure**: `(Timestamp, Interaction_ID, Trajectory_Summary, Embedding)`.
- **The Rationale**: If an agent successfully built a React component using a specific tool sequence last month, it should "Recall" that success when asked to build another one today.
- **Implementation Note**: We store the *Summary* for retrieval and the *Raw Logs* in cold storage (S3/GCS) for forensic analysis. Keeping raw logs also enables read-time curation: Just-in-Time Memory (arXiv 2609.27334) curates raw trajectories for the current task at read time and beat the strongest write-time memory baseline on ALFWorld, WebShop, and tau2-bench.

---

## Semantic Memory: The Fact Store

Semantic memory stores **Discovered Facts** about entities.
- **Entity Identification**: Using a "Fact Extraction Agent" to parse every user turn.
- **Example triplets**:
  - `(User_1, HAS_PREFERENCE, Dark_Mode)`
  - `(Company_X, USES_SDK, Stripe)`
- **Technology**: Knowledge Graphs (Neo4j, AWS Neptune) combined with relational tagging, or a fact store inside the vector database with an entity index (Mem0 v2).

---

## Hybrid Vector-Graph Storage

Staff-level engineers use **GraphRAG-style Memory** where relationships carry the value.
- **Vector Search** finds "Related" nodes.
- **Graph Traversal** finds "Connected" nodes.
- **The Win**: If I search for "Project Alpha," vector search finds the name, but graph traversal finds the 10 developers, the deadline, and the linked code repos.

**The counter-argument got stronger in 2026.** Mem0 v2.0.0 (April 2026) removed its Neo4j, Memgraph, Kuzu, and Apache AGE drivers (about 4,000 lines) and instead stores entity links in a parallel collection inside the existing vector store, fusing semantic similarity, BM25, and entity boosting into one retrieval score. The bet: for user-preference memory, entity-aware retrieval captures most of the graph's benefit without running a second database. Use a real graph when you need multi-hop traversal or **temporal validity** ("what was true on March 12?"), which is Zep/Graphiti's strength: every edge carries `valid_at` / `invalid_at` (when the fact was true in the world) alongside `created_at` / `expired_at` (when the system learned and retired it).

---

## Memory Pruning and Decay

Memory is a liability if it grows unchecked.
- **Temporal Decay**: Older memories lose their "relevance score" unless frequently accessed.
- **Consolidation**: Merging 10 separate interactions about "billing" into one high-quality summary node. This increasingly runs **off the request path**: Anthropic's Dreams research preview reads a memory store plus past transcripts and writes a reorganized store, and Mem0's Dream does merging and superseding on its paid plans.
- **Explicit Forgetting**: Honoring GDPR "Right to be Forgotten" by deleting all episodic and semantic clusters associated with a user ID, including derived summaries, backups, and git history for file-based memory.
- **Gated injection**: retrieval relevance is not the same as usefulness. On MemTrapBench (arXiv 2608.20202) tasks built to trigger memory traps, correct, semantically relevant memories still caused reasoning fixation and belief distortion, and every memory strategy it tested underperformed no memory. Decide per request whether memory goes into context at all.

---

## Privacy and Multi-Tenancy

> [!CAUTION]
> **Cross-Session Leakage** is the #1 security risk in global memory.
> Ensure that the `user_id` is a hard partition key in your vector DB metadata. Never rely on the LLM to filter results by user.

Two further controls:
- **Write-gate shared memory.** Memory that many users can write to is a poisoning target. Asana (September 2026) lets anyone give an agent feedback on a task, but only admins and editors can commit it to permanent shared memory or delete from it; everyone else's feedback applies only to the current task.
- **Operator-blind storage when required.** For memory the provider itself must not read, the reference design is client-held keys with enclave processing and publicly attested server software. Google described this for Private AI Compute on September 23, 2026, as a plan with no product dates.

See [Agent Memory and State](https://github.com/ombharatiya/ai-system-design-guide/blob/main/07-agentic-systems/05-agent-memory-and-state.md) for memory poisoning and tenant-isolation interview questions.

---

## Interview Questions

### Q: How do you choose between a Vector DB and a Knowledge Graph for long-term memory?

**Strong answer:**
I use **Vector DBs** for **Episodic Context** (unstructured logs, past conversations) because I need a "Fuzzy" match on meaning. I use **Knowledge Graphs** for **Structural Semantic Knowledge** (relationships, attributes, hierarchies) because I need "Deterministic" traversal. A production system uses a **Hybrid** approach: the vector index points to graph IDs, allowing the system to find the right "Starting Node" and then traverse for high-precision context. Before adding the graph, though, I check whether entity-aware retrieval in the vector store is enough; Mem0 dropped graph databases in v2 on exactly that bet. The graph earns its operational cost when queries are multi-hop or time-scoped.

### Q: What is "Catastrophic Forgetting" in the context of learned agentic memory?

**Strong answer:**
In fine-tuned agents, catastrophic forgetting happens when new training data wipes out old knowledge. In **Agentic Memory (RAG-based)**, it refers to **Index Overload**. If an agent adds 1,000 low-quality new "facts" to its memory, the retrieval precision drops, effectively making it "forget" the older, higher-quality facts because they are buried in noise. ADD-only write paths (Mem0 v2 has no update or delete pass) make this more likely unless something consolidates later. We mitigate this with **Quality-Weighted Retrieval** (memories with high "Verification Scores" from a supervisor are boosted over raw logs) and a scheduled consolidation job that merges duplicates and supersedes stale facts.

---

## References
- [Zep: A Temporal Knowledge Graph Architecture for Agent Memory (arXiv 2501.13956)](https://arxiv.org/abs/2501.13956)
- [Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory (arXiv 2504.19413)](https://arxiv.org/abs/2504.19413)
- [Mem0 v2.0.0 release notes](https://github.com/mem0ai/mem0/releases/tag/v2.0.0)
- Edge et al. "From Local to Global: A Graph RAG Approach to Query-Focused Summarization" (2024)
- [MemTrapBench (arXiv 2608.20202)](https://arxiv.org/abs/2608.20202)
- [Just-in-Time Memory (arXiv 2609.27334)](https://arxiv.org/abs/2609.27334)
- [Anthropic. "Agents you can coach: how Asana builds human-agent teams with Claude" (September 2026)](https://claude.com/blog/agents-you-can-coach-how-asana-builds-human-agent-teams-with-claude)

---

*Next: [Agentic Memory with Mem0](04-agentic-memory-mem0.md)*

