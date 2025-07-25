@echo off
echo ========================================
echo Claude Code 启动脚本 (认证冲突修复版)
echo ========================================
echo.

echo 正在修复认证冲突...
echo.

REM 清除可能冲突的环境变量
set ANTHROPIC_BASE_URL=
set ANTHROPIC_API_URL=
set CLAUDE_API_KEY=

REM 设置正确的环境变量
set "ANTHROPIC_BASE_URL=https://api.moonshot.cn/v1"
set "ANTHROPIC_API_KEY=sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti"

echo 当前会话环境变量:
echo ANTHROPIC_BASE_URL=%ANTHROPIC_BASE_URL%
echo ANTHROPIC_API_KEY=%ANTHROPIC_API_KEY%
echo.

echo 启动Claude Code...
echo 如果提示信任文件夹，请选择 "Yes, proceed"
echo.

claude %*

echo.
echo 如果仍有认证冲突错误，请:
echo 1. 重启命令提示符
echo 2. 再次运行此脚本
echo 3. 或运行: claude /logout 然后重试
echo.
pause
