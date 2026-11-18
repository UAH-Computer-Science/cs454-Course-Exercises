# CS 454/554 Project 3 — Student Starter Package

**Status:** starter scaffold, not a working Terraform solution. The assignment is in the course Assessment Library. Read that document for the full graded requirements.

## What is supplied

- `app/app.js`: unchanged HTTP/Redis service from Exercise 03.
- `app/Dockerfile`: builds a local application image. No npm dependencies.
- `versions.tf`: pinned Docker Terraform provider and CLI baseline.
- `variables.tf`: example typed input variables.
- `main.tf`: required infrastructure described as TODOs; students implement it.
- `outputs.tf`: output TODO.
- `terraform.tfvars.example`: sample nonsecret inputs.
- `.gitignore`: excludes Terraform state, cached providers, and private variable files.

**There is deliberately no complete Terraform implementation in this package.**

## Requirements

- Local Docker installation and permissions to run containers
- Terraform CLI
- Internet for first provider and image download
- `curl` or a web browser
- No AWS/Azure account, billing credentials, or paid service

## Step 1: Build the provided application image

From the starter directory:

```bash
docker build -t cs454-project3-api:1.0 ./app
```

Check that the image exists:

```bash
docker image inspect cs454-project3-api:1.0
```

Do **not** replace this familiar application with a new web service. The assessed work is infrastructure management.

## Step 2: Implement your Terraform infrastructure

Complete the TODOs in `main.tf` and `outputs.tf`. The required architecture is:

```text
localhost:<host_port>
        |
        v
     HTTP API  ---- private Docker network ---- Redis
        |                                    |
  container:3000                        named volume:/data
```

The API listens on port **3000 inside its container**. The API code reads `REDIS_HOST` (default: `redis`), `REDIS_PORT` (default: `6379`), and `SERVICE_NAME` from environment variables. Make its Redis hostname resolve through Docker DNS on your Terraform-managed network.

Redis must not publish a host port.

## Step 3: Provision, test, change, and clean up

After implementing the Terraform TODOs, your normal loop will be:

```bash
terraform init
terraform fmt
terraform validate
terraform plan
terraform apply
terraform output
curl http://localhost:8080
curl http://localhost:8080
terraform state list
```

If you configure a different host port, use that port in the curl command.

Expected response: JSON containing `localCount`, `redisCount`, and `redisError`. The Redis counter should increment across requests and `redisError` should be `null` once Redis is ready.

For the persistence test, replace only the API container and verify that the `redisCount` continues increasing. The Redis named volume should not be destroyed during this test. **This does not prove Redis durability across Redis-container replacement**; that would require a separately designed persistence test and suitable Redis persistence settings.

Demonstrate an explicit variable change, document the before/after plan, and finish with:

```bash
terraform destroy
```

Use the same variable file and workspace used for `apply` when running `destroy`. Identify and explain the final disposition of persistent volumes.

## Graduate extension (CS 554)

In addition to the baseline:

1. Refactor at least one real component into a Terraform module.
2. Demonstrate separate `dev` and `test` settings without duplicating the implementation.
3. Produce a controlled, reversible drift experiment with before/after plans.
4. Explain how state isolation, sensitive values, and collaboration would work on a team.

## Submission

Follow the Project 3 assignment in the official course Assessment Library for screenshots/logs, architecture diagram, narrative, and grading. Submit your own Git repository. Never commit `.terraform/`, `*.tfstate`, real secret variable files, or credential files.

## Source and learning references

- [Exercise 03: Compose services](../exercise-03-compose-services/README.md)
- [Exercise 06: Terraform IaC](../exercise-06-terraform-iac/README.md)
- [Terraform Docker provider](https://registry.terraform.io/providers/kreuzwerker/docker/latest/docs)

**Instructor note:** The starter's application image build has not been rerun as part of packaging. Test the full Project 3 solution separately before student release.
