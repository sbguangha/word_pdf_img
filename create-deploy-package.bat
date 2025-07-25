@echo off
echo ========================================
echo 创建FormatMagic部署包
echo ========================================

echo 📦 正在创建部署包...

:: 创建临时目录
if exist deploy-package rmdir /s /q deploy-package
mkdir deploy-package

:: 复制后端文件
echo 📁 复制后端文件...
xcopy server deploy-package\server\ /E /I /Y
copy Dockerfile.backend deploy-package\
copy docker-compose.yml deploy-package\

:: 复制前端构建文件
echo 📁 构建前端...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 前端构建失败
    pause
    exit /b 1
)

:: 复制前端构建产物
xcopy out deploy-package\frontend\ /E /I /Y 2>nul || xcopy .next deploy-package\frontend\ /E /I /Y

:: 复制配置文件
echo 📁 复制配置文件...
copy nginx\nginx.conf deploy-package\nginx.conf
copy deploy-to-aliyun.sh deploy-package\
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
echo # 复制前端文件
echo cp -r frontend/* /var/www/html/
echo.
echo # 重启Nginx
echo systemctl restart nginx
echo.
echo echo "✅ 部署完成！"
echo echo "🌐 访问地址: http://your-domain.com"
) > deploy-package\deploy-on-server.sh

:: 创建压缩包
echo 📦 创建压缩包...
powershell Compress-Archive -Path deploy-package\* -DestinationPath formatmagic-deploy.zip -Force

echo ✅ 部署包创建完成: formatmagic-deploy.zip
echo.
echo 📋 下一步操作:
echo 1. 将 formatmagic-deploy.zip 上传到服务器
echo 2. 在服务器上解压并运行部署脚本
echo.
pause
