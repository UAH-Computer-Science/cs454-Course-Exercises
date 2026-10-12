# Optional: Build Your Own OpenStack Lab with DevStack

> **Independent exploration — not required, not graded, and no submission.**
>
> Exercise 05 uses the course's OpenStack environment. You **do not** need to install OpenStack to complete Exercise 05. This guide is for students who want to run their own miniature IaaS cloud and experiment beyond class.

## What you will build

A dedicated Ubuntu Server VM on your own x86-64 computer, running [DevStack](https://docs.openstack.org/devstack/latest/). You can use Horizon in a browser and the OpenStack CLI to explore compute, images, networks, projects, and instances.

DevStack is a **development/test deployment**, not a production OpenStack installation. It modifies the guest OS extensively. **Never install it directly on your everyday workstation.** Take a VM snapshot after installing Ubuntu so you can start over easily.

## 1. Prepare the host computer

Recommended (not minimum) resources:

| Component | Recommendation |
| --- | --- |
| Host | x86-64 Linux or Windows desktop with virtualization enabled |
| Host RAM | 32 GB |
| Guest OS | Ubuntu Server **24.04 LTS**, x86-64 |
| Guest RAM | 12–16 GB |
| Guest CPU | 4+ vCPUs |
| Guest disk | 80 GB dynamically allocated |
| Virtualization | Nested virtualization, if supported |

Download [VirtualBox](https://www.virtualbox.org/) and [Ubuntu Server](https://ubuntu.com/download/server). KVM/QEMU with virt-manager is also a good choice for Linux hosts.

**Nested virtualization matters:** running an OpenStack VM *inside* this guest requires access to hardware virtualization (/dev/kvm), or slower software emulation. VirtualBox support varies by host/CPU; Apple Silicon Macs are **not** covered by this x86-64 walkthrough. On a smaller machine, use the instructor's OpenStack instead.

## 2. Create and install an Ubuntu VM

1. In VirtualBox, create a new **Ubuntu (64-bit)** VM using the downloaded ISO.
2. Give it approximately **4 vCPUs, 12–16 GB RAM, and an 80 GB disk**.
3. Enable **nested virtualization** if your hypervisor and host support it.
4. Use **bridged networking** on a trusted local network if possible. This gives the VM its own LAN IP so your host browser can access Horizon. Alternatively use NAT with appropriate port forwarding. Avoid exposing this development environment to the public internet.
5. Install Ubuntu Server with a normal user that has sudo access. Select **OpenSSH Server** during setup if desired.
6. Once booted, update and install the basic tools:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl vim openssh-server
sudo reboot
```

After reboot, log in again. Check resources and networking:

```bash
free -h
df -h
lscpu
hostname -I
ls -l /dev/kvm
curl -I https://opendev.org
```

If `/dev/kvm` is missing, nested virtualization may be unavailable. DevStack may still work with emulation but booting nested instances will be slower. **Take a snapshot of the clean Ubuntu VM now** (preferably powered off).

## 3. Create the DevStack user

Use your **normal Ubuntu login**, not root, for these commands:

```bash
sudo useradd -s /bin/bash -d /opt/stack -m stack
sudo chmod 755 /opt/stack
echo 'stack ALL=(ALL) NOPASSWD: ALL' | sudo tee /etc/sudoers.d/stack
sudo chmod 440 /etc/sudoers.d/stack
sudo -u stack -i
```

Verify that `whoami` says `stack` and `pwd` says `/opt/stack`.

Passwordless sudo is used **only** inside this isolated, disposable lab VM. Never copy this setup onto a shared or production server.

## 4. Download and configure DevStack

While logged in as `stack`:

```bash
git clone https://opendev.org/openstack/devstack
cd devstack
nano local.conf
```

Paste the following **minimal** configuration and change the example password to a unique alphanumeric lab password:

```ini
[[local|localrc]]
ADMIN_PASSWORD=ChangeThisPassword123
DATABASE_PASSWORD=$ADMIN_PASSWORD
RABBIT_PASSWORD=$ADMIN_PASSWORD
SERVICE_PASSWORD=$ADMIN_PASSWORD
```

If the VM has multiple interfaces, or DevStack selects the wrong address, add `HOST_IP=YOUR_VM_LAN_IP` within the same section. Get the address from `hostname -I`. On a simple single-NIC VM, try without `HOST_IP` first.

Save and protect the file:

```bash
chmod 600 local.conf
```

For a disposable learning environment, these shared service passwords simplify setup. They are **not** production password-management practices.

## 5. Run the installation

Run this **as `stack`**, from `/opt/stack/devstack`:

```bash
./stack.sh
```

This downloads and configures OpenStack and its supporting services. The installation consumes substantial disk, memory, and network resources. Keep the VM console open; if you are using SSH, use a persistent session so disconnecting doesn't terminate installation.

A successful run prints a summary with the **Horizon URL** and service details. Record the URL.

## 6. Explore the environment

Open the Horizon URL from your host browser (usually `http://VM_IP/`). Log in with:

- **Domain:** `Default`
- **Username:** `admin`
- **Password:** the `ADMIN_PASSWORD` from `local.conf`

Explore Compute → Instances/Images/Flavors, Network → Networks/Subnets/Routers/Security Groups, and Identity → Projects/Users.

From a terminal inside the Ubuntu VM, as `stack`:

```bash
cd /opt/stack/devstack
source openrc admin admin

openstack service list
openstack compute service list
openstack hypervisor list
openstack image list
openstack flavor list
openstack network list
openstack subnet list
openstack router list
openstack region list
openstack server list
```

These commands help you see OpenStack as an **API-based IaaS control plane**, rather than just a collection of VMs.

### Optional stretch goal: launch an instance

If your hypervisor can run nested VMs, try launching a tiny **CirrOS** instance with Horizon, then inspect its status, assigned private IP, security group, and console log. You may need to configure a network, router, and key pair first. If you choose to access an instance from outside its private network, investigate **floating IPs**, routing, and ICMP/SSH security-group rules.

**Important networking distinction:** the Ubuntu *DevStack host* having a LAN IP does **not** mean that OpenStack instance floating IPs are automatically reachable from your laptop. DevStack's external network is virtual and may require host routes/NAT or other lab-specific configuration. Start by testing from the DevStack host. Do not expose the VM or its APIs to the public internet.

## 7. When you're finished

DevStack environments are intentionally disposable. You can shut down the Ubuntu VM when not exploring it. Services do not necessarily return to a fully working state automatically after reboot.

From the `devstack` directory:

```bash
./unstack.sh
```

stops DevStack-managed services. A subsequent `./stack.sh` is a setup/reconfiguration run, **not** a guarantee that previous instances and network configuration will be preserved. `./clean.sh` removes deployment components and should be used only when rebuilding.

For repeated experiments, a clean VM snapshot and rebuilding is often simpler than repairing a broken DevStack installation.

## Learn more

- [Official DevStack installation guide](https://docs.openstack.org/devstack/latest/)
- [OpenStack documentation](https://docs.openstack.org/)
- [Ubuntu Server documentation](https://ubuntu.com/server/docs)
- [Exercise 05 — OpenStack IaaS](README.md)

**Again: this is a voluntary extra challenge.** You can complete Exercise 05 using the class environment without installing any of this software.
