# 修复Claude Code认证冲突
Write-Host "=== 修复Claude Code认证冲突 ===" -ForegroundColor Green
Write-Host ""

Write-Host "检测到的问题:" -ForegroundColor Yellow
Write-Host "- Auth conflict: Using ANTHROPIC_API_KEY instead of Anthropic Console key" -ForegroundColor Red
Write-Host "- 这是因为同时存在环境变量API密钥和Console登录信息" -ForegroundColor Yellow
Write-Host ""

Write-Host "解决方案选择:" -ForegroundColor Cyan
Write-Host "1. 使用环境变量API密钥 (推荐用于月之暗面API)" -ForegroundColor White
Write-Host "2. 使用Anthropic Console登录" -ForegroundColor White
Write-Host "3. 完全清除所有认证信息重新设置" -ForegroundColor White
Write-Host ""

$choice = Read-Host "请选择解决方案 (1/2/3)"

switch ($choice) {
    "1" {
        Write-Host "选择方案1: 使用环境变量API密钥" -ForegroundColor Green
        Write-Host ""
        
        # 确保已登出Console
        Write-Host "1. 登出Anthropic Console..." -ForegroundColor Cyan
        try {
            & claude /logout 2>$null
            Write-Host "   ✅ 已登出Console" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️ 登出可能失败或已经登出" -ForegroundColor Yellow
        }
        
        # 设置正确的环境变量
        Write-Host "2. 设置环境变量..." -ForegroundColor Cyan
        $env:ANTHROPIC_BASE_URL = "https://api.moonshot.cn/v1"
        $env:ANTHROPIC_API_KEY = "sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti"
        
        # 永久设置
        [Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://api.moonshot.cn/v1", "User")
        [Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti", "User")
        
        Write-Host "   ✅ 环境变量设置完成" -ForegroundColor Green
        Write-Host "   ANTHROPIC_BASE_URL: $env:ANTHROPIC_BASE_URL" -ForegroundColor Gray
        Write-Host "   ANTHROPIC_API_KEY: $env:ANTHROPIC_API_KEY" -ForegroundColor Gray
        
        # 删除可能的Console认证文件
        Write-Host "3. 清理Console认证文件..." -ForegroundColor Cyan
        $authFiles = @(
            "$env:USERPROFILE\.claude\.auth",
            "$env:USERPROFILE\.claude\auth.json",
            "$env:USERPROFILE\.anthropic"
        )
        
        foreach ($file in $authFiles) {
            if (Test-Path $file) {
                Remove-Item $file -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "   删除: $file" -ForegroundColor Gray
            }
        }
        
        Write-Host "   ✅ Console认证文件清理完成" -ForegroundColor Green
    }
    
    "2" {
        Write-Host "选择方案2: 使用Anthropic Console登录" -ForegroundColor Green
        Write-Host ""
        
        # 清除环境变量
        Write-Host "1. 清除环境变量..." -ForegroundColor Cyan
        Remove-Item Env:ANTHROPIC_API_KEY -ErrorAction SilentlyContinue
        Remove-Item Env:ANTHROPIC_BASE_URL -ErrorAction SilentlyContinue
        
        [Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", $null, "User")
        [Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", $null, "User")
        
        Write-Host "   ✅ 环境变量已清除" -ForegroundColor Green
        
        Write-Host "2. 请手动登录Anthropic Console..." -ForegroundColor Cyan
        Write-Host "   运行: claude" -ForegroundColor White
        Write-Host "   然后按照提示登录你的Anthropic账户" -ForegroundColor White
        Write-Host ""
        Write-Host "   注意: 这种方式将使用Anthropic官方API，不是月之暗面API" -ForegroundColor Yellow
    }
    
    "3" {
        Write-Host "选择方案3: 完全清除所有认证信息" -ForegroundColor Green
        Write-Host ""
        
        # 登出Console
        Write-Host "1. 登出Console..." -ForegroundColor Cyan
        & claude /logout 2>$null
        
        # 清除环境变量
        Write-Host "2. 清除环境变量..." -ForegroundColor Cyan
        $envVars = @("ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL", "ANTHROPIC_API_URL", "CLAUDE_API_KEY")
        foreach ($var in $envVars) {
            Remove-Item "Env:$var" -ErrorAction SilentlyContinue
            [Environment]::SetEnvironmentVariable($var, $null, "User")
            Write-Host "   清除: $var" -ForegroundColor Gray
        }
        
        # 删除认证文件
        Write-Host "3. 删除认证文件..." -ForegroundColor Cyan
        $authPaths = @(
            "$env:USERPROFILE\.claude",
            "$env:USERPROFILE\.anthropic",
            "$env:USERPROFILE\.claude-code-router"
        )
        
        foreach ($path in $authPaths) {
            if (Test-Path $path) {
                Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "   删除: $path" -ForegroundColor Gray
            }
        }
        
        Write-Host "   ✅ 所有认证信息已清除" -ForegroundColor Green
        Write-Host ""
        Write-Host "现在你可以选择:" -ForegroundColor Yellow
        Write-Host "- 重新运行此脚本选择方案1 (月之暗面API)" -ForegroundColor White
        Write-Host "- 或运行 claude 登录Anthropic Console" -ForegroundColor White
    }
    
    default {
        Write-Host "无效选择，退出" -ForegroundColor Red
        exit 1
    }
}

# 测试连接
if ($choice -eq "1") {
    Write-Host ""
    Write-Host "4. 测试API连接..." -ForegroundColor Cyan
    try {
        $headers = @{
            "Authorization" = "Bearer $env:ANTHROPIC_API_KEY"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri "$env:ANTHROPIC_BASE_URL/models" -Headers $headers -Method Get -TimeoutSec 10
        Write-Host "   ✅ API连接成功! 找到 $($response.data.Count) 个模型" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "5. 测试Claude Code..." -ForegroundColor Cyan
        Write-Host "   现在可以运行: claude '你好，测试连接'" -ForegroundColor White
        
    } catch {
        Write-Host "   ❌ API连接失败: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   请检查网络连接和API密钥" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== 修复完成 ===" -ForegroundColor Green
Write-Host "建议重启PowerShell以确保环境变量生效" -ForegroundColor Yellow
