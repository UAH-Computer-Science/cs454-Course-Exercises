# Exercise 05 — Deploy the Same Service on OpenStack IaaS

## Goal

Take the same small HTTP service used in the earlier exercises and deploy it onto an **OpenStack virtual machine**.

The central question is:

> What changes when the VM is no longer something we create directly on our laptop, but a resource requested from a cloud control plane?

Earlier exercises introduced the pieces separately:

- Exercise 01: process and container
- Exercise 02: local VM and cloud-init
- Exercise 03: private service networking
- Exercise 04: orchestration and stable service access

This exercise brings many of those ideas together using an Infrastructure-as-a-Service cloud.

See [`OPENSTACK-SETTINGS.md`](OPENSTACK-SETTINGS.md) for the class environment and the OpenStack-to-AWS vocabulary mapping.

> **Want to run OpenStack on your own hardware?** See [Optional: Build Your Own OpenStack Lab with DevStack](OPTIONAL-LOCAL-DEVSTACK.md). This is entirely voluntary, ungraded, and **not a prerequisite** for this exercise; use the class OpenStack environment for the assigned work.

## Prerequisites

- access to the class OpenStack environment;
- OpenStack CLI installed;
- a working cloud profile named `devstack`;
- the instructor-provided Ubuntu 24.04 cloud image named `ubuntu-24.04`;
- `curl`;
- an SSH public key if SSH access is desired.

Verify access:

```bash
openstack --os-cloud devstack server list
openstack --os-cloud devstack network list
openstack --os-cloud devstack image list
```

## 1. Inspect the cloud before creating anything

Run:

```bash
openstack --os-cloud devstack endpoint list
openstack --os-cloud devstack network list
openstack --os-cloud devstack subnet list
openstack --os-cloud devstack router list
openstack --os-cloud devstack flavor list
openstack --os-cloud devstack image list
```

### Questions

1. Which of these resources describe **compute**?
2. Which describe **networking**?
3. Which resources belong to your project and which are supplied by the cloud?
4. Which values are names chosen by people, and which are provider-assigned IDs?

Do not skip this step. Public clouds expose the same general categories, although the product names differ.

## 2. Create a key pair

If you already have an SSH public key:

```bash
openstack --os-cloud devstack keypair create   --public-key ~/.ssh/id_ed25519.pub   cs454-key
```

Verify it:

```bash
openstack --os-cloud devstack keypair list
```

A cloud key pair does not create SSH itself. It tells the cloud which public key should be installed into a newly created VM.

## 3. Allow the application through the virtual firewall

The service listens on TCP port 3000.

Add a security-group rule:

```bash
openstack --os-cloud devstack security group rule create   --protocol tcp   --dst-port 3000   default
```

For SSH access, also allow port 22 if the class environment does not already permit it:

```bash
openstack --os-cloud devstack security group rule create   --protocol tcp   --dst-port 22   default
```

Inspect the rules:

```bash
openstack --os-cloud devstack security group rule list default
```

### Question

Why can an application be running correctly inside the VM and still be unreachable from a client?

This is the same distinction we saw earlier between **process health** and **service reachability**, now with a cloud firewall in the path.

## 4. Create the VM

The supplied `cloud-init.yaml` installs Node.js, writes the same simple HTTP service used earlier, creates a systemd unit, and starts the application automatically.

Create the instance:

```bash
openstack --os-cloud devstack server create   --flavor m1.small   --image ubuntu-24.04   --network private   --key-name cs454-key   --user-data cloud-init.yaml   cs454-openstack
```

Watch it:

```bash
openstack --os-cloud devstack server list
```

Wait until the server reaches `ACTIVE`.

Inspect it:

```bash
openstack --os-cloud devstack server show cs454-openstack
```

### Questions

- Which flavor was requested?
- Which image was used?
- Which network contains the instance?
- What fixed/private IP address did OpenStack assign?
- Did we tell OpenStack which physical computer should run the VM?

That last question is one of the important differences between using a hypervisor directly and using an IaaS control plane.

## 5. Wait for cloud-init

An `ACTIVE` VM means the compute service has successfully created and started the machine. It does **not** guarantee that the guest has finished its boot-time configuration.

If using SSH, connect to the private address from a machine that can reach the private network and run:

```bash
cloud-init status --wait
systemctl status cs454-demo
```

Alternatively, inspect the console log:

```bash
openstack --os-cloud devstack console log show cs454-openstack
```

### Discussion

There are now several independent lifecycle states:

- the cloud resource exists;
- the VM is powered on;
- the guest operating system has booted;
- cloud-init has finished;
- the application service is running;
- the network/security configuration allows clients to reach it.

