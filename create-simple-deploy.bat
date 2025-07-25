@echo off
echo ========================================
echo 创建FormatMagic简化部署包
echo ========================================

echo 📦 正在创建部署包...

:: 创建临时目录
if exist deploy-package rmdir /s /q deploy-package
mkdir deploy-package

:: 复制后端文件
echo 📁 复制后端文件...
xcopy server deploy-package\server\ /E /I /Y
copy Dockerfile.backend deploy-package\

:: 复制配置文件
echo 📁 复制配置文件...
copy nginx\nginx.conf deploy-package\nginx.conf
copy DOCKER_STATUS.md deploy-package\

:: 创建服务器部署脚本
echo 📝 创建服务器部署脚本...
(
echo #!/bin/bash
echo echo "🚀 部署FormatMagic到服务器..."
echo.
echo # 构建后端容器
echo docker build -f Dockerfile.backend -t formatmagic-backend:latest .
echo.
echo # 停止现有容器
echo docker stop formatmagic-backend 2^>^/dev^/null ^|^| true
echo docker rm formatmagic-backend 2^>^/dev^/null ^|^| true
echo.
echo # 启动后端容器
echo docker run -d --name formatmagic-backend \
echo   -p 3001:3001 \
echo   -v /opt/formatmagic/data/uploads:/app/uploads \
echo   -v /opt/formatmagic/data/outputs:/app/outputs \
echo   -v /opt/formatmagic/data/temp:/app/temp \
echo   --restart unless-stopped \
echo   formatmagic-backend:latest
echo.
echo # 配置Nginx
echo cp nginx.conf /etc/nginx/sites-available/formatmagic
echo ln -sf /etc/nginx/sites-available/formatmagic /etc/nginx/sites-enabled/
echo rm -f /etc/nginx/sites-enabled/default
echo.
echo # 重启Nginx
echo systemctl restart nginx
echo.
echo echo "✅ 后端部署完成！"
echo echo "🌐 访问地址: http://your-domain.com/api/health"
) > deploy-package\deploy-on-server.sh

:: 创建压缩包
echo 📦 创建压缩包...
powershell Compress-Archive -Path deploy-package\* -DestinationPath formatmagic-deploy.zip -Force

echo ✅ 部署包创建完成: formatmagic-deploy.zip
echo.
echo 📋 文件位置: %cd%\formatmagic-deploy.zip
echo.
echo 📋 下一步操作:
echo 1. 将 formatmagic-deploy.zip 上传到服务器 /opt/formatmagic/
echo 2. 在服务器上解压: unzip formatmagic-deploy.zip
echo 3. 运行部署脚本: chmod +x deploy-on-server.sh && ./deploy-on-server.sh
echo.
pause
