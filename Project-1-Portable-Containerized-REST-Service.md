# Project 1 — Portable Containerized REST Service

## Description

In this project you will build a small multi-container application and run it locally using Docker or Podman with Compose. You will develop a REST service that converts pounds (lbs) to kilograms (kg), package it as an OCI-compatible container image, connect it to Redis for persistent state, and demonstrate that the complete application can be started, stopped, inspected, and recreated reproducibly.

You may implement the application in Node.js/Express (recommended) or another comparable stack such as Python/Flask, Go, or Java/Spring.

This is primarily a **containerization and application deployment** project. The conversion calculation itself is intentionally simple so that you can focus on packaging, configuration, networking, persistence, and operations.

## Learning Objectives

By completing this project, students will be able to:

1. Explain how containerization makes an application portable and reproducible across different computing environments.
2. Package an application in an OCI-compatible image using appropriate image-building practices.
3. Separate application code from runtime configuration and persistent state.
4. Build a small multi-container application whose services communicate over a private container network.
5. Use a named volume to preserve application state independently of container lifetime.
6. Operate and troubleshoot a containerized application using health information, logs, and runtime inspection.
7. Compare containerized deployment with installing and operating the same application directly on a virtual machine.

## Required Architecture

Your system must contain two services:

1. **Application service** — implements the REST API.
2. **Redis service** — stores a persistent count of successful conversions.

Only the application service may publish a port to the host. Redis must remain reachable only through the private Compose network.

The application must locate Redis through runtime configuration. Do not hard-code a container IP address. A typical configuration would use a variable such as:

```text
REDIS_HOST=redis
```

where `redis` is the Compose service name.

## Required API

The OpenAPI document included in the starter repository defines the required
conversion API and is the authoritative contract for this project:

[`convert-api.openapi.yaml`](cs454-project1-starter/convert-api.openapi.yaml)

Where this document and the OpenAPI file disagree, the OpenAPI file wins.

### `GET /convert?lbs=<number>`

Convert pounds to kilograms.

Successful response:

```http
200 OK
Content-Type: application/json
```

```json
{
  "lbs": 150,
  "kg": 68.039,
  "formula": "kg = lbs * 0.45359237"
}
```

The kilogram value must be rounded to three decimal places.

Errors:

- `400 Bad Request` if the `lbs` query parameter is missing or is not a number.
- `422 Unprocessable Entity` if the supplied value is negative or non-finite.

Every successful conversion must increment the Redis key `conversions` by one.

### `GET /stats`

Return the number of successful conversions recorded in Redis.

Example:

```json
{
  "conversions": 17
}
```

Only successful `/convert` requests should increase the counter. Invalid requests must not increase it.

If the application cannot read the Redis-backed state, `/stats` may return
`503 Service Unavailable` rather than a misleading count. This is optional, but
if you implement it, say so in your README.

### `GET /health`

Return a simple application liveness response:

```json
{
  "status": "ok"
}
```

Your container health check should use this endpoint (or an equivalent application-local check documented in your README).

`/health` is an application liveness check. It should not fail merely because
Redis is unreachable -- a dependency outage surfaces on `/stats`, not here.
Otherwise a brief Redis restart would cause the runtime to report your
application container as unhealthy and potentially restart it.

## Container Image Requirements

Create an OCI-compatible `Dockerfile` that includes:

- A pinned base-image version. A major-version tag such as `node:22-alpine` is
  acceptable; a bare `node` or `node:latest` is not.
- A `.dockerignore` file.
- An appropriate `WORKDIR`.
- Explicit `COPY` and startup instructions.
- A non-root runtime user.
- No unnecessary development files in the final image.
- Runtime configuration supplied through environment variables rather than baked into the image.

The application port must be configurable through an environment variable such as `PORT`.

## Compose Requirements

Create a `compose.yaml` that defines:

- The application service.
- A Redis service using a pinned Redis image version.
- A private application network.
- A named volume for Redis persistence.
- Runtime environment configuration for the application.
- A published host port for the application only.
- A health check for the application.

Redis port `6379` must **not** be published to the host.

Your application must connect to Redis using the Compose service name rather than `localhost` or a hard-coded IP address.

## Required Operational Demonstration

You must demonstrate that the project can be operated from a clean checkout.

At minimum, demonstrate the following:

1. Build the application image.
2. Start the complete system with one Compose command.
3. Verify the application health endpoint.
4. Perform at least two successful conversions.
5. Verify `/stats` reports the expected count.
6. Inspect application logs.
7. Stop and remove the application containers **without deleting the named volume**.
8. Recreate the system.
9. Verify `/stats` still reports the previous count.
10. Cleanly remove all project resources, including the named volume, after the persistence demonstration.

Be able to explain the difference between operations such as:

```text
docker compose stop
docker compose down
docker compose down -v
```

(Podman equivalents are acceptable.)

## Required Test Cases

Your submission must show evidence that you tested at least the following cases:

| Request | Expected result |
| --- | --- |
| `/convert?lbs=0` | `200`, `kg = 0` |
| `/convert?lbs=150` | `200`, `kg = 68.039` |
| `/convert?lbs=0.1` | `200`, `kg = 0.045` |
| `/convert` | `400` |
| `/convert?lbs=abc` | `400` |
| `/convert?lbs=-5` | `422` |
| `/stats` after successful conversions | Correct persistent count |
| `/health` | `200`, healthy response |

You may provide an automated test script or clearly documented `curl` commands and captured output.

## Deliverables

Submit a repository containing:

- Application source code.
- `Dockerfile`.
- `.dockerignore`.
- `compose.yaml`.
- `README.md`.
- Test script or documented test commands.
- Screenshots or captured terminal output demonstrating the required operational workflow.

### README Requirements

Your `README.md` should include:

1. Prerequisites.
2. How to build and start the complete application.
3. How to test each endpoint.
4. How to view logs and inspect running services.
5. How to stop and clean up the application.
6. A short **Design Decisions** section explaining:
   - how the application locates Redis;
   - why Redis is not exposed to the host;
   - why the Redis volume is separate from the Redis container;
   - one benefit and one limitation of this containerized design compared with installing both services directly on a VM.

A separate `DESIGN.md` is not required for Project 1.

## Graduate Extension — CS 554

Graduate students must additionally:

1. Configure a reasonable service restart policy and explain when it applies.
2. Discuss one failure scenario involving the application/Redis dependency and explain how the current design behaves.
3. In the README Design Decisions section, provide a more detailed comparison of this Compose architecture with deploying both services directly on a single virtual machine, including at least two tradeoffs.

## Grading Rubric — 100 Points

| Category | Points |
| --- | ---: |
| REST API correctness and required test cases | 15 |
| Dockerfile / image quality | 15 |
| Compose architecture and service networking | 20 |
| Redis integration and persistent state | 15 |
| Runtime configuration and health check | 10 |
| Security: non-root application and minimal port exposure | 10 |
| Operational demonstration, logs, and cleanup | 10 |
| Documentation and reproducibility | 5 |

Graduate requirements are evaluated within the relevant categories above.

## Submission Checklist

Before submitting, verify that:

- [ ] A clean checkout can be built and started using the documented commands.
- [ ] `/convert` follows the required API behavior.
- [ ] Successful conversions increment Redis-backed state.
- [ ] Invalid conversions do not increment the counter.
- [ ] `/stats` returns the persistent conversion count.
- [ ] `/health` reports application health.
- [ ] Redis is not exposed to the host.
- [ ] The application runs as a non-root user.
- [ ] Redis state survives container recreation.
- [ ] Your README contains all required setup, test, cleanup, and design information.
