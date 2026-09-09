# CS 454/554 — Project 1 Starter

A minimal, known-working Node.js/Express process. It is the *starting point* for
**Project 1 — Portable Containerized REST Service**, not a solution.

Everything here exists so you don't spend your time on npm initialization,
Express boilerplate, or signal handling. The graded work — the image, Compose,
Redis, persistence, health, and security decisions — is yours to design.

## What you get

- An Express app that installs and runs.
- `PORT` read from the environment, defaulting to `3000` locally.
- `GET /` returning a simple JSON message.
- Request logging to stdout.
- SIGINT/SIGTERM handlers so the process stops cleanly under a container runtime.
- A `test/smoke.sh` script showing the `curl` pattern for checking an endpoint.
- `convert-api.openapi.yaml`, the OpenAPI 3.1 contract your API must satisfy.

## What you must add

Read the project description for the authoritative requirements. In short:

| Area | What's missing |
| --- | --- |
| API | `GET /convert?lbs=<number>`, `GET /stats`, `GET /health` |
| State | Redis client configuration and the `conversions` counter |
| Image | `Dockerfile` (pinned base image, `WORKDIR`, non-root user), `.dockerignore` |
| Compose | `compose.yaml` with app + Redis, a private network, a named volume, env config, one published port, an app health check |
| Docs | A README covering prerequisites, build/start, testing, logs, cleanup, and **Design Decisions** |
| Evidence | Test output plus captured terminal output for the operational demonstration |

The `TODO (Project 1)` comments in `src/server.js` and `test/smoke.sh` mark where
each piece goes.

## Using the course exercises as reference

You already have working examples in this repository, and you are welcome to
read them:

- [`exercise-01-process-to-container/Dockerfile`](../exercise-01-process-to-container/Dockerfile)
  -- a minimal Node image.
- [`exercise-03-compose-services/compose.yaml`](../exercise-03-compose-services/compose.yaml)
  -- an app plus Redis with a named volume.

They are starting points, not answers. Copying either one verbatim will lose
points, because neither meets this project's requirements. Compared with what
Project 1 asks for, those examples are missing:

- a non-root runtime user;
- a `.dockerignore`;
- any dependency-installation step (both exercise apps have zero dependencies --
  this starter uses Express, so your image must install from `package-lock.json`);
- a health check on the *application* (exercise-03 health-checks Redis instead);
- an explicitly declared private network (exercise-03 relies on Compose's
  implicit default).

Read them to see the shape of a Dockerfile and a Compose file, then work out the
above yourself. Be ready to explain every line you keep.

## Prerequisites

- Node.js 20 or newer (for running the app directly)
- `curl`
- Docker or Podman with Compose support (for the containerized work)

## Run it locally

```bash
npm install
npm start
```

The service listens on `http://localhost:3000` by default. To use a different
port:

```bash
PORT=8080 npm start
```

## Verify it

In a second terminal:

```bash
curl -s http://localhost:3000/
```

```json
{
  "service": "cs454-project1",
  "message": "CS 454/554 Project 1 starter is running."
}
```

Or run the smoke script:

```bash
./test/smoke.sh
# or against a non-default port:
BASE_URL=http://localhost:8080 ./test/smoke.sh
```

Stop the process with `Ctrl-C`; you should see the shutdown log lines.

## Layout

```text
.
├── README.md
├── convert-api.openapi.yaml   # authoritative API contract -- build to this
├── package.json
├── src/
│   └── server.js
└── test/
    └── smoke.sh
```

## A note on `node_modules`

`npm install` creates `node_modules/` here, and `.gitignore` keeps it out of git.
When you write your `.dockerignore`, keep it out of the build context too — the
dependencies belong in the image because your `Dockerfile` installed them there,
not because your host directory was copied in.
