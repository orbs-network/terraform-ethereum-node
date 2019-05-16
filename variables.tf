variable "application" {
  default = "ethereum"
}

variable "provisionersrc" {
  default = "itamararjuan/terraform-ethereum-node"
}

variable "vpc_cidr_block" {
  description = "The VPC CIDR address range"
  default     = "172.31.0.0/16"
}

variable "count" {
  description = "The amount of Parity instances to create"
  default     = 1
}

variable "vpc_id" {
  default = "PLEASE_UPDATE_TO_YOUR_DESIRED_VPC_ID"
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
