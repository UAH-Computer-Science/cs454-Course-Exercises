variable "host_port" {
  description = "Host port for the HTTP API. Choose a free, unprivileged local port."
  type        = number
  default     = 8080
}

variable "environment" {
  description = "A short label to distinguish your local stack (example: dev)."
  type        = string
  default     = "dev"
}

# TODO: Add any further variables needed for consistent resource naming
# and environment-specific settings. Avoid hard-coded host-specific paths.
