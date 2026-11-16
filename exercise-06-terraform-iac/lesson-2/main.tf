terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "= 4.6.0"
    }
  }
}

provider "docker" {}

variable "container_name" {
  description = "Docker container name."
  type        = string
  default     = "cs454-web"
}

variable "host_port" {
  description = "Host TCP port that maps to container port 80."
  type        = number
  default     = 8080

  validation {
    condition     = var.host_port >= 1024 && var.host_port <= 65535
    error_message = "Use an unprivileged TCP port between 1024 and 65535."
  }
}

resource "docker_image" "nginx" {
  name = "nginx:1.27-alpine"
}

resource "docker_network" "lab" {
  name = "cs454-terraform-lab"
}

resource "docker_container" "web" {
  name  = var.container_name
  image = docker_image.nginx.image_id

  networks_advanced {
    name = docker_network.lab.name
  }

  ports {
    internal = 80
    external = var.host_port
  }
}

output "url" {
  description = "URL for the local NGINX service."
  value       = "http://localhost:${var.host_port}"
}
