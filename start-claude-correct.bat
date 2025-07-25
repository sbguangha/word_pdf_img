@echo off
echo ========================================
echo 启动Claude Code (修复版)
echo ========================================

REM 在当前会话中设置正确的环境变量
set "ANTHROPIC_BASE_URL=https://api.moonshot.cn/v1"
set "ANTHROPIC_API_KEY=sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti"

echo 当前环境变量:
echo ANTHROPIC_BASE_URL=%ANTHROPIC_BASE_URL%
echo ANTHROPIC_API_KEY=%ANTHROPIC_API_KEY%
echo.

echo 启动Claude Code...
claude %*

echo.
echo 如果仍然显示错误，请运行 fix-environment-permanent.bat
pause
