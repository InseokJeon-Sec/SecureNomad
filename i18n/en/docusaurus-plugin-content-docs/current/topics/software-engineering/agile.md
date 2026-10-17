---
title: Agile · Scrum
sidebar_label: Agile · Scrum
sidebar_position: 2
tags: [software-engineering, important]
description: Concepts of agile development and the Scrum framework — values, principles, events, artifacts, roles, and comparison with waterfall
---

# Agile · Scrum

## I. Overview
- **Definition**: **Agile** is a development philosophy that responds flexibly to change and delivers working software incrementally through **short, repeated iterations**. **Scrum** is the representative framework that implements it.
- **Background / motivation**: In environments where requirements change often, plan-driven waterfall responds slowly to change. It was codified in the 2001 **Agile Manifesto**.

## II. The four values of Agile
| Value more | over |
|---|---|
| Individuals and interactions | processes and tools |
| Working software | comprehensive documentation |
| Customer collaboration | contract negotiation |
| Responding to change | following a plan |

> The items on the right have value too, but the **left is valued more**.

## III. Scrum — structure
```text
Product Backlog → (Sprint Planning) → Sprint Backlog
   → [Sprint 2–4 weeks: Daily Scrum] → Increment
   → Sprint Review (result) → Sprint Retrospective (improve) → repeat
```

| Aspect | Elements |
|---|---|
| **Roles** | Product Owner (priority), Scrum Master (facilitates process), Development Team |
| **Events** | Sprint, Sprint Planning, Daily Scrum, Review, Retrospective |
| **Artifacts** | Product Backlog, Sprint Backlog, Increment |

## IV. Characteristics · pros/cons
| Aspect | Content |
|---|---|
| Pros | Fast feedback, responsiveness to change, early risk discovery, transparency |
| Cons | Risk of too little documentation, needs a skilled team and culture, scope management is hard |
| Considerations | Organizational culture and management support, avoid excessive meetings, a clear DoD (definition of done) |

## V. Comparison — Waterfall vs Agile
| Aspect | Waterfall | Agile |
|---|---|---|
| Flow | Sequential (analysis→design→build→test) | Iterative, incremental |
| Requirement change | Hard (costly late) | Flexible |
| Delivery | Once at the end | A little each cycle |
| Documentation | Heavy | Working software first |

## VI. Practice · real-world view
- Suited to new services/products with fluid requirements. For regulated/safety-critical domains, a hybrid (plan + iteration) is used.
- Scaling: for large organizations, scaled-agile frameworks like **SAFe, LeSS**. Extending into operations connects to **DevOps**.

## VII. Conclusion
- Agile is not a "method" but a **culture of responding to change**. Scrum is its practice framework.
- Adopting only the tools and ceremonies without the culture fails (beware "fake agile").
