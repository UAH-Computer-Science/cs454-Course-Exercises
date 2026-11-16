# Exercise 06 — Infrastructure as Code with Terraform

**CS 454/554: Introduction to Cloud Computing**

Infrastructure should be described, reviewed, recreated, and removed with code. This exercise introduces Terraform using the **local Docker provider** so that no AWS account or cloud spending is required.

The examples support two course lessons, and they are **not** a completed solution to Project 3.

## Learning objectives

After this exercise, you should be able to:

1. Distinguish declarative infrastructure from manually issuing Docker commands.
2. Identify Terraform providers, resources, references, and state.
3. Use `terraform init`, `fmt`, `validate`, `plan`, `apply`, `show`, and `destroy`.
4. Explain why a Terraform plan is reviewed before applying changes.
5. Parameterize infrastructure with variables, and inspect outputs.
6. Describe how Terraform tracks resources and how state and configuration drift affect change management.

## Prerequisites

- A locally running Docker Engine or Docker Desktop installation
- Terraform CLI installed
- Internet access for the **first** provider download and NGINX image pull
- A terminal and `curl` (or a browser)

Check installations:

```sh
docker info
terraform version
```

**No cloud account is necessary.** The demonstration manages resources on your own Docker host.

## Lesson 1: the Terraform lifecycle

```sh
cd exercise-06-terraform-iac/lesson-1
terraform init
terraform fmt -check
terraform validate
terraform plan
terraform apply
curl -I http://localhost:8080
terraform state list
terraform show
terraform destroy
```

When Terraform prompts for approval, inspect the plan before typing `yes`. Observe that the configuration creates a Docker image, a custom network, and an NGINX container. Do not confuse the `.tf` files (desired configuration) with `terraform.tfstate` (the record of managed infrastructure).

**Class discussion:** How does `terraform plan` differ from running `docker run` directly? Why should a team review a plan before `apply`?

## Lesson 2: variables, outputs, and modifications

Use a **separate directory** so the demonstrations maintain separate state files. Destroy Lesson 1 before starting Lesson 2, since the default container/network names and port overlap.

```sh
cd ../lesson-2
terraform init
terraform fmt -check
terraform validate
terraform plan
terraform apply
terraform output url
curl -I http://localhost:8080
```

Next, change the configuration using a variable file:

```sh
cp dev.tfvars.example dev.tfvars
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars
terraform output url
curl -I http://localhost:8081
terraform destroy -var-file=dev.tfvars
```

A changed `container_name` or port may require replacing the container. Observe what the plan proposes and why.

**Discussion:** Which resources change in the plan? Which stay unchanged? How does Terraform determine dependencies between a Docker image, network, and container?

## State and collaboration

- The `.tf` files specify the desired infrastructure.
- `terraform.tfstate` maps Terraform resource addresses to actual resources.
- Running `terraform plan` compares configuration, state, and provider observations.
- A teammate editing infrastructure without Terraform can introduce **drift**.
- State files may contain sensitive values. Do not commit state, credentials, local `.terraform/` directories, or secret variable files.
- After `terraform init`, commit the generated `.terraform.lock.hcl` file if you are preparing a reproducible project repository.

For more advanced study, refactor repeated resources into modules and consider remote state with locking and controlled access.

## Cleanup

Use `terraform destroy` from the **same lesson directory** where the matching `apply` was run. Do not simply delete Terraform state while resources still exist.

If an interrupted demonstration leaves Docker resources behind, investigate them before manually removing anything.

## Constraints and verification

This is a teaching demonstration, not a production deployment. The code was checked against the Docker provider 4.6.0 resource documentation, but a live `terraform init/apply` against Docker has **not** yet been run in the authoring environment. The examples require Docker access, provider/image downloads, and an unoccupied host port.

- [Docker provider documentation](https://registry.terraform.io/providers/kreuzwerker/docker/latest/docs)
- [Terraform CLI documentation](https://developer.hashicorp.com/terraform/cli)
