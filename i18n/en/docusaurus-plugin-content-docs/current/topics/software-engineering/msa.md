---
title: MSA (Microservice Architecture)
sidebar_label: MSA
sidebar_position: 1
tags: [software-engineering, important]
description: Concept, components, comparison with monolith, pros/cons, and key patterns of microservice architecture (MSA)
---

# MSA (Microservice Architecture)

## I. Overview
- **Definition**: An architecture that composes an application as a set of **small, independently deployable services**. Each service runs in its own process and collaborates over lightweight communication (mainly HTTP/REST or messaging).
- **Background / motivation**: A monolith (a single large application) requires redeploying the whole app even for a small change, and its scaling and technology choices are rigid. With the spread of cloud and DevOps, **fast deployment and independent scaling** became requirements, and MSA emerged.

## II. Concept diagram · components
```text
[API Gateway]  ← single entry point (routing, auth, aggregation)
   ├─ Order service    ─ Order DB
   ├─ Payment service  ─ Payment DB
   └─ Member service   ─ Member DB
[Service Discovery] [Config Server] [Message Broker]
```

| Component | Description |
|---|---|
| API Gateway | Single entry point for external requests; routing, auth, rate limiting |
| Service Discovery | Registers and looks up service instances (locations) |
| Config Server | Centralized configuration management |
| Message Broker | Asynchronous event communication (e.g., Kafka) |
| Per-service DB | **Database per Service** — each service owns its DB |

## III. Core principles / patterns
- **Independent deploy & scale**: deploy and scale per service
- **Decentralized data management**: each service owns its DB → link via API/events instead of joins
- **Saga pattern**: handle distributed transactions with compensating transactions
- **Circuit Breaker**: stop failure propagation (one service's failure doesn't cascade)
- **API Gateway / BFF**: unify the entry point

## IV. Characteristics · pros/cons
| Aspect | Content |
|---|---|
| Pros | Independent deploy/scale, technology diversity, fault isolation, team autonomy |
| Cons | Distributed-system complexity, data-consistency difficulty, operations/monitoring overhead, network latency |
| Considerations | Service boundary design (DDD), distributed tracing/logging, organization structure (Conway's law) |

## V. Comparison — Monolith vs MSA
| Aspect | Monolith | MSA |
|---|---|---|
| Deployment | All at once | Per service |
| Scaling | Replicate whole app | Only the needed service |
| DB | Single shared | Dedicated per service |
| Failure | Affects everything | Can be isolated |
| Initial complexity | Low | High |

## VI. Practice · real-world view
- Suited to services that need large-scale traffic and fast releases. For small services/early stages, a monolith is often better (**modular monolith → migrate to MSA when needed**).
- **Security view**: service-to-service authentication (mTLS), API-gateway authn/authz, combined with zero trust. The attack surface grows, so control it with a service mesh (Istio, etc.).

## VII. Conclusion
- MSA trades **distributed complexity** for **agility and scalability**.
- It pays off most when organizational and operational capability (DevOps, observability) is in place. Related: [Containers & Kubernetes](../emerging-tech/kubernetes.md)
