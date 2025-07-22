@echo off
echo ========================================
echo Docker 调试脚本
echo ========================================
echo.

echo 1. 检查Docker状态...
docker info
if %errorlevel% neq 0 (
    echo ❌ Docker未运行，请启动Docker Desktop
    pause
    exit /b 1
)
echo ✅ Docker正常运行
echo.

echo 2. 清理现有容器和镜像...
docker container prune -f
docker image prune -f
echo ✅ 清理完成
echo.

echo 3. 检查项目文件...
if not exist "server\package.json" (
    echo ❌ server\package.json 不存在
    pause
    exit /b 1
)
echo ✅ server\package.json 存在

if not exist "package.json" (
    echo ❌ package.json 不存在
    pause
    exit /b 1
)
echo ✅ package.json 存在
echo.

echo 4. 测试后端Dockerfile...
echo 正在构建后端镜像...
docker build -f Dockerfile.backend -t test-backend . --progress=plain
if %errorlevel% neq 0 (
    echo ❌ 后端构建失败
    pause
    exit /b 1
)
echo ✅ 后端构建成功
echo.

echo 5. 测试前端Dockerfile...
echo 正在构建前端镜像...
docker build -f Dockerfile.frontend -t test-frontend . --progress=plain
if %errorlevel% neq 0 (
    echo ❌ 前端构建失败
    pause
    exit /b 1
)
echo ✅ 前端构建成功
echo.

echo 6. 测试容器运行...
echo 启动后端容器...
docker run -d --name test-backend-container -p 3001:3001 test-backend
if %errorlevel% neq 0 (
    echo ❌ 后端容器启动失败
    pause
    exit /b 1
)

timeout /t 5 /nobreak > nul
echo 检查后端容器状态...
docker ps | findstr test-backend-container
if %errorlevel% neq 0 (
    echo ❌ 后端容器未运行
    docker logs test-backend-container
    pause
    exit /b 1
)
echo ✅ 后端容器运行正常
echo.

echo 7. 清理测试容器...
docker stop test-backend-container
docker rm test-backend-container
echo ✅ 清理完成
echo.

echo ========================================
echo 🎉 Docker调试完成！
echo ========================================
echo 所有组件都正常工作，可以进行完整部署
pause
