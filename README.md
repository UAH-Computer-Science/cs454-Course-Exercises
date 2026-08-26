# CS454 Course Exercises

Hands-on exercises for CS454 Cloud Computing.

The course starts **local-first**: students learn the ideas behind cloud computing using processes, containers, networking, configuration, and lightweight virtualization before moving those same ideas into AWS/Azure.

## Exercises

### Exercise 01 — From Process to Container

Start with a tiny HTTP service running directly on your machine, then package it as a Docker image, run multiple isolated instances, configure them with environment variables, and finally manage them together with Docker Compose.

Concepts:

- process vs. container
- image vs. running container
- port mapping
- environment-based configuration
- container identity and isolation
- disposable infrastructure
- service composition

See [`exercise-01-process-to-container/README.md`](exercise-01-process-to-container/README.md).

## Suggested course progression

1. Local processes and operating-system concepts
2. Containers and Docker
3. Docker Compose and local service architectures
4. Virtual machines and the container/VM tradeoff
5. Kubernetes / orchestration
6. Cloud infrastructure and managed services
7. AWS / Azure deployments

The goal is to make the cloud feel like an extension of concepts students have already seen locally, rather than a collection of vendor-specific buttons.
