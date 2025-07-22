# FormatMagic Docker 环境测试脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FormatMagic Docker 环境测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查Docker版本
Write-Host "1. 检查Docker版本..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker已安装: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker未安装或未启动" -ForegroundColor Red
    Write-Host "请先安装并启动Docker Desktop" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

Write-Host ""

# 2. 检查Docker服务状态
Write-Host "2. 检查Docker服务状态..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker服务正常运行" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker服务未启动" -ForegroundColor Red
    Write-Host "请启动Docker Desktop并等待完全启动" -ForegroundColor Red
    Write-Host "启动方法：开始菜单 → Docker Desktop" -ForegroundColor Yellow
    Read-Host "按回车键退出"
    exit 1
}

Write-Host ""

# 3. 检查Docker Compose
Write-Host "3. 检查Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker compose version
    Write-Host "✅ Docker Compose可用: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose不可用" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

Write-Host ""

# 4. 测试Docker基本功能
Write-Host "4. 测试Docker基本功能..." -ForegroundColor Yellow
Write-Host "正在拉取测试镜像..." -ForegroundColor Gray

try {
    docker pull hello-world | Out-Null
    Write-Host "✅ 镜像拉取成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 无法拉取Docker镜像，请检查网络连接" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

Write-Host "正在运行测试容器..." -ForegroundColor Gray
try {
    docker run --rm hello-world
    Write-Host "✅ Docker基本功能正常" -ForegroundColor Green
} catch {
    Write-Host "❌ 无法运行Docker容器" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

Write-Host ""

# 5. 检查项目文件
Write-Host "5. 检查项目文件..." -ForegroundColor Yellow
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ 找不到docker-compose.yml文件" -ForegroundColor Red
    Write-Host "请确保在项目根目录运行此脚本" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}
Write-Host "✅ 项目文件完整" -ForegroundColor Green

Write-Host ""

# 6. 检查和创建数据目录
Write-Host "6. 检查数据目录..." -ForegroundColor Yellow
$directories = @("data", "data\uploads", "data\outputs", "data\temp")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "📁 创建目录: $dir" -ForegroundColor Gray
    }
}
Write-Host "✅ 数据目录已准备" -ForegroundColor Green

Write-Host ""

# 7. 显示系统信息
Write-Host "7. 系统信息..." -ForegroundColor Yellow
$dockerInfo = docker system df
Write-Host $dockerInfo -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 Docker环境测试完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步操作选择：" -ForegroundColor Yellow
Write-Host "1. 运行开发环境: docker compose up --build" -ForegroundColor White
Write-Host "2. 运行部署脚本: .\deploy.sh (需要Git Bash)" -ForegroundColor White
Write-Host "3. 手动启动: 按照下面的步骤操作" -ForegroundColor White
Write-Host ""

$choice = Read-Host "是否现在启动开发环境？(y/n)"
if ($choice -eq "y" -or $choice -eq "Y") {
    Write-Host ""
    Write-Host "🚀 启动FormatMagic开发环境..." -ForegroundColor Green
    Write-Host "这可能需要几分钟时间来下载和构建镜像..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        docker compose up --build
    } catch {
        Write-Host "❌ 启动失败，请检查错误信息" -ForegroundColor Red
        Read-Host "按回车键退出"
    }
} else {
    Write-Host ""
    Write-Host "📝 手动启动步骤：" -ForegroundColor Yellow
    Write-Host "1. 打开PowerShell或命令提示符" -ForegroundColor White
    Write-Host "2. 进入项目目录: cd E:\1_CODE\word_pdf_img" -ForegroundColor White
    Write-Host "3. 运行: docker compose up --build" -ForegroundColor White
    Write-Host "4. 等待构建完成后访问: http://localhost" -ForegroundColor White
    Write-Host ""
    Read-Host "按回车键退出"
}
