# Claude Code + Kimi API 测试脚本
Write-Host "=== Claude Code + 月之暗面 Kimi API 测试 ===" -ForegroundColor Green

# 清除所有可能的环境变量
$envVarsToRemove = @(
    "ANTHROPIC_BASE_URL",
    "ANTHROPIC_API_URL", 
    "ANTHROPIC_API_BASE",
    "CLAUDE_API_URL",
    "CLAUDE_BASE_URL"
)

foreach ($var in $envVarsToRemove) {
    Remove-Item "Env:$var" -ErrorAction SilentlyContinue
    Write-Host "已清除环境变量: $var" -ForegroundColor Yellow
}

# 设置正确的环境变量
$correctBaseUrl = "https://api.moonshot.cn/v1"
$apiKey = "sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti"

$env:ANTHROPIC_BASE_URL = $correctBaseUrl
$env:ANTHROPIC_API_KEY = $apiKey

Write-Host "`n当前环境变量设置:" -ForegroundColor Cyan
Write-Host "ANTHROPIC_BASE_URL: $env:ANTHROPIC_BASE_URL" -ForegroundColor White
Write-Host "ANTHROPIC_API_KEY: $env:ANTHROPIC_API_KEY" -ForegroundColor White

# 测试API连接
Write-Host "`n测试API连接..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "$correctBaseUrl/models" -Headers $headers -Method Get -TimeoutSec 10
    Write-Host "✅ API连接成功!" -ForegroundColor Green
    Write-Host "可用模型数量: $($response.data.Count)" -ForegroundColor Cyan
    
    # 显示前几个模型
    Write-Host "前5个可用模型:" -ForegroundColor Cyan
    $response.data | Select-Object -First 5 | ForEach-Object {
        Write-Host "  - $($_.id)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ API连接失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "请检查API密钥和网络连接" -ForegroundColor Yellow
    exit 1
}

# 测试聊天功能
Write-Host "`n测试聊天功能..." -ForegroundColor Yellow
try {
    $chatPayload = @{
        model = "moonshot-v1-8k"
        messages = @(
            @{
                role = "user"
                content = "你好，请简单介绍一下你自己"
            }
        )
        max_tokens = 100
    }
    $chatPayloadJson = $chatPayload | ConvertTo-Json -Depth 3
    
    $chatResponse = Invoke-RestMethod -Uri "$correctBaseUrl/chat/completions" -Headers $headers -Method Post -Body $chatPayloadJson -TimeoutSec 30
    Write-Host "✅ 聊天功能测试成功!" -ForegroundColor Green
    Write-Host "AI回复: $($chatResponse.choices[0].message.content)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 聊天功能测试失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n启动Claude Code..." -ForegroundColor Green
Write-Host "注意: 如果仍然显示错误的API端点，请重启PowerShell后再试" -ForegroundColor Yellow

# 启动Claude Code
if ($args.Count -gt 0) {
    & claude $args
} else {
    & claude "你好，我是通过月之暗面API连接的Claude"
}
