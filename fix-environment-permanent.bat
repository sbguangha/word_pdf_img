@echo off
echo ========================================
echo 永久修复Claude Code环境变量
echo ========================================

echo 正在删除错误的环境变量...
setx ANTHROPIC_BASE_URL ""
setx ANTHROPIC_API_URL ""

echo 等待3秒...
timeout /t 3 /nobreak >nul

echo 设置正确的环境变量...
setx ANTHROPIC_BASE_URL "https://api.moonshot.cn/v1"
setx ANTHROPIC_API_KEY "sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti"

echo.
echo ========================================
echo 修复完成！
echo ========================================
echo.
echo 请按照以下步骤操作：
echo 1. 关闭所有PowerShell和命令提示符窗口
echo 2. 重新打开PowerShell或命令提示符
echo 3. 运行: claude "你好，测试连接"
echo.
echo 如果仍有问题，请重启电脑后再试。
echo.
pause
