# Exercise 02 — The Same Service in a Virtual Machine

## Goal

Run the same service from Exercise 01 inside a local Ubuntu virtual machine and compare a **process**, a **container**, and a **VM** using something students can see and inspect.

The point is not to become a Multipass expert. The point is to answer:

> What does a VM give us that a container does not, and what does it cost us?

No cloud account is required.

## Prerequisites

- [Multipass](https://canonical.com/multipass)
- The repository cloned locally
- `curl`

> Instructor note: Multipass is convenient because it gives Linux, macOS, and Windows users a similar command-line experience. A VirtualBox or libvirt VM works just as well conceptually.

## 1. Create an Ubuntu VM

From the repository root:

```bash
multipass launch 24.04 \
  --name cs454-vm \
  --cpus 2 \
  --memory 2G \
  --disk 8G
```

Inspect it:

```bash
multipass list
multipass info cs454-vm
```

### Questions

- What resources did we allocate before an application even existed?
- Does the VM have its own IP address?
- Does it have its own kernel-visible operating-system environment?
- How is this different from `docker ps`?

## 2. Enter the VM

```bash
multipass shell cs454-vm
```

Inside the VM:

```bash
hostname
uname -a
ip addr
ps aux | head
free -h
df -h
```

Exit with:

```bash
exit
```

The important observation is that we did not merely isolate one process. We created another machine abstraction with its own operating-system environment.

## 3. Copy the Exercise 01 application into the VM

From the host, at the repository root:

```bash
multipass transfer \
  exercise-01-process-to-container/app.js \
  cs454-vm:/home/ubuntu/app.js
```

Install Node.js inside the VM:

```bash
multipass exec cs454-vm -- sudo apt-get update
multipass exec cs454-vm -- sudo apt-get install -y nodejs
```

Now enter the VM again:

```bash
multipass shell cs454-vm
```

Run the service:

```bash
SERVICE_NAME=vm-demo \
MESSAGE="Hello from a virtual machine" \
node app.js
```

Leave that terminal running.

## 4. Call the service from the host

In another host terminal, find the VM address:

```bash
multipass info cs454-vm
```

Then use the VM's IPv4 address:

```bash
curl http://VM_IP_ADDRESS:3000
```

Look at `hostname` in the response.

Compare it with Exercise 01 when the application ran:

1. directly on the host;
2. inside Docker;
3. inside the Ubuntu VM.

## 5. Stop and start the machine

Stop it:

```bash
multipass stop cs454-vm
```

Try the request again. It should fail because the entire machine is stopped.

Start the VM again:

```bash
multipass start cs454-vm
multipass shell cs454-vm
```

The application file is still there because the VM has a persistent virtual disk, but the application process is not automatically running.

### Discussion

This gives us three separate lifecycle questions:

- Is the **machine** running?
- Is the **operating system** running correctly?
- Is the **application process** running?

That extra layer is both useful and costly.

## 6. Recreate it using cloud-init

Manually configuring a VM works once. Cloud computing becomes much more interesting when machines can configure themselves.

Delete the original VM:

```bash
multipass delete --purge cs454-vm
```

From this exercise directory, create a new one using the supplied cloud-init file:

```bash
multipass launch 24.04 \
  --name cs454-vm \
  --cpus 2 \
  --memory 2G \
  --disk 8G \
  --cloud-init cloud-init.yaml
```

Wait for initialization to complete:

```bash
multipass exec cs454-vm -- cloud-init status --wait
```

Get the VM address:

```bash
multipass info cs454-vm
```

Then:

```bash
curl http://VM_IP_ADDRESS:3000
```

This time the application was installed and started by machine configuration rather than by an administrator typing commands interactively.

That is an important bridge to EC2 user data, Azure VM cloud-init, launch templates, autoscaling groups, and infrastructure as code later in the course.

## 7. Compare the abstractions

| Property | Host process | Docker container | VM |
| --- | --- | --- | --- |
| Separate application process | Yes | Yes | Yes |
| Filesystem isolation | Little/none | Yes | Yes |
| Own network identity | Usually no | Virtualized | Virtualized |
| Separate userspace | No | Yes | Yes |
| Separate guest OS | No | No | Yes |
| Startup overhead | Very low | Low | Higher |
| Image contains a whole guest OS | No | No | Effectively yes |
| Typical density | Highest | High | Lower |

## 8. Cleanup

```bash
multipass delete --purge cs454-vm
```

## Takeaway

A public-cloud VM is not mysterious. It is the same basic machine abstraction we just created locally, plus provider APIs, remote hardware, networking, storage, identity, metering, and managed automation.

When students eventually launch an EC2 instance or Azure VM, the important idea should already be familiar.