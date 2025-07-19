# 部署指南

## 开发环境快速启动

### 1. 环境要求
- Node.js 18+ 
- npm 8+
- 至少 2GB 可用内存

### 2. 安装步骤
```bash
# 克隆项目
git clone <repository-url>
cd word_to_pdf_img

# 安装依赖
npm install

# 启动后端服务器 (选择其一)
node server/simple.js      # 简化版本，用于测试
node server/index.js       # 完整版本，包含所有功能

# 访问应用
# 方式1: 直接打开HTML文件
open public/app.html

# 方式2: 使用本地服务器
npx serve public -p 8080
# 然后访问 http://localhost:8080/app.html
```

### 3. 验证安装
访问测试页面: `public/test.html`
- 检查服务器状态
- 测试API接口
- 验证文件上传功能

## 生产环境部署

### 1. 服务器配置
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm nginx

# CentOS/RHEL
sudo yum install nodejs npm nginx
```

### 2. 应用部署
```bash
# 创建应用目录
sudo mkdir -p /var/www/file-converter
cd /var/www/file-converter

# 复制文件
sudo cp -r /path/to/project/* .
sudo npm install --production

# 设置权限
sudo chown -R www-data:www-data /var/www/file-converter
sudo chmod -R 755 /var/www/file-converter
```

### 3. 进程管理 (PM2)
```bash
# 安装PM2
sudo npm install -g pm2

# 启动应用
pm2 start server/index.js --name "file-converter"

# 设置开机自启
pm2 startup
pm2 save

# 监控
pm2 status
pm2 logs file-converter
```

### 4. Nginx配置
```nginx
# /etc/nginx/sites-available/file-converter
server {
    listen 80;
    server_name your-domain.com;
    
    # 静态文件
    location / {
        root /var/www/file-converter/public;
        index app.html;
        try_files $uri $uri/ =404;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 文件上传大小限制
    client_max_body_size 50M;
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/file-converter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL配置 (Let's Encrypt)
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Docker部署

### 1. Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "server/index.js"]
```

### 2. docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - ./server/uploads:/app/server/uploads
      - ./server/outputs:/app/server/outputs
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./public:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
    restart: unless-stopped
```

### 3. 启动
```bash
docker-compose up -d
```

## 监控和维护

### 1. 日志管理
```bash
# PM2日志
pm2 logs file-converter

# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 应用日志
tail -f /var/www/file-converter/logs/app.log
```

### 2. 性能监控
```bash
# 系统资源
htop
df -h
free -h

# 应用性能
pm2 monit
```

### 3. 备份策略
```bash
# 数据备份
tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/file-converter

# 定期清理临时文件
find /var/www/file-converter/server/uploads -type f -mtime +1 -delete
find /var/www/file-converter/server/outputs -type f -mtime +1 -delete
```

## 故障排除

### 常见问题
1. **端口占用**: `lsof -i :3001`
2. **权限问题**: 检查文件权限和用户组
3. **内存不足**: 增加服务器内存或优化代码
4. **依赖问题**: 重新安装node_modules

### 调试命令
```bash
# 检查服务状态
systemctl status nginx
pm2 status

# 测试API
curl http://localhost:3001/
curl -X POST http://localhost:3001/api/upload

# 检查端口
netstat -tlnp | grep :3001
```
