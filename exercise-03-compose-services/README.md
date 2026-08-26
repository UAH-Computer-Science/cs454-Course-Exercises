# Exercise 03 — Building a Small Service Architecture with Docker Compose

## Goal

Move from one isolated container to a small application made of multiple services.

Students will run:

- a public-facing API;
- a Redis data service;
- an internal worker-like service;
- a Docker-created private network.

The key question is:

> How do independently packaged services discover and communicate with one another?

No cloud account is required.

## Prerequisites

- Docker with Docker Compose
- `curl`

## 1. Start the application

From this directory:

```bash
docker compose up --build
```

In another terminal:

```bash
curl http://localhost:8080
```

You should see JSON showing the API hostname, request count, and a counter stored in Redis.

Try it several times:

```bash
curl http://localhost:8080
curl http://localhost:8080
curl http://localhost:8080
```

The `redisCount` value should increase.

## 2. Inspect the services

```bash
docker compose ps
```

Then:

```bash
docker network ls
```

Compose created a network for this application.

Inspect it:

```bash
docker network inspect exercise-03-compose-services_default
```

> The exact network name can vary if the directory/project name is different. Use `docker network ls` to find it.

### Questions

- Which container publishes a port to the host?
- Does Redis need a host port for the API to use it?
- How does the API know where `redis` is?
- Why is the hostname `redis` useful compared with hard-coding an IP address?

## 3. Talk to Redis from inside the network

Run the Redis CLI inside its container:

```bash
docker compose exec redis redis-cli GET requests
```

Now inspect name resolution from the API container:

```bash
docker compose exec api getent hosts redis
```

The application configuration says:

```text
REDIS_HOST=redis
```

`redis` is the **service name**, not an IP address. Docker's internal DNS resolves the service name to the current container address.

That pattern becomes extremely important later when we discuss Kubernetes Services and cloud service discovery.

## 4. Stop only the Redis service

```bash
docker compose stop redis
```

Now try:

```bash
curl http://localhost:8080
```

The API remains alive, but the Redis-dependent part of the request fails gracefully and reports an error.

### Discussion

This is a useful distinction:

> A healthy process is not necessarily a healthy application.

The API process can be running while one of its dependencies is unavailable.

Start Redis again:

```bash
docker compose start redis
```

Try the API again.

## 5. Replace a service

```bash
docker compose up -d --force-recreate api
```

Call it again:

```bash
curl http://localhost:8080
```

Notice that the API container identity and in-memory request count changed, but the Redis counter survived because Redis is a separate service with a named volume.

This demonstrates two important ideas:

- application instances can be disposable;
- state usually needs a deliberately different lifecycle.

## 6. Scale the API

The Compose file intentionally does **not** assign a fixed container name. That lets us create more than one API instance.

First stop the normal stack:

```bash
docker compose down
```

Then start Redis and three API instances without publishing the API directly:

```bash
docker compose -f compose.scale.yaml up --build -d --scale api=3
```

Inspect them:

```bash
docker compose -f compose.scale.yaml ps
```

This exercise does not yet put a load balancer in front of them. That is deliberate.

### Question

We can create three API instances. Now what new problem have we created?

Students should identify ideas such as:

- clients need a stable destination;
- requests must be distributed;
- instance addresses may change;
- health matters;
- adding instances is not useful unless traffic can reach them.

That leads naturally into orchestration and load balancing.

Clean up:

```bash
docker compose -f compose.scale.yaml down -v
```

## 7. Architecture

```text
Host
  |
  | localhost:8080
  v
+-------------------+
| API container     |
| SERVICE_NAME=api  |
+---------+---------+
          |
          | redis:6379
          v
+-------------------+
| Redis container   |
| persistent volume |
+-------------------+

Both containers communicate over a private Docker network.
```

## Takeaway

Docker alone taught us how to package and isolate one application. Compose begins to expose the problems that appear when an application becomes a **system of services**: discovery, dependencies, state, networking, lifecycle, and scaling.

Those problems are much closer to the heart of cloud computing than any particular provider console.