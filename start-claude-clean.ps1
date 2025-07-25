# Claude Code 清洁启动脚本 - 修复认证冲突
Write-Host "=== Claude Code 清洁启动 ===" -ForegroundColor Green
Write-Host ""

Write-Host "修复认证冲突..." -ForegroundColor Yellow

# 清除所有可能冲突的环境变量
Remove-Item Env:ANTHROPIC_BASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:ANTHROPIC_API_URL -ErrorAction SilentlyContinue  
Remove-Item Env:CLAUDE_API_KEY -ErrorAction SilentlyContinue

# 设置正确的环境变量
$env:ANTHROPIC_BASE_URL = "https://api.moonshot.cn/v1"
$env:ANTHROPIC_API_KEY = "sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti"

Write-Host "当前会话环境变量:" -ForegroundColor Cyan
Write-Host "ANTHROPIC_BASE_URL: $env:ANTHROPIC_BASE_URL" -ForegroundColor White
Write-Host "ANTHROPIC_API_KEY: $env:ANTHROPIC_API_KEY" -ForegroundColor White
Write-Host ""

Write-Host "启动Claude Code..." -ForegroundColor Green
Write-Host "如果提示信任文件夹，请选择 'Yes, proceed'" -ForegroundColor Yellow
Write-Host ""

# 启动Claude Code
if ($args.Count -gt 0) {
    & claude $args
} else {
    & claude "你好，这是修复认证冲突后的测试"
}
