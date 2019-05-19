# Backend configuration is loaded early so we can't use variables
terraform {
  backend "s3" {
    region  = "us-east-2"
    bucket  = "terraform-eth-state-storage"
    key     = "state.tfstate"
    encrypt = true                   #AES-256 encryption
  }
}
