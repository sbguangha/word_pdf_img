@echo off
echo ========================================
echo FormatMagic Docker 环境测试
echo ========================================
echo.

echo 1. 检查Docker版本...
docker --version
if %errorlevel% neq 0 (
    echo ❌ Docker未安装或未启动
    echo 请先安装并启动Docker Desktop
    pause
    exit /b 1
)
echo ✅ Docker已安装

echo.
echo 2. 检查Docker服务状态...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker服务未启动
    echo 请启动Docker Desktop并等待完全启动
    echo 启动方法：开始菜单 → Docker Desktop
    pause
    exit /b 1
)
echo ✅ Docker服务正常运行

echo.
echo 3. 检查Docker Compose...
docker compose version
if %errorlevel% neq 0 (
    echo ❌ Docker Compose不可用
    pause
    exit /b 1
)
echo ✅ Docker Compose可用

echo.
echo 4. 测试Docker基本功能...
echo 正在拉取测试镜像...
docker pull hello-world
if %errorlevel% neq 0 (
    echo ❌ 无法拉取Docker镜像
    echo 请检查网络连接
    pause
    exit /b 1
)

echo 正在运行测试容器...
docker run --rm hello-world
if %errorlevel% neq 0 (
    echo ❌ 无法运行Docker容器
    pause
    exit /b 1
)
echo ✅ Docker基本功能正常

echo.
echo 5. 检查项目文件...
if not exist "docker-compose.yml" (
    echo ❌ 找不到docker-compose.yml文件
    echo 请确保在项目根目录运行此脚本
    pause
    exit /b 1
)
echo ✅ 项目文件完整

echo.
echo 6. 检查数据目录...
if not exist "data" mkdir data
if not exist "data\uploads" mkdir data\uploads
if not exist "data\outputs" mkdir data\outputs
if not exist "data\temp" mkdir data\temp
echo ✅ 数据目录已创建

echo.
echo ========================================
echo 🎉 Docker环境测试完成！
echo ========================================
echo.
echo 下一步：运行 docker compose up --build
echo 或者运行部署脚本进行完整部署
echo.
pause
