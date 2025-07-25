# 简单的Claude Code测试脚本
Write-Host "设置环境变量..." -ForegroundColor Green

# 清除错误的环境变量
Remove-Item Env:ANTHROPIC_BASE_URL -ErrorAction SilentlyContinue

# 设置正确的环境变量
$env:ANTHROPIC_BASE_URL = "https://api.moonshot.cn/v1"
$env:ANTHROPIC_API_KEY = "sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti"

Write-Host "ANTHROPIC_BASE_URL: $env:ANTHROPIC_BASE_URL" -ForegroundColor Cyan
Write-Host "ANTHROPIC_API_KEY: $env:ANTHROPIC_API_KEY" -ForegroundColor Cyan

Write-Host "启动Claude Code..." -ForegroundColor Green
& claude "你好，测试连接"
