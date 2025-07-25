@echo off
echo ========================================
echo 修复Claude Code认证冲突
echo ========================================
echo.

echo 检测到认证冲突错误:
echo "Auth conflict: Using ANTHROPIC_API_KEY instead of Anthropic Console key"
echo.

echo 解决方案: 清除Console登录，使用环境变量API密钥
echo.

echo 第1步: 登出Anthropic Console...
claude /logout

echo.
echo 第2步: 设置正确的环境变量...
setx ANTHROPIC_BASE_URL "https://api.moonshot.cn/v1"
setx ANTHROPIC_API_KEY "sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti"

echo.
echo 第3步: 在当前会话中设置环境变量...
set "ANTHROPIC_BASE_URL=https://api.moonshot.cn/v1"
set "ANTHROPIC_API_KEY=sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti"

echo.
echo 第4步: 删除可能的Console认证文件...
if exist "%USERPROFILE%\.claude\.auth" del /f /q "%USERPROFILE%\.claude\.auth"
if exist "%USERPROFILE%\.claude\auth.json" del /f /q "%USERPROFILE%\.claude\auth.json"
if exist "%USERPROFILE%\.anthropic" rmdir /s /q "%USERPROFILE%\.anthropic"

echo.
echo ========================================
echo 修复完成!
echo ========================================
echo.
echo 当前环境变量:
echo ANTHROPIC_BASE_URL=%ANTHROPIC_BASE_URL%
echo ANTHROPIC_API_KEY=%ANTHROPIC_API_KEY%
echo.
echo 请按照以下步骤测试:
echo 1. 关闭此窗口
echo 2. 重新打开命令提示符或PowerShell
echo 3. 运行: claude --version
echo 4. 测试: claude "你好，测试连接"
echo.
echo 如果仍有问题，请重启电脑后再试。
echo.
pause
