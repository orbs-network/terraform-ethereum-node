locals {
  ethereum_user_data = <<TFEOF
#! /bin/bash

apt-get update && apt-get install -y supervisor curl

# Install Node.js
curl -sL https://deb.nodesource.com/setup_10.x | bash -
apt install nodejs
echo "Node.js is installed with the following versions:"
node -v
npm -v

echo "Waiting to see if the 500G disk was mounted.."
while true; do
  sleep 1
  BLOCK_STORAGE_NAME=$(lsblk | grep 500G | awk '{print $1}')
  [ ! -z "$BLOCK_STORAGE_NAME" ] && break
done
echo "Found the 500G SSD disk on $BLOCK_STORAGE_NAME , attempting to mount it.."

mkdir -p /home/root/.local
mkfs -t xfs /dev/$BLOCK_STORAGE_NAME
echo "/dev/$BLOCK_STORAGE_NAME /home/root/.local xfs defaults,nofail 0 0" >> /etc/fstab
mount -a

cd /home/ubuntu && curl -O https://releases.parity.io/ethereum/v2.3.5/x86_64-unknown-linux-gnu/parity
chmod u+x parity

(crontab -l 2>/dev/null; echo "0 * * * * /home/ubuntu/restart-parity.sh") | crontab -

echo "[program:healthcheck]
command=/usr/bin/node /home/ubuntu/health.js
autostart=true
autorestart=true" >> /etc/supervisor/conf.d/health.conf

echo "[program:ethereum]
command=/home/ubuntu/parity --chain mainnet --db-path=/home/root/.local --min-peers=45 --max-peers=60 --no-secretstore --jsonrpc-interface all --no-ipc --no-ws --pruning-history 5000
autostart=true
autorestart=true
stderr_logfile=/var/log/ethereum.err.log
stdout_logfile=/var/log/ethereum.out.log" >> /etc/supervisor/conf.d/ethereum.conf

supervisorctl reread && supervisorctl update

TFEOF
}

resource "aws_subnet" "ethereum" {
  count                   = 1
  vpc_id                  = "${module.vpc.id}"
  cidr_block              = "172.31.100.0/24"
  availability_zone       = "${aws_ebs_volume.ethereum_block_storage.availability_zone}"
  map_public_ip_on_launch = true

  tags = {
    Name = "ethereum-subnet"
  }
}

resource "aws_instance" "ethereum" {
  ami               = "${data.aws_ami.ubuntu-18_04.id}"
  count             = 1
  availability_zone = "${aws_ebs_volume.ethereum_block_storage.availability_zone}"
  instance_type     = "m5d.large"
  security_groups   = ["${aws_security_group.ethereum.id}"]
  key_name          = "${aws_key_pair.deployer.key_name}"
  subnet_id         = "${ aws_subnet.ethereum.id }"

  user_data = "${local.ethereum_user_data}"

  provisioner "file" {
    source      = "restart-parity.sh"
    destination = "/home/ubuntu/restart-parity.sh"
  }

  provisioner "file" {
    source      = "health.js"
    destination = "/home/ubuntu/health.js"
  }

  connection {
    type        = "ssh"
    user        = "ubuntu"
    private_key = "${file("~/.ssh/id_rsa")}"
  }

  tags = {
    Name = "ethereum-full-node"
  }
}
