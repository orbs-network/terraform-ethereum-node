output "ethereum-public_ip" {
  value = "${aws_instance.ethereum.*.public_ip}"
}

output "ethereum-public_dns" {
  value = "${aws_instance.ethereum.*.public_dns}"
}
