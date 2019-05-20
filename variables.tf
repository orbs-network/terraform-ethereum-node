variable "application" {
  default = "ethereum-parity"
}

variable "provisionersrc" {
  default = "orbs-network/terraform-ethereum-node"
}

variable "vpc_cidr_block" {
  description = "The VPC CIDR address range"
  default     = "172.31.0.0/16"
}

variable "slack_webhook_url" {}

variable "count" {
  description = "The amount of Parity instances to create"
  default     = 1
}

variable "vpc_id" {
}

variable "instance_type" {
  default = "m5.2xlarge"
}

variable "ssh_keypath" {
  default = "~/.ssh/id_rsa.pub"
}

variable "ssh_private_keypath" {
  default = "~/.ssh/id_rsa"
}

variable "region" {
  default = "ca-central-1"
}

variable "aws_profile" {
  default = "default"
}
