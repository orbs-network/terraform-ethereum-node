resource "aws_ebs_volume" "ethereum_block_storage" {
  count             = 1
  size              = 500
  availability_zone = "${data.aws_availability_zones.available.names[0]}"

  tags = {
    Name = "${var.application}-storage"
  }
}

resource "aws_volume_attachment" "ethereum_block_storage_attachment" {
  count        = 1
  device_name  = "/dev/sdh"
  volume_id    = "${aws_ebs_volume.ethereum_block_storage.id}"
  instance_id  = "${aws_instance.ethereum.id}"
}
