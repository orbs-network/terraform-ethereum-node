output "ethereum.public_ip" {
  value = "${aws_instance.ethereum.*.public_ip}"
}