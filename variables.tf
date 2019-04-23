variable "application" {
  default = "ethereum"
}

variable "provisionersrc" {
  default = "itamararjuan/terraform-ethereum-node"
}

variable "vpc_cidr_block" {
  description = "The VPC CIDR address range"
  default = "172.31.0.0/16"
}

variable "region" {
  default = "us-east-1"
}

variable "aws_profile" {
  default = "default"
}