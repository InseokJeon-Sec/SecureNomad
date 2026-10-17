---
title: Normalization
sidebar_label: Normalization
sidebar_position: 1
tags: [database, important]
description: Concept of relational database normalization, anomalies, 1NF–BCNF stages, and balancing with denormalization
---

# Normalization

## I. Overview
- **Definition**: In a relational DB, the process of **decomposing relations into small, well-structured units** based on functional dependencies, in order to **reduce data redundancy and remove anomalies**.
- **Background / motivation**: Putting all data into one table causes duplicated storage, update omissions, and side effects on insert/delete.

## II. Anomalies
| Type | Description |
|---|---|
| Insertion anomaly | Can't insert without also having unnecessary data |
| Update anomaly | Only some of the duplicated values get updated → inconsistency |
| Deletion anomaly | Deleting one datum also removes needed information |

## III. Normalization stages
| Stage | Condition | Removes |
|---|---|---|
| **1NF** | All attributes atomic (indivisible) | Repeating groups, multi-values |
| **2NF** | 1NF + remove partial functional dependency | Dependency on part of the key |
| **3NF** | 2NF + remove transitive functional dependency | Dependency on non-key attributes |
| **BCNF** | 3NF + every determinant is a candidate key | A determinant that isn't a candidate key |

> There are also 4NF (multivalued dependency) and 5NF (join dependency) later, but in practice usually 3NF–BCNF.

```text
Unnormalized → 1NF (atomic) → 2NF (remove partial dep.)
            → 3NF (remove transitive dep.) → BCNF (determinant = candidate key)
```

## IV. Characteristics · pros/cons
| Aspect | Content |
|---|---|
| Pros | Removes redundancy/anomalies, data consistency, saves storage |
| Cons | Table decomposition → more joins → possible read-performance drop |
| Considerations | Read-heavy systems need a balance with performance |

## V. Comparison — Normalization vs Denormalization
| Aspect | Normalization | Denormalization |
|---|---|---|
| Goal | Consistency, integrity | Read performance |
| Redundancy | Minimized | Intentionally allowed |
| Joins | Many | Reduced |
| Applies to | OLTP (transactions) | OLAP / read-heavy, large aggregation |

## VI. Practice · real-world view
- The default is to **normalize to 3NF**, then apply **selective denormalization** once a performance bottleneck is confirmed (aggregate columns, history tables, etc.).
- Design together with integrity constraints (PK/FK/UNIQUE) so the benefits of normalization are preserved.

## VII. Conclusion
- Normalization is for **integrity**; denormalization is for **performance**. They are a trade-off.
- The principle is "normalize first, then denormalize with evidence when needed."
