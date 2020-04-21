data "aws_availability_zones" "available" {}

data "aws_subnet_ids" "all" {
  vpc_id = var.vpc_id
}

# module "vpc" {
#   source = "./modules/vpc/public-only"

#   name           = var.application}-vpc"
#   application    =  var.application 
#   provisionersrc =  var.provisionersrc 

#   azs  =  data.aws_availability_zones.available.names 
#   cidr =  var.vpc_cidr_block 
# }