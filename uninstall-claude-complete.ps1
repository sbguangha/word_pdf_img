# Claude Code 完全卸载脚本
Write-Host "=== Claude Code 完全卸载脚本 ===" -ForegroundColor Red
Write-Host "此脚本将完全删除Claude Code及其所有配置文件" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "确定要继续吗? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "操作已取消" -ForegroundColor Yellow
    exit
}

Write-Host "开始卸载Claude Code..." -ForegroundColor Green

# 1. 停止可能运行的Claude进程
Write-Host "1. 停止Claude进程..." -ForegroundColor Cyan
Get-Process -Name "claude*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.ProcessName -like "*claude*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. 卸载npm包
Write-Host "2. 卸载npm包..." -ForegroundColor Cyan
try {
    npm uninstall -g claude-code 2>$null
    npm uninstall -g @anthropic-ai/claude-code 2>$null
    Write-Host "   ✅ npm包卸载完成" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ npm包卸载可能失败或不存在" -ForegroundColor Yellow
}

# 3. 删除全局npm安装的claude脚本
Write-Host "3. 删除全局npm脚本..." -ForegroundColor Cyan
$npmGlobalPath = npm config get prefix 2>$null
if ($npmGlobalPath) {
    $claudeFiles = @(
        "$npmGlobalPath\claude.ps1",
        "$npmGlobalPath\claude.cmd",
        "$npmGlobalPath\claude",
        "$npmGlobalPath\node_modules\.bin\claude.ps1",
        "$npmGlobalPath\node_modules\.bin\claude.cmd",
        "$npmGlobalPath\node_modules\.bin\claude"
    )
    
    foreach ($file in $claudeFiles) {
        if (Test-Path $file) {
            Remove-Item $file -Force -ErrorAction SilentlyContinue
            Write-Host "   删除: $file" -ForegroundColor Gray
        }
    }
}

# 4. 删除用户npm全局目录中的claude文件
Write-Host "4. 删除用户npm目录中的claude文件..." -ForegroundColor Cyan
$userNpmPaths = @(
    "$env:USERPROFILE\.npm-global",
    "$env:USERPROFILE\AppData\Roaming\npm",
    "$env:APPDATA\npm"
)

foreach ($path in $userNpmPaths) {
    if (Test-Path $path) {
        $claudeFiles = Get-ChildItem -Path $path -Name "claude*" -ErrorAction SilentlyContinue
        foreach ($file in $claudeFiles) {
            $fullPath = Join-Path $path $file
            Remove-Item $fullPath -Force -ErrorAction SilentlyContinue
            Write-Host "   删除: $fullPath" -ForegroundColor Gray
        }
    }
}

# 5. 删除Claude配置文件和数据
Write-Host "5. 删除Claude配置文件..." -ForegroundColor Cyan
$configPaths = @(
    "$env:USERPROFILE\.claude",
    "$env:USERPROFILE\.claude.json",
    "$env:USERPROFILE\.claude.json.backup",
    "$env:USERPROFILE\.claude-code-router",
    "$env:USERPROFILE\AppData\Local\claude-code",
    "$env:USERPROFILE\AppData\Roaming\claude-code"
)

foreach ($path in $configPaths) {
    if (Test-Path $path) {
        Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   删除: $path" -ForegroundColor Gray
    }
}

# 6. 清除环境变量
Write-Host "6. 清除环境变量..." -ForegroundColor Cyan
$envVars = @(
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_BASE_URL",
    "ANTHROPIC_API_URL",
    "CLAUDE_API_KEY",
    "CLAUDE_BASE_URL",
    "CLAUDE_CODE_SSE_PORT"
)

foreach ($var in $envVars) {
    [Environment]::SetEnvironmentVariable($var, $null, "User")
    [Environment]::SetEnvironmentVariable($var, $null, "Machine")
    Remove-Item "Env:$var" -ErrorAction SilentlyContinue
    Write-Host "   清除环境变量: $var" -ForegroundColor Gray
}

# 7. 清除PATH中的claude相关路径
Write-Host "7. 清理PATH环境变量..." -ForegroundColor Cyan
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath) {
    $pathArray = $userPath.Split(';') | Where-Object { $_ -notlike "*claude*" -and $_ -notlike "*\.npm-global*" }
    $newPath = $pathArray -join ';'
    [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
    Write-Host "   ✅ PATH清理完成" -ForegroundColor Green
}

# 8. 检查是否还有残留
Write-Host "8. 检查残留文件..." -ForegroundColor Cyan
$claudeCommand = Get-Command claude -ErrorAction SilentlyContinue
if ($claudeCommand) {
    Write-Host "   ⚠️ 警告: 仍然找到claude命令在: $($claudeCommand.Source)" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ 未找到claude命令残留" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== 卸载完成 ===" -ForegroundColor Green
Write-Host "建议重启PowerShell或命令提示符以确保所有更改生效" -ForegroundColor Yellow
Write-Host ""
Write-Host "如需重新安装，请运行: install-claude-fresh.ps1" -ForegroundColor Cyan
