#!/bin/bash

# Docker
amazon-linux-extras install docker -y
service docker start
usermod -a -G docker ec2-user
systemctl enable docker
systemctl start docker

curl -L "https://github.com/docker/compose/releases/download/v2.2.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Scripts
cat << EOF > /home/ec2-user/pull.sh
#!/bin/bash
aws ecr get-login-password --region eu-west-3 | docker login --username AWS --password-stdin ${ECR_REPO_URL}
aws s3 sync s3://${S3_CONF_BUCKET}/cms/ /home/ec2-user/cms
aws s3 sync s3://${S3_CONF_BUCKET}/api/ /home/ec2-user/api
EOF
chmod +x /home/ec2-user/pull.sh
bash /home/ec2-user/pull.sh > /home/ec2-user/pull.log 2>&1

chown -R ec2-user:ec2-user /home/ec2-user/cms
chown -R ec2-user:ec2-user /home/ec2-user/api

# NFS
cat << EOF > /home/ec2-user/mount.sh
#!/bin/bash
mkdir /nfs
mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport ${NFS_ENDPOINT}:/ /nfs
EOF
chmod +x /home/ec2-user/mount.sh
bash /home/ec2-user/mount.sh > /home/ec2-user/mount.log 2>&1
echo "${NFS_ENDPOINT}:/ /nfs nfs4 nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport,_netdev 0 0" >> /etc/fstab
