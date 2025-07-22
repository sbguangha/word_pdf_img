#!/bin/bash

# FormatMagic 健康检查脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🏥 FormatMagic 健康检查"
echo "========================"

# 检查Docker容器状态
echo -e "${YELLOW}📦 检查容器状态...${NC}"
CONTAINERS=$(docker-compose ps -q)

if [ -z "$CONTAINERS" ]; then
    echo -e "${RED}❌ 没有运行的容器${NC}"
    exit 1
fi

# 检查每个容器
for container in $CONTAINERS; do
    name=$(docker inspect --format='{{.Name}}' $container | sed 's/\///')
    status=$(docker inspect --format='{{.State.Status}}' $container)
    
    if [ "$status" = "running" ]; then
        echo -e "${GREEN}✅ $name: $status${NC}"
    else
        echo -e "${RED}❌ $name: $status${NC}"
    fi
done

# 检查网络连接
echo -e "${YELLOW}🌐 检查网络连接...${NC}"

# 检查前端
if curl -f -s http://localhost > /dev/null; then
    echo -e "${GREEN}✅ 前端服务正常${NC}"
else
    echo -e "${RED}❌ 前端服务异常${NC}"
fi

# 检查后端API
if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端API正常${NC}"
else
    echo -e "${RED}❌ 后端API异常${NC}"
fi

# 检查磁盘空间
echo -e "${YELLOW}💾 检查磁盘空间...${NC}"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✅ 磁盘空间充足 ($DISK_USAGE%已使用)${NC}"
elif [ "$DISK_USAGE" -lt 90 ]; then
    echo -e "${YELLOW}⚠️ 磁盘空间紧张 ($DISK_USAGE%已使用)${NC}"
else
    echo -e "${RED}❌ 磁盘空间不足 ($DISK_USAGE%已使用)${NC}"
fi

# 检查内存使用
echo -e "${YELLOW}🧠 检查内存使用...${NC}"
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')

if [ "$MEMORY_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✅ 内存使用正常 ($MEMORY_USAGE%已使用)${NC}"
elif [ "$MEMORY_USAGE" -lt 90 ]; then
    echo -e "${YELLOW}⚠️ 内存使用较高 ($MEMORY_USAGE%已使用)${NC}"
else
    echo -e "${RED}❌ 内存使用过高 ($MEMORY_USAGE%已使用)${NC}"
fi

# 检查日志错误
echo -e "${YELLOW}📝 检查最近错误日志...${NC}"
ERROR_COUNT=$(docker-compose logs --since="1h" 2>&1 | grep -i error | wc -l)

if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ 无错误日志${NC}"
elif [ "$ERROR_COUNT" -lt 5 ]; then
    echo -e "${YELLOW}⚠️ 发现 $ERROR_COUNT 个错误${NC}"
else
    echo -e "${RED}❌ 发现 $ERROR_COUNT 个错误，请检查日志${NC}"
fi

echo "========================"
echo -e "${GREEN}🏥 健康检查完成${NC}"
