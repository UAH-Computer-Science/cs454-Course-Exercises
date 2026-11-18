# PROJECT 3 STARTER: student work begins here.
#
# Use the Docker provider declared in versions.tf to provision the existing
# application with Redis. Do not use docker compose up for the submitted stack.
#
# Requirements:
#   1. A private Docker network shared by the API and Redis.
#   2. A named Docker volume for Redis data.
#   3. A Redis 7-alpine image and running Redis container attached to the network.
#   4. The prebuilt cs454-project3-api:1.0 image and running API container.
#   5. API environment: REDIS_HOST must resolve to the Redis container on
#      the shared Docker network; SERVICE_NAME can identify your environment.
#   6. Publish only the API's internal port 3000 to var.host_port.
#   7. No Redis host port publication.
#
# Consult Exercise 06 for Terraform resource syntax and lifecycle.
#
# TODO: docker_network
#
# TODO: docker_volume
#
# TODO: docker_image for Redis (and/or the prebuilt API image)
#
# TODO: docker_container for Redis, with its /data volume mount
#
# TODO: docker_container for the API, with environment and port mappings
#
# NOTE: An API container depends on Redis DNS availability and eventual
# readiness. Explain startup ordering / retry behavior in your README.
