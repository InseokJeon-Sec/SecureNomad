---
title: Containers · Kubernetes
sidebar_label: Containers · Kubernetes
sidebar_position: 1
tags: [emerging-tech, important]
description: Concepts of containers and Kubernetes (K8s), components, comparison with VMs, the role of orchestration, and the security view
---

# Containers · Kubernetes

## I. Overview
- **Container**: A lightweight virtualization technology that packages an application and the libraries it needs into **one package (image)** and runs it in isolation while sharing the OS kernel (representative: Docker).
- **Kubernetes (K8s)**: A platform that **automatically deploys, scales, and operates (orchestrates)** many containers. Created by Google, a CNCF standard.
- **Motivation**: When containers number in the hundreds or thousands, manual management is impossible → automatic scheduling, recovery, and scaling are needed.

## II. Concept diagram · components
```text
[Control Plane]
  API Server · etcd (state store) · Scheduler · Controller Manager
        │
   ┌────┴────┬─────────┐
[Node1]   [Node2]   [Node3]   ← Worker Node
 Pod Pod   Pod       Pod       (kubelet · kube-proxy · container runtime)
```

| Element | Role |
|---|---|
| Pod | Smallest deploy unit (one or more containers) |
| Node | Worker machine that runs Pods |
| Deployment | Manages Pod deployment, rolling updates, replicas |
| Service | Stable access point to a set of Pods (load balancing) |
| etcd | Cluster state store |
| Scheduler | Decides which Node a Pod runs on |

## III. Core features
- **Auto-scaling**: adjusts Pod count by load (HPA)
- **Self-healing**: restarts/reschedules dead Pods automatically
- **Rolling update / rollback**: zero-downtime deployment
- **Declarative management**: declare the desired state (YAML) and K8s reconciles to it

## IV. Characteristics · pros/cons
| Aspect | Content |
|---|---|
| Pros | Portability, resource efficiency, auto scale/recovery, fast deployment |
| Cons | Steep learning/operations curve, complex networking/security configuration |
| Considerations | Managed services (EKS/GKE/AKS) ease the operational burden |

## V. Comparison — VM vs Container
| Aspect | Virtual Machine (VM) | Container |
|---|---|---|
| Isolation | Hypervisor, guest OS | Shares OS kernel |
| Size | Several GB | Tens–hundreds of MB |
| Boot | Tens of seconds | Within seconds |
| Resources | Heavy | Light |

## VI. Practice · real-world view
- The execution foundation of MSA. Package each microservice as a container and operate it with K8s. Related: [MSA](../software-engineering/msa.md)
- **Security view**: image vulnerability scanning, least-privilege RBAC, network policies, secret management, runtime threat detection. Combine with zero trust and a service mesh (mTLS).

## VII. Conclusion
- Containers handle **packaging and portability**; Kubernetes handles **large-scale operational automation**.
- It is the core infrastructure of cloud native, and security must be designed together across image, configuration, and runtime stages.
