@echo off
echo ========================================
echo FormatMagic 后端开发助手
echo ========================================
echo.

echo 选择操作
echo 1. 重新构建并启动后端容器 (代码有更新时)
echo 2. 启动现有后端容器
echo 3. 停止后端容器
echo 4. 查看后端日志
echo 5. 进入后端容器调试
echo 6. 重置后端环境 (清理所有数据)
echo.

set /p choice="请选择 (1-6): "

if "%choice%"=="1" goto rebuild
if "%choice%"=="2" goto start
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto debug
if "%choice%"=="6" goto reset
goto end

:rebuild
echo.
echo 🔄 重新构建后端容器...
echo 这会包含您的最新代码更改
docker stop formatmagic-backend 2>nul
docker rm formatmagic-backend 2>nul
docker build -f Dockerfile.backend -t formatmagic-backend:latest .
if %errorlevel% neq 0 (
    echo ❌ 构建失败
    pause
    goto end
)
echo.
echo 🚀 启动后端容器...
docker run -d --name formatmagic-backend -p 3001:3001 -v "%cd%\data\uploads:/app/uploads" -v "%cd%\data\outputs:/app/outputs" -v "%cd%\data\temp:/app/temp" formatmagic-backend:latest
if %errorlevel% neq 0 (
    echo ❌ 启动失败
    pause
    goto end
)
echo ✅ 后端容器已重新构建并启动
echo 🌐 API地址: http://localhost:3001
goto end

:start
echo.
echo 🚀 启动后端容器...
docker start formatmagic-backend
if %errorlevel% neq 0 (
    echo ❌ 启动失败，可能需要先构建容器
    echo 请选择选项1进行构建
    pause
    goto end
)
echo ✅ 后端容器已启动
echo 🌐 API地址: http://localhost:3001
goto end

:stop
echo.
echo 🛑 停止后端容器...
docker stop formatmagic-backend
echo ✅ 后端容器已停止
goto end

:logs
echo.
echo 📝 查看后端日志...
echo 按 Ctrl+C 退出日志查看
docker logs -f formatmagic-backend
goto end

:debug
echo.
echo 🔍 进入后端容器调试...
echo 输入 'exit' 退出容器
docker exec -it formatmagic-backend sh
goto end

:reset
echo.
echo ⚠️  警告: 这将删除所有后端数据和容器
set /p confirm="确定要重置吗? (y/N): "
if /i not "%confirm%"=="y" goto end
echo.
echo 🧹 清理后端环境...
docker stop formatmagic-backend 2>nul
docker rm formatmagic-backend 2>nul
docker rmi formatmagic-backend:latest 2>nul
rmdir /s /q data\uploads 2>nul
rmdir /s /q data\outputs 2>nul
rmdir /s /q data\temp 2>nul
mkdir data\uploads
mkdir data\outputs
mkdir data\temp
echo ✅ 后端环境已重置
goto end

:end
echo.
pause
