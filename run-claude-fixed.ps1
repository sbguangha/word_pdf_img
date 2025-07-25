# Claude Code 启动脚本 - 修复版
Write-Host "正在设置正确的API端点..." -ForegroundColor Green

# 清除可能存在的错误环境变量
Remove-Item Env:ANTHROPIC_BASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:ANTHROPIC_API_URL -ErrorAction SilentlyContinue

# 设置正确的环境变量
$env:ANTHROPIC_BASE_URL = "https://api.moonshot.cn/v1"
$env:ANTHROPIC_API_KEY = "sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti"

Write-Host "当前环境变量:" -ForegroundColor Yellow
Write-Host "ANTHROPIC_BASE_URL: $env:ANTHROPIC_BASE_URL" -ForegroundColor Cyan
Write-Host "ANTHROPIC_API_KEY: $env:ANTHROPIC_API_KEY" -ForegroundColor Cyan

Write-Host "`n启动Claude Code..." -ForegroundColor Green

# 传递所有参数给claude命令
if ($args.Count -gt 0) {
    & claude $args
} else {
    & claude
}
