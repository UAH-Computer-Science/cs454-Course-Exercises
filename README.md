# CS454 Course Exercises

Hands-on exercises for CS454 Cloud Computing.

The course starts **local-first**: students learn the ideas behind cloud computing using processes, containers, networking, configuration, virtual machines, and orchestration before moving those same ideas into AWS/Azure.

## Exercises

### Exercise 01 — From Process to Container

Start with a tiny HTTP service running directly on your machine, then package it as a Docker image, run multiple isolated instances, configure them with environment variables, and manage them together with Docker Compose.

Concepts:

- process vs. container
- image vs. running container
- port mapping
- environment-based configuration
- container identity and isolation
- disposable infrastructure

See [`exercise-01-process-to-container/README.md`](exercise-01-process-to-container/README.md).

### Exercise 02 — The Same Service in a Virtual Machine

Run the same service inside a local Ubuntu VM, inspect the machine boundary, stop/start the entire machine, then destroy and recreate it automatically with cloud-init and systemd.

Concepts:

- VM vs. container
- guest operating systems
- virtual networking
- machine lifecycle vs. application lifecycle
- persistent machine disks
- automated provisioning
- cloud-init / user-data concepts

See [`exercise-02-local-vm/README.md`](exercise-02-local-vm/README.md).

### Exercise 03 — Building a Small Service Architecture with Docker Compose

Combine an API with Redis over a private Docker network. Break dependencies, preserve state independently from the application, and scale the API until a new problem appears: clients need a stable way to find interchangeable instances.

Concepts:

- multi-service architectures
- private container networking
- service discovery by DNS name
- dependency failures
- stateless compute vs. persistent state
- volumes
- horizontal scaling
- why load balancing/orchestration becomes necessary

See [`exercise-03-compose-services/README.md`](exercise-03-compose-services/README.md).

### Exercise 04 — From Containers to Orchestration with Local Kubernetes

Run multiple replicas of the service in a local k3d Kubernetes cluster. Delete pods and watch them return, scale declaratively, and put disposable instances behind a stable Service and Ingress.

Concepts:

- nodes, pods, deployments, services, and ingress
- declarative desired state
- reconciliation
- self-healing
- horizontal scaling
- stable service discovery
- readiness and liveness probes
- rolling changes

See [`exercise-04-local-kubernetes/README.md`](exercise-04-local-kubernetes/README.md).

## The story these exercises tell

Each exercise intentionally creates the motivation for the next one:

```text
Run a process
      |
      v
Package it reproducibly
      |
      v
Container
      |
      +----------------------+
      |                      |
      v                      v
Need stronger           Need multiple
machine isolation       cooperating services
      |                      |
      v                      v
Virtual Machine         Docker Compose
                             |
                             v
                      Need stable discovery,
                      replacement, and scaling
                             |
                             v
                         Kubernetes
                             |
                             v
                   Move the same abstractions
                     onto cloud infrastructure
```

## Suggested course progression

1. Local processes and operating-system concepts
2. Containers and Docker
3. Virtual machines and the container/VM tradeoff
4. Docker Compose and local service architectures
5. Kubernetes / orchestration
6. Cloud infrastructure concepts: compute, networking, storage, identity, managed services
7. Map local concepts to AWS and Azure
8. Infrastructure as code and deployment automation

The goal is to make the cloud feel like an extension of concepts students have already seen locally, rather than a collection of vendor-specific buttons.

## Instructor philosophy

Whenever possible, introduce a problem **before** introducing the cloud product that solves it.

For example:

- create a VM locally before launching EC2 or Azure Virtual Machines;
- use environment variables before discussing cloud configuration systems;
- use a Docker volume before discussing managed/persistent storage;
- use service-name DNS in Compose before Kubernetes Services;
- scale containers manually before introducing orchestration;
- use cloud-init locally before EC2 user data or Azure cloud-init;
- run Kubernetes locally before discussing EKS or AKS.

That keeps the course focused on transferable computing concepts. AWS and Azure then become concrete implementations of those concepts rather than the concepts themselves.
