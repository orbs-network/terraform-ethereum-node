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

cd /home/ubuntu && curl -O https://releases.parity.io/ethereum/v2.4.5/x86_64-unknown-linux-gnu/parity
chmod u+x parity

(crontab -l 2>/dev/null; echo "0 */1 * * *  /usr/bin/node /home/ubuntu/check-ethereum.js ${var.slack_webhook_url} >> /var/log/manager.log") | crontab -

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

mkdir -p ~/.aws

# Setup AWS credentials for CloudWatch Agent
echo "[default]
aws_access_key_id = ${aws_iam_access_key.cloudwatch.id}
aws_secret_access_key = ${aws_iam_access_key.cloudwatch.secret}
" >> ~/.aws/credentials

echo "[default]
region=${var.region}
output=json" >> ~/.aws/config

# Installing AWS CloudWatch Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb

dpkg -i -E ./amazon-cloudwatch-agent.deb
wget https://raw.githubusercontent.com/orbs-network/terraform-ethereum-node/master/cloudwatch-agent-config.json
mv cloudwatch-agent-config.json /etc/

wget https://raw.githubusercontent.com/orbs-network/terraform-ethereum-node/master/cloudwatch-common-config.toml
mv cloudwatch-common-config.toml /opt/aws/amazon-cloudwatch-agent/etc/common-config.toml

mkdir -p /usr/share/collectd/
touch /usr/share/collectd/types.db

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a append-config -m ec2 -c file:/etc/cloudwatch-agent-config.json -s
amazon-cloudwatch-agent-ctl -a start

TFEOF
}

resource "aws_instance" "ethereum" {
  ami               = "${data.aws_ami.ubuntu-18_04.id}"
  count             = "${var.count}"
  availability_zone = "${aws_ebs_volume.ethereum_block_storage.*.availability_zone[0]}"
  instance_type     = "${var.instance_type}"

  # This machine type is chosen since we need at least 16GB of RAM for mainnet
  # and sufficent amount of networking capabilities
  security_groups = ["${aws_security_group.ethereum.id}"]

  key_name  = "${aws_key_pair.deployer.key_name}"
  subnet_id = "${ module.vpc.subnet-ids-public[0] }"

  user_data = "${local.ethereum_user_data}"

  provisioner "remote-exec" {
    inline = [
      "sudo hostnamectl set-hostname ethereum-parity-${var.region}-${count.index+1}",
    ]
  }

  provisioner "file" {
    source      = "restart-parity.sh"
    destination = "/home/ubuntu/restart-parity.sh"
  }

  provisioner "file" {
    source      = "health.js"
    destination = "/home/ubuntu/health.js"
  }

  provisioner "file" {
    source      = "check-ethereum.js"
    destination = "/home/ubuntu/check-ethereum.js"
  }

  provisioner "file" {
    source      = "ethereum-lib.js"
    destination = "/home/ubuntu/ethereum-lib.js"
  }

  connection {
    type        = "ssh"
    user        = "ubuntu"
    private_key = "${file(var.ssh_private_keypath)}"
  }

  tags = {
    Name = "ethereum-parity-${count.index+1}"
  }
}
