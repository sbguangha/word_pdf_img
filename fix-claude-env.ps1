# 修复Claude Code环境变量
Write-Host "正在修复Claude Code环境变量..." -ForegroundColor Green

# 检查当前环境变量
Write-Host "`n当前环境变量:" -ForegroundColor Yellow
Write-Host "ANTHROPIC_BASE_URL: $env:ANTHROPIC_BASE_URL"
Write-Host "ANTHROPIC_API_KEY: $env:ANTHROPIC_API_KEY"

# 设置正确的环境变量
$correctBaseUrl = "https://api.moonshot.cn/v1"
$apiKey = "sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti"

Write-Host "`n正在设置正确的环境变量..." -ForegroundColor Green

# 设置用户级环境变量
[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", $correctBaseUrl, "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", $apiKey, "User")

# 设置当前会话环境变量
$env:ANTHROPIC_BASE_URL = $correctBaseUrl
$env:ANTHROPIC_API_KEY = $apiKey

Write-Host "`n修复后的环境变量:" -ForegroundColor Green
Write-Host "ANTHROPIC_BASE_URL: $env:ANTHROPIC_BASE_URL"
Write-Host "ANTHROPIC_API_KEY: $env:ANTHROPIC_API_KEY"

Write-Host "`n测试API连接..." -ForegroundColor Yellow

# 测试API连接
try {
    $headers = @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "$correctBaseUrl/models" -Headers $headers -Method Get
    Write-Host "✅ API连接成功!" -ForegroundColor Green
    Write-Host "可用模型:" -ForegroundColor Cyan
    $response.data | ForEach-Object { Write-Host "  - $($_.id)" -ForegroundColor White }
} catch {
    Write-Host "❌ API连接失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n请重新启动PowerShell或命令提示符，然后运行Claude Code。" -ForegroundColor Yellow
Write-Host "或者使用以下命令启动Claude Code:" -ForegroundColor Cyan
Write-Host "  .\run-claude-fixed.bat" -ForegroundColor White
