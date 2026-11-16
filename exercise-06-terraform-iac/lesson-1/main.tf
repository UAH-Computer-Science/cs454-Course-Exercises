terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "= 4.6.0"
    }
  }
}

provider "docker" {}

resource "docker_image" "nginx" {
  name = "nginx:1.27-alpine"
}

resource "docker_network" "lab" {
  name = "cs454-terraform-lab"
}

resource "docker_container" "web" {
  name  = "cs454-web"
  image = docker_image.nginx.image_id

  networks_advanced {
    name = docker_network.lab.name
  }

  ports {
    internal = 80
    external = 8080
  }
}
