# Claude Code 全新安装脚本
Write-Host "=== Claude Code 全新安装脚本 ===" -ForegroundColor Green
Write-Host ""

# 检查Node.js和npm
Write-Host "1. 检查系统环境..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "   ✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ 错误: 未找到Node.js或npm" -ForegroundColor Red
    Write-Host "   请先安装Node.js: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 清理可能的残留
Write-Host "2. 清理可能的残留..." -ForegroundColor Cyan
npm uninstall -g claude-code 2>$null
npm uninstall -g @anthropic-ai/claude-code 2>$null

# 清除npm缓存
Write-Host "3. 清除npm缓存..." -ForegroundColor Cyan
npm cache clean --force

# 安装Claude Code
Write-Host "4. 安装Claude Code..." -ForegroundColor Cyan
Write-Host "   正在从npm安装最新版本..." -ForegroundColor Gray

try {
    $installOutput = npm install -g claude-code 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Claude Code安装成功!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ npm安装失败，尝试其他方法..." -ForegroundColor Yellow
        
        # 尝试使用curl下载
        Write-Host "   尝试直接下载安装..." -ForegroundColor Gray
        $downloadUrl = "https://github.com/anthropics/claude-code/releases/latest/download/claude-code-windows.exe"
        $installPath = "$env:USERPROFILE\AppData\Local\Programs\claude-code"
        
        if (!(Test-Path $installPath)) {
            New-Item -ItemType Directory -Path $installPath -Force | Out-Null
        }
        
        $exePath = "$installPath\claude.exe"
        Invoke-WebRequest -Uri $downloadUrl -OutFile $exePath -ErrorAction Stop
        
        # 添加到PATH
        $userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
        if ($userPath -notlike "*$installPath*") {
            [Environment]::SetEnvironmentVariable("PATH", "$userPath;$installPath", "User")
        }
        
        Write-Host "   ✅ Claude Code直接下载安装成功!" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ 安装失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   请尝试手动安装: https://docs.anthropic.com/claude/docs/claude-code" -ForegroundColor Yellow
    exit 1
}

# 设置正确的环境变量
Write-Host "5. 配置环境变量..." -ForegroundColor Cyan
[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://api.moonshot.cn/v1", "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti", "User")

Write-Host "   ✅ 环境变量配置完成" -ForegroundColor Green
Write-Host "   ANTHROPIC_BASE_URL: https://api.moonshot.cn/v1" -ForegroundColor Gray
Write-Host "   ANTHROPIC_API_KEY: sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti" -ForegroundColor Gray

# 创建Claude Code Router配置
Write-Host "6. 配置Claude Code Router..." -ForegroundColor Cyan
$routerConfigPath = "$env:USERPROFILE\.claude-code-router"
if (!(Test-Path $routerConfigPath)) {
    New-Item -ItemType Directory -Path $routerConfigPath -Force | Out-Null
}

$routerConfig = @{
    LOG = $true
    Providers = @(
        @{
            name = "kimi2"
            api_base_url = "https://api.moonshot.cn/v1"
            api_key = "sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti"
            models = @(
                "moonshot-v1-8k",
                "moonshot-v1-32k", 
                "moonshot-v1-128k",
                "kimi-latest"
            )
            transformer = @{
                use = @("openai")
            }
        }
    )
    Router = @{
        default = "kimi2,moonshot-v1-8k"
        background = "kimi2,moonshot-v1-8k"
        think = "kimi2,moonshot-v1-32k"
        longContext = "kimi2,moonshot-v1-128k"
        webSearch = "kimi2,moonshot-v1-32k"
    }
} | ConvertTo-Json -Depth 4

$routerConfig | Out-File -FilePath "$routerConfigPath\config.json" -Encoding UTF8
Write-Host "   ✅ Router配置创建完成" -ForegroundColor Green

# 验证安装
Write-Host "7. 验证安装..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

# 刷新环境变量
$env:ANTHROPIC_BASE_URL = "https://api.moonshot.cn/v1"
$env:ANTHROPIC_API_KEY = "sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti"

try {
    $claudeVersion = claude --version 2>$null
    if ($claudeVersion) {
        Write-Host "   ✅ Claude Code版本: $claudeVersion" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ 无法获取版本信息，可能需要重启终端" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️ 无法验证安装，可能需要重启终端" -ForegroundColor Yellow
}

# 测试API连接
Write-Host "8. 测试API连接..." -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "https://api.moonshot.cn/v1/models" -Headers $headers -Method Get -TimeoutSec 10
    Write-Host "   ✅ API连接成功! 找到 $($response.data.Count) 个模型" -ForegroundColor Green
} catch {
    Write-Host "   ❌ API连接测试失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== 安装完成 ===" -ForegroundColor Green
Write-Host ""
Write-Host "📋 下一步操作:" -ForegroundColor Yellow
Write-Host "1. 重启PowerShell或命令提示符" -ForegroundColor White
Write-Host "2. 运行测试: claude --version" -ForegroundColor White
Write-Host "3. 测试连接: claude '你好，测试连接'" -ForegroundColor White
Write-Host ""
Write-Host "如果遇到问题，请检查:" -ForegroundColor Cyan
Write-Host "- 网络连接是否正常" -ForegroundColor White
Write-Host "- API密钥是否有效" -ForegroundColor White
Write-Host "- 是否需要重启终端" -ForegroundColor White
