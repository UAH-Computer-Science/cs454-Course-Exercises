# OpenStack Class Environment

This file records the **logical cloud settings** used for Exercise 05.

The important goal is not to memorize OpenStack names. It is to recognize the same categories again when we move to AWS after the midterm.

## Class settings

| Concept | OpenStack value | What it means | AWS concept you will see later |
| --- | --- | --- | --- |
| Cloud profile | `devstack` | Credentials + endpoint configuration used by the CLI | AWS CLI profile / credentials |
| Region | `RegionOne` | Geographic/logical service region | AWS Region, e.g. `us-east-1` |
| Project | Your assigned OpenStack project | Administrative/identity boundary for resources | AWS account + IAM/resource ownership |
| Image | `ubuntu-24.04` | Bootable machine image | AMI |
| Flavor | `m1.small` | CPU/RAM/disk sizing template | EC2 instance type |
| Private network | `private` | Tenant network for instances | VPC |
| Private subnet | `private-subnet` | Address range inside the private network | VPC subnet |
| Router | `router1` | Connects the private network to the external network | VPC router + route table / Internet Gateway relationship |
| External network | `public` | Network from which public addresses are allocated | Public network / Internet-facing address space |
| Floating IP | allocated from `public` | Public address mapped to an instance port | Elastic/Public IPv4 address |
| Security group | `default` plus exercise rules | Stateful virtual firewall | EC2 Security Group |
| Key pair | student-created | SSH public key registered with compute service | EC2 key pair |
| User data | `cloud-init.yaml` | Boot-time machine configuration | EC2 user data / cloud-init |

## Discover, do not memorize, resource IDs

OpenStack resource UUIDs can change when the lab is rebuilt. Use names for the class instructions and discover the current IDs when needed.

Examples:

```bash
openstack --os-cloud devstack network list
openstack --os-cloud devstack subnet list
openstack --os-cloud devstack router list
openstack --os-cloud devstack image list
openstack --os-cloud devstack flavor list
```

The distinction between a **human-friendly name** and a **provider-assigned resource ID** will appear again in AWS.

## Expected network model

```text
Internet / external connectivity
          |
          v
+-------------------+
| public network    |
| floating IP pool  |
+---------+---------+
          |
          v
+-------------------+
| router1           |
+---------+---------+
          |
          v
+-------------------+
| private network   |
| private-subnet    |
+---------+---------+
          |
          v
+-------------------+
| Nova VM instance  |
| fixed/private IP  |
+-------------------+
```

The instance keeps its private address. A floating IP provides a separate externally reachable address.

That separation is intentional and maps closely to the private/public addressing model used by public clouds.

## Verify the current class environment

```bash
openstack --os-cloud devstack endpoint list
openstack --os-cloud devstack network list
openstack --os-cloud devstack subnet list
openstack --os-cloud devstack router list
openstack --os-cloud devstack image list
openstack --os-cloud devstack flavor list
```

If the values shown by the instructor differ from this file, use the instructor-provided values. The **concepts** should remain the same even when the concrete names change.
