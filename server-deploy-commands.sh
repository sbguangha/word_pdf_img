#!/bin/bash

# 在阿里云ECS服务器上运行的部署命令

echo "🚀 FormatMagic服务器部署开始..."

# 1. 初始化服务器环境
echo "📦 第一步: 初始化服务器..."
chmod +x deploy-to-aliyun.sh
./deploy-to-aliyun.sh

# 2. 解压项目文件
echo "📁 第二步: 解压项目文件..."
cd /opt/formatmagic
unzip -o formatmagic-deploy.zip

# 3. 设置权限
echo "🔐 第三步: 设置权限..."
chmod +x deploy-on-server.sh
chown -R www-data:www-data data/
chmod 755 data/uploads data/outputs data/temp

# 4. 构建并启动后端容器
echo "🐳 第四步: 构建后端容器..."
docker build -f Dockerfile.backend -t formatmagic-backend:latest .

# 停止现有容器（如果存在）
docker stop formatmagic-backend 2>/dev/null || true
docker rm formatmagic-backend 2>/dev/null || true

# 启动新容器
docker run -d --name formatmagic-backend \
  -p 3001:3001 \
  -v /opt/formatmagic/data/uploads:/app/uploads \
  -v /opt/formatmagic/data/outputs:/app/outputs \
  -v /opt/formatmagic/data/temp:/app/temp \
  -v /opt/formatmagic/logs:/app/logs \
  --restart unless-stopped \
  formatmagic-backend:latest

# 5. 配置Nginx
echo "🌐 第五步: 配置Nginx..."

# 更新nginx配置中的域名
read -p "请输入您的域名 (例如: formatmagic.com): " DOMAIN
if [ ! -z "$DOMAIN" ]; then
    sed -i "s/your-domain.com/$DOMAIN/g" nginx.conf
fi

# 复制Nginx配置
cp nginx.conf /etc/nginx/sites-available/formatmagic
ln -sf /etc/nginx/sites-available/formatmagic /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Nginx配置错误"
    exit 1
fi

# 6. 部署前端文件
echo "📱 第六步: 部署前端文件..."
rm -rf /var/www/html/*
cp -r frontend/* /var/www/html/ 2>/dev/null || echo "前端文件不存在，跳过"

# 创建简单的index.html（如果前端文件不存在）
if [ ! -f /var/www/html/index.html ]; then
    cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>FormatMagic</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        .status { padding: 20px; border-radius: 8px; margin: 20px 0; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 FormatMagic 部署成功！</h1>
        
        <div class="status success">
            <h3>✅ 后端服务已启动</h3>
            <p>API地址: <a href="/api/health">/api/health</a></p>
        </div>
        
        <div class="status info">
            <h3>📝 下一步操作</h3>
            <p>1. 上传完整的前端构建文件</p>
            <p>2. 配置域名DNS解析</p>
            <p>3. 申请SSL证书（可选）</p>
        </div>
        
        <div class="status info">
            <h3>🔗 快速链接</h3>
            <p><a href="/api/health">后端健康检查</a></p>
            <p><a href="/api">API文档</a></p>
        </div>
    </div>
    
    <script>
        // 测试后端连接
        fetch('/api/health')
            .then(response => response.text())
            .then(data => {
                console.log('后端连接成功:', data);
            })
            .catch(error => {
                console.error('后端连接失败:', error);
            });
    </script>
</body>
</html>
EOF
fi

# 7. 重启服务
echo "🔄 第七步: 重启服务..."
systemctl restart nginx
systemctl restart docker

# 8. 检查服务状态
echo "🔍 第八步: 检查服务状态..."
echo "Docker容器状态:"
docker ps | grep formatmagic

echo "Nginx状态:"
systemctl status nginx --no-pager -l

echo "端口监听状态:"
netstat -tulpn | grep -E ':80|:443|:3001'

# 9. 显示部署结果
echo ""
echo "🎉 FormatMagic部署完成！"
echo "================================"
echo "🌐 网站地址: http://$DOMAIN (或 http://$(curl -s ifconfig.me))"
echo "🔧 后端API: http://$DOMAIN/api"
echo "📊 健康检查: http://$DOMAIN/api/health"
echo ""
echo "📋 管理命令:"
echo "查看后端日志: docker logs -f formatmagic-backend"
echo "重启后端: docker restart formatmagic-backend"
echo "重启Nginx: systemctl restart nginx"
echo ""
echo "📁 重要目录:"
echo "项目文件: /opt/formatmagic"
echo "上传文件: /opt/formatmagic/data/uploads"
echo "网站文件: /var/www/html"
echo "Nginx配置: /etc/nginx/sites-available/formatmagic"
