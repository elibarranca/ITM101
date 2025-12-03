# Find the IP using: aws ec2 describe-network-interfaces
# SSH into the instance after it is ready (replace the IP): ssh -i private_key.pem ec2-user@44.202.5.12
# (change IP address for your 44.202.5.12)

# Configure the AWS Provider
#provider "aws" {
#  region = "us-east-1"
#}

# Create a private key, 4096-bit RSA
resource "tls_private_key" "priv_key_ai" {
  algorithm = "RSA"
  rsa_bits = "4096"
}
# Create a security file to ssh in with
resource "local_file" "private_key_pemai" {
  content = tls_private_key.priv_key_ai.private_key_pem
  filename = "private_key_ai.pem"
  file_permission = 0400
}

# Create the key pair
resource "aws_key_pair" "server_key_ai" {
  key_name = "serverai"
  public_key = tls_private_key.priv_key_ai.public_key_openssh
}

# Allow SSH. CIDR blocks must be used or it will not work.
resource "aws_security_group" "byuisgai" {
  name = "allow-ssh-ai"
  description = "Allow SSH and AI"
  ingress {
    description = "SSH"
    from_port = 22
    to_port = 22
    protocol = "tcp"
    # Allow only the BYUI network to SSH in
    # cidr_blocks = ["157.201.0.0/16"]
    cidr_blocks = ["0.0.0.0/0"]
  }
    ingress {
    description = "OpenWebUI"
    from_port = 3000
    to_port = 3000
    protocol = "tcp"
    # Allow only the BYUI network to SSH in
    # cidr_blocks = ["157.201.0.0/16"]
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "Ollama"
    from_port = 11434
    to_port = 11434
    protocol = "tcp"
    # Allow only the BYUI network to SSH in
    # cidr_blocks = ["157.201.0.0/16"]
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
    Name = "allow_ssh"
  }
}

#Create an elastic IP so the IP stays the same
resource "aws_eip" "ipai" {
instance = aws_instance.awslinx_host_ai.id
  tags = {
    Name = "ai_chat_ip"
  }
}

# Create an EC2 instance Amazon Linux 2023 ami-06b21ccaeff8cd686
resource "aws_instance" "awslinx_host_ai" {
  ami = "ami-06b21ccaeff8cd686"
  instance_type = "t2.large"
  key_name = aws_key_pair.server_key_ai.key_name
  vpc_security_group_ids = [aws_security_group.byuisgai.id]
  associate_public_ip_address = "true"
  root_block_device {
    volume_size = 32 # Size in GB
    volume_type = "gp3" # General Purpose SSD
  }  
  tags = {
    Name = "awslinx_host_ai"
  }
  user_data = <<EOF
#!/bin/bash 
curl -fsSL https://ollama.com/install.sh | sh
sudo yum install -y docker
sudo systemctl enable docker
sudo service docker start
sudo docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main
curl -O https://byui-cloud.github.io/itm101-course/week07/addipvarwebui.sh && sudo chmod a+x addipvarwebui.sh && sudo ./addipvarwebui.sh 
sudo yum update -y
EOF
 
}
# Create an output with the instance's public IP.
# use terraform command to get the public IP: terraform output instance_public_ip_ai
output "instance_public_ip_ai" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.awslinx_host_ai.public_ip
}