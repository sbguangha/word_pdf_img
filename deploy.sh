#!/bin/bash

# FormatMagic 部署脚本
# 用于在阿里云ECS上部署Docker容器

set -e

echo "🚀 开始部署 FormatMagic..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose 未安装，请先安装 Docker Compose${NC}"
    exit 1
fi

# 创建必要的目录
echo -e "${YELLOW}📁 创建数据目录...${NC}"
sudo mkdir -p /opt/formatmagic/{uploads,outputs,temp,logs}
sudo chown -R $USER:$USER /opt/formatmagic

# 创建本地数据目录 (开发环境)
mkdir -p ./data/{uploads,outputs,temp}

# 停止现有容器
echo -e "${YELLOW}🛑 停止现有容器...${NC}"
docker-compose down 2>/dev/null || true

# 清理旧镜像 (可选)
read -p "是否清理旧的Docker镜像? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🧹 清理旧镜像...${NC}"
    docker system prune -f
fi

# 选择部署环境
echo -e "${YELLOW}🔧 选择部署环境:${NC}"
echo "1) 开发环境 (localhost)"
echo "2) 生产环境 (your-domain.com)"
read -p "请选择 (1-2): " -n 1 -r
echo

if [[ $REPLY == "2" ]]; then
    # 生产环境部署
    echo -e "${GREEN}🏭 部署到生产环境...${NC}"
    
    # 检查域名配置
    read -p "请输入您的域名 (例如: formatmagic.com): " DOMAIN
    if [ -z "$DOMAIN" ]; then
        echo -e "${RED}❌ 域名不能为空${NC}"
        exit 1
    fi
    
    # 更新nginx配置中的域名
    sed -i "s/your-domain.com/$DOMAIN/g" nginx/nginx.conf
    sed -i "s/your-domain.com/$DOMAIN/g" docker-compose.prod.yml
    
    # 构建并启动生产环境
    docker-compose -f docker-compose.prod.yml up --build -d
    
    echo -e "${GREEN}✅ 生产环境部署完成!${NC}"
    echo -e "${GREEN}🌐 访问地址: http://$DOMAIN${NC}"
    
else
    # 开发环境部署
    echo -e "${GREEN}🛠️ 部署到开发环境...${NC}"
    
    # 构建并启动开发环境
    docker-compose up --build -d
    
    echo -e "${GREEN}✅ 开发环境部署完成!${NC}"
    echo -e "${GREEN}🌐 访问地址: http://localhost${NC}"
fi

# 显示容器状态
echo -e "${YELLOW}📊 容器状态:${NC}"
docker-compose ps

# 显示日志
echo -e "${YELLOW}📝 最近日志:${NC}"
docker-compose logs --tail=20

echo -e "${GREEN}🎉 部署完成!${NC}"
echo -e "${YELLOW}💡 有用的命令:${NC}"
echo "  查看日志: docker-compose logs -f"
echo "  重启服务: docker-compose restart"
echo "  停止服务: docker-compose down"
echo "  更新服务: docker-compose up --build -d"
