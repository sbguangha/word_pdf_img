#!/bin/bash
echo "🚀 部署FormatMagic到服务器..."

# 构建后端容器
docker build -f Dockerfile.backend -t formatmagic-backend:latest .

# 停止现有容器
docker stop formatmagic-backend 2>/dev/null || true
docker rm formatmagic-backend 2>/dev/null || true

# 启动后端容器
docker run -d --name formatmagic-backend \
  -p 3001:3001 \
  -v /opt/formatmagic/data/uploads:/app/uploads \
  -v /opt/formatmagic/data/outputs:/app/outputs \
  -v /opt/formatmagic/data/temp:/app/temp \
  --restart unless-stopped \
  formatmagic-backend:latest

# 配置Nginx
cp nginx.conf /etc/nginx/sites-available/formatmagic
ln -sf /etc/nginx/sites-available/formatmagic /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 重启Nginx
systemctl restart nginx

echo "✅ 后端部署完成！"
echo "🌐 访问地址: http://your-domain.com/api/health"
