@echo off
echo 正在打开Ghostscript下载页面...
start https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs10021/gs10021w64.exe
echo.
echo 📋 安装步骤：
echo 1. 点击上面的链接下载 gs10021w64.exe
echo 2. 运行下载的安装程序
echo 3. 选择默认安装路径
echo 4. 完成安装后重启命令提示符
echo.
echo 🔍 验证安装：
echo 运行: gswin64c --version
echo 应该显示版本号