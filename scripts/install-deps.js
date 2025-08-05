#!/usr/bin/env node

/**
 * 离线安装Ghostscript和GraphicsMagick
 * 使用本地安装包或手动下载方案
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class DependencyInstaller {
  constructor() {
    this.platform = process.platform;
    this.arch = process.arch;
    this.isWindows = this.platform === 'win32';
  }

  async installAll() {
    console.log('🚀 开始安装PDF转换依赖...\n');
    
    try {
      await this.installGhostscript();
      await this.installGraphicsMagick();
      await this.verifyInstallation();
      
      console.log('\n✅ 依赖安装完成！');
    } catch (error) {
      console.error('❌ 安装失败:', error.message);
      this.showManualInstructions();
    }
  }

  async installGhostscript() {
    console.log('📦 安装Ghostscript...');
    
    if (this.isWindows) {
      // Windows: 使用Chocolatey或手动下载
      try {
        // 检查Chocolatey
        execSync('choco --version', { stdio: 'pipe' });
        console.log('   使用Chocolatey安装Ghostscript...');
        execSync('choco install ghostscript -y', { stdio: 'inherit' });
      } catch (e) {
        // Chocolatey不可用，提供手动下载链接
        console.log('   Chocolatey未找到，请手动安装:');
        console.log('   1. 访问: https://github.com/ArtifexSoftware/ghostpdl-downloads/releases');
        console.log('   2. 下载: gs10021w64.exe (64位)');
        console.log('   3. 运行安装程序');
        
        // 创建批处理文件帮助
        this.createBatchInstaller('ghostscript');
      }
    } else {
      // Linux/macOS
      try {
        if (this.platform === 'linux') {
          console.log('   使用apt安装...');
          execSync('sudo apt-get update && sudo apt-get install ghostscript -y', { stdio: 'inherit' });
        } else {
          console.log('   使用brew安装...');
          execSync('brew install ghostscript', { stdio: 'inherit' });
        }
      } catch (e) {
        console.log('   包管理器不可用，请手动安装');
      }
    }
  }

  async installGraphicsMagick() {
    console.log('\n📦 安装GraphicsMagick...');
    
    if (this.isWindows) {
      try {
        // 检查Chocolatey
        execSync('choco --version', { stdio: 'pipe' });
        console.log('   使用Chocolatey安装GraphicsMagick...');
        execSync('choco install graphicsmagick -y', { stdio: 'inherit' });
      } catch (e) {
        console.log('   Chocolatey未找到，请手动安装:');
        console.log('   1. 访问: http://www.graphicsmagick.org/download.html');
        console.log('   2. 下载Windows版本');
        console.log('   3. 运行安装程序');
        
        this.createBatchInstaller('graphicsmagick');
      }
    } else {
      try {
        if (this.platform === 'linux') {
          console.log('   使用apt安装...');
          execSync('sudo apt-get install graphicsmagick -y', { stdio: 'inherit' });
        } else {
          console.log('   使用brew安装...');
          execSync('brew install graphicsmagick', { stdio: 'inherit' });
        }
      } catch (e) {
        console.log('   包管理器不可用，请手动安装');
      }
    }
  }

  createBatchInstaller(tool) {
    const batchFile = path.join(__dirname, `install-${tool}.bat`);
    const content = tool === 'ghostscript' 
      ? `@echo off
echo 正在安装Ghostscript...
powershell -Command "Start-Process 'https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs10021/gs10021w64.exe' -Wait"
echo 请按照安装向导完成安装`
      : `@echo off
echo 正在安装GraphicsMagick...
powershell -Command "Start-Process 'http://downloads.sourceforge.net/graphicsmagick/GraphicsMagick-1.3.40-Q16-win64-dll.exe' -Wait"
echo 请按照安装向导完成安装`;

    fs.writeFileSync(batchFile, content);
    console.log(`   📁 已创建安装助手: ${batchFile}`);
  }

  async verifyInstallation() {
    console.log('\n🔍 验证安装...');
    
    const checks = [
      { name: 'Ghostscript', cmd: this.isWindows ? 'gswin64c --version' : 'gs --version' },
      { name: 'GraphicsMagick', cmd: 'gm version' }
    ];

    for (const check of checks) {
      try {
        const result = execSync(check.cmd, { encoding: 'utf8', stdio: 'pipe' });
        const version = result.split('\n')[0];
        console.log(`   ✅ ${check.name}: ${version}`);
      } catch (error) {
        console.log(`   ❌ ${check.name}: 未找到`);
      }
    }
  }

  showManualInstructions() {
    console.log('\n📋 手动安装指南:');
    console.log('=' * 40);
    
    if (this.isWindows) {
      console.log(`
Windows 手动安装:
1. Ghostscript:
   - 下载: https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs10021/gs10021w64.exe
   - 运行安装程序，选择完整安装
   - 重启命令提示符

2. GraphicsMagick:
   - 下载: https://sourceforge.net/projects/graphicsmagick/files/graphicsmagick-binaries/1.3.40/
   - 选择对应系统版本安装

验证:
   gswin64c --version
   gm version
      `);
    } else {
      console.log(`
Linux/macOS 手动安装:
Ubuntu/Debian: sudo apt-get install ghostscript graphicsmagick
CentOS/RHEL: sudo yum install ghostscript graphicsmagick
macOS: brew install ghostscript graphicsmagick
      `);
    }
  }
}

// 运行安装
if (require.main === module) {
  const installer = new DependencyInstaller();
  installer.installAll().catch(console.error);
}

module.exports = DependencyInstaller;