# 阿里云ECS部署指南

## 🚀 部署准备

### 1. ECS服务器要求
- **配置**: 2核4G内存以上 (推荐4核8G)
- **系统**: Ubuntu 20.04 LTS 或 CentOS 8
- **存储**: 40GB以上系统盘
- **网络**: 分配公网IP，开放80和443端口

### 2. 域名准备
- 域名已备案 (中国大陆服务器必须)
- DNS解析指向ECS公网IP
- 可选: 申请SSL证书

## 🔧 服务器初始化

### 1. 连接服务器
```bash
ssh root@your-server-ip
```

### 2. 更新系统
```bash
# Ubuntu
apt update && apt upgrade -y

# CentOS
yum update -y
```

### 3. 安装Docker
```bash
# Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker

# CentOS
yum install -y docker
systemctl start docker
systemctl enable docker
```

### 4. 安装Docker Compose
```bash
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 5. 创建部署用户
```bash
useradd -m -s /bin/bash formatmagic
usermod -aG docker formatmagic
su - formatmagic
```

## 📦 项目部署

### 1. 上传项目代码
```bash
# 方法1: 使用Git (推荐)
git clone https://github.com/your-username/formatmagic.git
cd formatmagic

# 方法2: 使用SCP上传
# scp -r ./formatmagic formatmagic@your-server-ip:~/
```

### 2. 配置环境变量
```bash
cp .env.example .env
nano .env

# 修改以下配置:
DOMAIN=your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
CORS_ORIGIN=https://your-domain.com
```

### 3. 更新Nginx配置
```bash
nano nginx/nginx.conf

# 将 your-domain.com 替换为您的实际域名
```

### 4. 执行部署
```bash
chmod +x deploy.sh
./deploy.sh

# 选择生产环境 (选项2)
# 输入您的域名
```

## 🔒 SSL证书配置 (可选)

### 1. 使用Let's Encrypt免费证书
```bash
# 安装Certbot
apt install certbot

# 申请证书
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 证书路径: /etc/letsencrypt/live/your-domain.com/
```

### 2. 更新Docker Compose配置
```bash
nano docker-compose.prod.yml

# 取消注释SSL相关配置
# - /etc/letsencrypt/live/your-domain.com:/etc/ssl/certs:ro
```

### 3. 更新Nginx配置
```bash
nano nginx/nginx.conf

# 取消注释HTTPS server配置
# 启用HTTP到HTTPS重定向
```

### 4. 重启服务
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 监控和维护

### 1. 查看服务状态
```bash
docker-compose ps
docker-compose logs -f
```

### 2. 健康检查
```bash
chmod +x health-check.sh
./health-check.sh
```

### 3. 定期备份
```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /opt/backups/formatmagic_$DATE.tar.gz /opt/formatmagic/
find /opt/backups/ -name "formatmagic_*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# 添加到定时任务
crontab -e
# 添加: 0 2 * * * /home/formatmagic/backup.sh
```

### 4. 日志轮转
```bash
# 配置logrotate
sudo nano /etc/logrotate.d/formatmagic

/opt/formatmagic/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 644 formatmagic formatmagic
}
```

## 🚨 故障排除

### 1. 容器无法启动
```bash
# 查看详细日志
docker-compose logs container-name

# 检查端口占用
netstat -tulpn | grep :80
netstat -tulpn | grep :443
```

### 2. 域名无法访问
```bash
# 检查DNS解析
nslookup your-domain.com

# 检查防火墙
ufw status
iptables -L
```

### 3. 文件转换失败
```bash
# 检查磁盘空间
df -h

# 检查权限
ls -la /opt/formatmagic/
```

## 📊 性能优化

### 1. 调整容器资源限制
```yaml
# 在docker-compose.prod.yml中调整
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '1.0'
```

### 2. 启用Nginx缓存
```nginx
# 在nginx.conf中添加
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m;
```

### 3. 配置CDN (可选)
- 使用阿里云CDN加速静态资源
- 配置回源地址为您的域名

## 🔄 更新部署

### 1. 更新代码
```bash
git pull origin main
```

### 2. 重新构建
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

### 3. 清理旧镜像
```bash
docker system prune -f
```