“Server is ACTIVE” is therefore not the same as “application is ready.”

## 6. Allocate a floating IP

List available external networks:

```bash
openstack --os-cloud devstack network list --external
```

Allocate an address from `public`:

```bash
openstack --os-cloud devstack floating ip create public
```

Note the newly allocated floating IP address.

Attach it:

```bash
openstack --os-cloud devstack server add floating ip   cs454-openstack FLOATING_IP
```

Inspect the server again:

```bash
openstack --os-cloud devstack server show cs454-openstack
```

Notice that the VM still has its private address. The floating IP is an additional mapping used to reach it externally.

## 7. Call the service

From a machine that can reach the floating-IP network:

```bash
curl http://FLOATING_IP:3000
```

You should see JSON containing values such as:

```json
{
  "service": "cs454-openstack",
  "message": "Hello from an OpenStack instance",
  "hostname": "...",
  "pid": 1234,
  "requestCount": 1
}
```

Call it several times:

```bash
curl http://FLOATING_IP:3000
curl http://FLOATING_IP:3000
curl http://FLOATING_IP:3000
```

The application is still the same basic service from Exercise 01. What changed is everything around it.

## 8. Stop and start the cloud instance

Stop it:

```bash
openstack --os-cloud devstack server stop cs454-openstack
```

Check:

```bash
openstack --os-cloud devstack server list
```

Try the HTTP request again.

Start the VM:

```bash
openstack --os-cloud devstack server start cs454-openstack
```

Wait for it to return to `ACTIVE`, then call the service again.

### Questions

- Did the VM's private address change?
- Did the floating IP change?
- What happened to the application's in-memory `requestCount`?
- Which parts of the system survived the stop/start cycle?

## 9. Delete and recreate the compute instance

Delete the server:

```bash
openstack --os-cloud devstack server delete cs454-openstack
```

The image, flavor, network, security group, key pair, and floating IP are separate cloud resources. The VM is only one resource assembled from them.

Recreate it with the same command from step 4.

This is the same disposable-compute idea seen with containers and Kubernetes, but at the virtual-machine/IaaS layer.

## 10. Compare local VM and cloud VM

| Question | Local VM (Exercise 02) | OpenStack VM |
| --- | --- | --- |
| Who chooses the physical host? | Usually you/hypervisor | Cloud scheduler |
| Machine template | Ubuntu image chosen locally | Cloud Image service |
| CPU/RAM sizing | VM command options | Flavor |
| Network | Local hypervisor network | Project network/subnet/router |
| Firewall | Host/guest configuration | Security Group |
| Public address | Local networking/NAT | Floating IP |
| Boot automation | cloud-init | cloud-init / user data |
| Resource identity | Local VM name | Name + provider UUID |
| API-controlled lifecycle | Limited/local | Yes |

## 11. Map the concepts to AWS

Do not memorize product names yet. Notice the categories.

| OpenStack | AWS |
| --- | --- |
| RegionOne | AWS Region |
| Project | Account / IAM ownership boundary |
| Image | AMI |
| Flavor | EC2 instance type |
| Nova server | EC2 instance |
| Private network | VPC |
| Subnet | VPC subnet |
| Router/external gateway | Route table + Internet Gateway relationship |
| Security Group | Security Group |
| Floating IP | Public/Elastic IPv4 address |
| Key pair | EC2 key pair |
| cloud-init user data | EC2 user data |
| Cinder volume | EBS volume |
| Glance | AMI/image catalog role |

The names differ. The underlying infrastructure questions do not.

## 12. Cleanup

Delete the VM:

```bash
openstack --os-cloud devstack server delete cs454-openstack
```

If you allocated a floating IP solely for this exercise:

```bash
openstack --os-cloud devstack floating ip list
openstack --os-cloud devstack floating ip delete FLOATING_IP
```

Optionally remove the key pair:

```bash
openstack --os-cloud devstack keypair delete cs454-key
```

Security-group rules are shared project configuration, so only remove them if instructed.

## Takeaway

Exercise 02 showed that a cloud VM is still fundamentally a virtual machine.

Exercise 05 shows what the **cloud control plane** adds around that VM:

- image catalogs;
- standardized instance sizing;
- API-driven lifecycle;
- scheduling;
- project isolation;
- virtual networks and subnets;
- routers;
- security groups;
- floating/public addresses;
- identity;
- resource IDs;
- automated boot configuration.

After the midterm, AWS will introduce different names and a much larger service catalog. The important goal is to recognize that many of the core infrastructure abstractions are already familiar.
