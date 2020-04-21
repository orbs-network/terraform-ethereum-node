resource "aws_key_pair" "deployer" {
  key_name   = "ethereum-${var.region}-keypair"
  public_key = file(var.ssh_keypath)
}
