resource "aws_ebs_volume" "ethereum_block_storage" {
  count             = var.eth_count
  size              = 500
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "${var.application}-eth-storage"
  }
}

resource "aws_volume_attachment" "ethereum_block_storage_attachment" {
  count        = var.eth_count
  device_name  = "/dev/sdh"
  force_detach = true
  volume_id    = element(aws_ebs_volume.ethereum_block_storage.*.id, count.index)
  instance_id  = element(aws_instance.ethereum.*.id, count.index)
}
