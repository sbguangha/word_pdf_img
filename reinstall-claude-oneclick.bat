@echo off
echo ========================================
echo Claude Code 一键重装脚本
echo ========================================
echo.

echo 此脚本将:
echo 1. 完全卸载现有的Claude Code
echo 2. 清理所有配置文件
echo 3. 重新安装Claude Code
echo 4. 配置月之暗面API
echo.

set /p confirm="确定要继续吗? (y/N): "
if /i not "%confirm%"=="y" (
    echo 操作已取消
    pause
    exit /b
)

echo.
echo 第1步: 卸载现有Claude Code...
powershell.exe -ExecutionPolicy Bypass -File "uninstall-claude-complete.ps1"

echo.
echo 第2步: 等待3秒...
timeout /t 3 /nobreak >nul

echo.
echo 第3步: 安装全新Claude Code...
powershell.exe -ExecutionPolicy Bypass -File "install-claude-fresh.ps1"

echo.
echo ========================================
echo 重装完成!
echo ========================================
echo.
echo 请按照以下步骤测试:
echo 1. 关闭此窗口
echo 2. 重新打开PowerShell或命令提示符
echo 3. 运行: claude --version
echo 4. 测试: claude "你好，测试连接"
echo.
pause
