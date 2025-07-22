#!/bin/bash

# FormatMagic 阿里云ECS部署脚本
# 使用方法: chmod +x deploy-to-aliyun.sh && ./deploy-to-aliyun.sh

set -e

echo "🚀 FormatMagic 阿里云ECS部署开始..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用root用户运行此脚本${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 第一步: 更新系统并安装基础软件...${NC}"

# 更新系统
apt update && apt upgrade -y

# 安装基础软件
apt install -y curl wget git vim unzip

echo -e "${GREEN}✅ 系统更新完成${NC}"

echo -e "${YELLOW}🐳 第二步: 安装Docker...${NC}"

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 启动Docker服务
systemctl start docker
systemctl enable docker

# 安装Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo -e "${GREEN}✅ Docker安装完成${NC}"

echo -e "${YELLOW}🌐 第三步: 安装Nginx...${NC}"

# 安装Nginx
apt install -y nginx

# 启动Nginx服务
systemctl start nginx
systemctl enable nginx

echo -e "${GREEN}✅ Nginx安装完成${NC}"

echo -e "${YELLOW}📁 第四步: 创建项目目录...${NC}"

# 创建项目目录
mkdir -p /opt/formatmagic
cd /opt/formatmagic

# 创建数据目录
mkdir -p data/{uploads,outputs,temp}
mkdir -p logs

echo -e "${GREEN}✅ 项目目录创建完成${NC}"

echo -e "${YELLOW}🔧 第五步: 配置防火墙...${NC}"

# 配置UFW防火墙
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw --force enable

echo -e "${GREEN}✅ 防火墙配置完成${NC}"

echo -e "${GREEN}🎉 服务器初始化完成！${NC}"
echo -e "${YELLOW}下一步请上传项目文件到 /opt/formatmagic 目录${NC}"
echo -e "${YELLOW}然后运行项目部署脚本${NC}"
