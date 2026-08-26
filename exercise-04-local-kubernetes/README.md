# Exercise 04 — From Containers to Orchestration with Local Kubernetes

## Goal

Take the service from the earlier exercises and run multiple disposable instances behind a stable Kubernetes Service.

The central question is:

> If application instances are disposable and their addresses change, how do we keep the application reachable and at the desired scale?

This exercise uses **k3d**, which runs a lightweight k3s Kubernetes cluster inside Docker.

## Prerequisites

- Docker
- `kubectl`
- `k3d`
- `curl`

No AWS or Azure account is required.

## 1. Build the application image

From this directory:

```bash
docker build -t cs454-k8s-demo:1.0 .
```

## 2. Create a local Kubernetes cluster

```bash
k3d cluster create cs454 \
  --servers 1 \
  --agents 2 \
  -p "8080:80@loadbalancer"
```

Check the cluster:

```bash
kubectl get nodes -o wide
```

### Questions

- How many Kubernetes nodes do we have?
- Are these application containers?
- What is the difference between a node and a pod?

## 3. Import the local image

The image exists in the host Docker image store, but the k3d nodes need access to it.

```bash
k3d image import cs454-k8s-demo:1.0 -c cs454
```

This is a useful local equivalent of the container-registry problem we will solve later in the cloud.

## 4. Deploy the application

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
```

Inspect what Kubernetes created:

```bash
kubectl get deployments
kubectl get pods -o wide
kubectl get services
kubectl get ingress
```

Now call the application:

```bash
curl http://localhost:8080
```

Try it repeatedly:

```bash
for i in {1..10}; do curl -s http://localhost:8080 | grep hostname; done
```

You should see requests reach different pod hostnames over repeated calls.

## 5. Compare a Pod with a Deployment

List the pods:

```bash
kubectl get pods
```

The `deployment.yaml` asks Kubernetes for three replicas.

```yaml
replicas: 3
```

The important distinction is:

- a **Pod** is a running workload instance;
- a **Deployment** declares the desired state for a set of interchangeable pods.

The Deployment does not merely start three processes. It continually tries to keep three matching pods running.

## 6. Kill one

Pick a pod name from:

```bash
kubectl get pods
```

Delete it:

```bash
kubectl delete pod POD_NAME
```

Immediately watch:

```bash
kubectl get pods -w
```

Kubernetes creates a replacement because the Deployment still says:

```text
replicas: 3
```

### Discussion

This is a major step from the earlier Docker exercise.

With Docker we said:

> Start this container.

With Kubernetes we say:

> I want three healthy instances of this application to exist.

That is **declarative desired state**.

## 7. Scale the application

```bash
kubectl scale deployment cs454-demo --replicas=5
kubectl get pods
```

Then scale down:

```bash
kubectl scale deployment cs454-demo --replicas=2
kubectl get pods
```

### Question

Which individual containers did you tell Kubernetes to create or delete?

Answer: none. You changed the desired number of replicas and let the controller reconcile reality with that desired state.

## 8. Service discovery and stable addresses

Pods have addresses that can disappear when pods are replaced.

Inspect them:

```bash
kubectl get pods -o wide
```

Now inspect the Service:

```bash
kubectl get service cs454-demo
```

The Service gives clients a stable logical destination even though the backing pods are replaceable.

This solves the problem intentionally left hanging at the end of Exercise 03.

## 9. Change configuration without rebuilding the image

Edit `deployment.yaml` and change the `MESSAGE` environment variable, for example:

```yaml
- name: MESSAGE
  value: "Hello from version two"
```

Then apply it:

```bash
kubectl apply -f deployment.yaml
kubectl rollout status deployment/cs454-demo
```

Call the application again:

```bash
curl http://localhost:8080
```

Kubernetes performs a rolling replacement of the pods to move from the old desired state to the new one.

Inspect rollout history:

```bash
kubectl rollout history deployment/cs454-demo
```

## 10. Watch Kubernetes reconcile state

Open one terminal:

```bash
kubectl get pods -w
```

In another:

```bash
kubectl scale deployment cs454-demo --replicas=4
```

Then:

```bash
kubectl scale deployment cs454-demo --replicas=2
```

Seeing the reconciliation happen live is more important than memorizing Kubernetes terminology.

## 11. Architecture

```text
                    localhost:8080
                           |
                           v
                 +-------------------+
                 | k3d load balancer |
                 +---------+---------+
                           |
                           v
                    +-------------+
                    |   Ingress   |
                    +------+------+ 
                           |
                           v
                    +-------------+
                    |   Service   |  stable logical address
                    +------+------+ 
                           |
                +----------+----------+
                |          |          |
                v          v          v
             +-----+    +-----+    +-----+
             | Pod |    | Pod |    | Pod |   disposable instances
             +-----+    +-----+    +-----+
                  controlled by Deployment
```

## 12. Cleanup

```bash
k3d cluster delete cs454
```

## Takeaway

Kubernetes is not fundamentally about YAML. It is an answer to operational problems we created ourselves by making application instances disposable and scalable:

- maintaining desired instance counts;
- replacing failed instances;
- service discovery;
- stable addressing;
- distributing requests;
- rolling changes;
- separating desired configuration from individual machines.

Later, EKS, AKS, and other managed Kubernetes offerings mostly move responsibility for parts of this cluster off our laptop and onto a cloud provider.