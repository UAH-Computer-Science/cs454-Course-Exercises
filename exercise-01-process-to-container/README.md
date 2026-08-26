# Exercise 01 — From Process to Container

## Goal

Run the same tiny HTTP service several different ways and use it to answer a basic cloud-computing question:

> What changes when an application moves from "a program running on my computer" to a disposable, isolated service?

This exercise intentionally stays local. No AWS or Azure account is required.

## Prerequisites

- Node.js 20+ (for the first step)
- Docker Engine or Docker Desktop
- `curl` or a web browser

## 1. Run it as a normal process

```bash
node app.js
```

In another terminal:

```bash
curl http://localhost:3000
```

Look at the returned JSON, especially:

- `hostname`
- `pid`
- `requestCount`
- `service`
- `message`

Try several requests. The request count increases because the process remains alive and keeps state in memory.

### Questions

1. What machine owns this process?
2. What happens to `requestCount` if you stop and restart it?
3. What dependencies must exist on the host for this command to work?

## 2. Configure it without changing code

Stop the process and run:

```bash
SERVICE_NAME=local MESSAGE="Configured from the shell" node app.js
```

Then:

```bash
curl http://localhost:3000
```

The code did not change; the deployment configuration did.

That separation becomes increasingly important in cloud systems.

## 3. Build an image

```bash
docker build -t cs454-demo .
```

Inspect what Docker created:

```bash
docker image ls cs454-demo
```

Important distinction:

- **Image** — packaged template
- **Container** — running instance of that template

## 4. Run the container

```bash
docker run --rm --name cs454-one -p 3000:3000 cs454-demo
```

Then:

```bash
curl http://localhost:3000
```

Compare the `hostname` and `pid` with the native run.

### Discussion

The application has not become a VM. It is still a process, but Docker gives it an isolated filesystem, network namespace, process namespace, configuration boundary, and packaged runtime environment.

## 5. Run two instances of the same image

Terminal 1:

```bash
docker run --rm --name blue -e SERVICE_NAME=blue -e MESSAGE="I am blue" -p 3001:3000 cs454-demo
```

Terminal 2:

```bash
docker run --rm --name green -e SERVICE_NAME=green -e MESSAGE="I am green" -p 3002:3000 cs454-demo
```

Try:

```bash
curl http://localhost:3001
curl http://localhost:3002
```

Notice that both containers use port `3000` internally. The host maps them to different external ports.

This is a useful first glimpse of the distinction between a service's internal network identity and how clients reach it.

## 6. Make infrastructure disposable

List the running containers:

```bash
docker ps
```

Stop one:

```bash
docker stop blue
```

Start a replacement:

```bash
docker run --rm --name blue2 -e SERVICE_NAME=blue -e MESSAGE="Replacement blue" -p 3001:3000 cs454-demo
```

Request it again:

```bash
curl http://localhost:3001
```

Questions:

1. Did we repair the old container or replace it?
2. What happened to its in-memory `requestCount`?
3. If that counter mattered, where should its state live instead?

That last question leads naturally to databases, volumes, caches, and managed stateful services.

## 7. Describe both services with Docker Compose

Stop any manually started copies, then run:

```bash
docker compose up --build
```

In another terminal:

```bash
curl http://localhost:3001
curl http://localhost:3002
```

Now the desired local environment is described in `compose.yaml` instead of being reconstructed from remembered command-line options.

Stop everything with:

```bash
docker compose down
```

## 8. Containers vs. virtual machines

A useful classroom comparison:

| Property | Normal process | Container | Virtual machine |
| --- | --- | --- | --- |
| Own application process | Yes | Yes | Yes |
| Packaged application dependencies | Usually no | Yes | Yes |
| Separate filesystem view | Usually no | Yes | Yes |
| Separate kernel | No | No | Yes |
| Full guest OS | No | No | Yes |
| Startup cost | Very low | Low | Higher |
| Isolation | Low | Medium/high | High |

The VM is still worth demonstrating in CS454 because cloud IaaS is built heavily around VMs. But Docker makes a better first hands-on exercise: students can create, destroy, duplicate, configure, and network compute instances in seconds on one classroom machine.

## Instructor demo sequence

A compact live sequence is:

```bash
node app.js
curl localhost:3000

SERVICE_NAME=local MESSAGE="configuration is deployment" node app.js

docker build -t cs454-demo .
docker run --rm -p 3000:3000 cs454-demo

docker run --rm -e SERVICE_NAME=blue -p 3001:3000 cs454-demo
docker run --rm -e SERVICE_NAME=green -p 3002:3000 cs454-demo

docker compose up --build
docker compose down
```

Do not rush the commands. The useful part is asking students what changed after each step.

## Takeaway

Cloud computing is not fundamentally "using AWS." The core ideas are older and broader:

- package compute
- isolate workloads
- configure deployments
- expose services over networks
- create multiple instances
- replace failed instances
- separate disposable compute from persistent state
- describe infrastructure repeatably

Later, a cloud provider supplies these capabilities across somebody else's datacenter and adds APIs, managed services, elasticity, identity, billing, and orchestration.
