# FormatMagic Docker 部署指南

## 🚀 快速开始

### 本地开发环境
```bash
# 1. 克隆项目
git clone <your-repo-url>
cd formatmagic

# 2. 启动开发环境
chmod +x deploy.sh
./deploy.sh
# 选择选项1 (开发环境)

# 3. 访问应用
# 前端: http://localhost
# 后端API: http://localhost/api
```

### 生产环境部署
```bash
# 1. 配置环境变量
cp .env.example .env
nano .env  # 修改域名等配置

# 2. 更新Nginx配置
nano nginx/nginx.conf  # 替换your-domain.com

# 3. 部署到生产环境
./deploy.sh
# 选择选项2 (生产环境)
# 输入您的域名
```

## 📁 项目结构

```
formatmagic/
├── src/                    # Next.js前端源码
├── server/                 # Express后端源码
├── nginx/                  # Nginx配置
├── docs/                   # 部署文档
├── Dockerfile.frontend     # 前端容器配置
├── Dockerfile.backend      # 后端容器配置
├── docker-compose.yml      # 开发环境编排
├── docker-compose.prod.yml # 生产环境编排
├── deploy.sh              # 部署脚本
├── health-check.sh        # 健康检查脚本
└── .env.example           # 环境变量模板
```

## 🐳 容器架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │  Next.js Frontend│    │ Express Backend │
│   Port: 80/443  │────│   Port: 3000     │────│   Port: 3001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌─────────┐            ┌─────────┐            ┌─────────┐
    │ SSL证书  │            │ 静态资源 │            │ 文件存储 │
    │ (可选)   │            │         │            │ 本地挂载 │
    └─────────┘            └─────────┘            └─────────┘
```

## 🔧 常用命令

### 容器管理
```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新服务
docker-compose up --build -d
```

### 健康检查
```bash
# 运行健康检查
./health-check.sh

# 手动检查服务
curl http://localhost/health
curl http://localhost/api/health
```

### 数据管理
```bash
# 查看数据目录
ls -la ./data/
ls -la /opt/formatmagic/  # 生产环境

# 清理临时文件
docker exec formatmagic-backend rm -rf /app/temp/*
```

## 🔍 故障排除

### 常见问题

1. **容器启动失败**
   ```bash
   # 查看详细错误
   docker-compose logs container-name
   
   # 检查端口占用
   netstat -tulpn | grep :80
   ```

2. **前端无法访问后端**
   ```bash
   # 检查网络连接
   docker network ls
   docker network inspect formatmagic_formatmagic-network
   ```

3. **文件上传失败**
   ```bash
   # 检查存储权限
   ls -la ./data/
   chmod 755 ./data/uploads
   ```

4. **内存不足**
   ```bash
   # 查看资源使用
   docker stats
   
   # 调整资源限制
   nano docker-compose.prod.yml
   ```

### 日志查看
```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs frontend
docker-compose logs backend
docker-compose logs nginx

# 实时跟踪日志
docker-compose logs -f --tail=100
```

## 🔒 安全配置

### 1. 防火墙设置
```bash
# Ubuntu UFW
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable

# CentOS Firewalld
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

### 2. SSL证书 (Let's Encrypt)
```bash
# 安装Certbot
apt install certbot

# 申请证书
certbot certonly --standalone -d your-domain.com

# 自动续期
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

### 3. 定期更新
```bash
# 系统更新
apt update && apt upgrade -y

# Docker镜像更新
docker-compose pull
docker-compose up -d
```

## 📊 监控建议

### 1. 基础监控
- 使用 `health-check.sh` 定期检查
- 配置 crontab 自动监控
- 设置磁盘空间告警

### 2. 高级监控 (可选)
- Prometheus + Grafana
- ELK Stack (日志分析)
- 阿里云监控服务

### 3. 备份策略
```bash
# 数据备份
tar -czf backup_$(date +%Y%m%d).tar.gz ./data/

# 配置备份
tar -czf config_backup_$(date +%Y%m%d).tar.gz nginx/ .env docker-compose.prod.yml
```

## 🚀 性能优化

### 1. 容器优化
- 使用多阶段构建减小镜像大小
- 配置合适的资源限制
- 启用容器健康检查

### 2. Nginx优化
- 启用gzip压缩
- 配置静态资源缓存
- 使用CDN加速

### 3. 应用优化
- 定期清理临时文件
- 优化文件转换算法
- 实现文件转换队列

---

📚 **更多信息**: 查看 `docs/aliyun-deployment.md` 了解详细的阿里云部署指南
