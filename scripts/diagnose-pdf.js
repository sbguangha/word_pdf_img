#!/usr/bin/env node

/**
 * PDF转换环境诊断脚本
 * 检测系统依赖、权限、字体等关键要素
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class PDFDiagnostics {
  constructor() {
    this.results = {
      system: {},
      dependencies: {},
      permissions: {},
      fonts: {},
      recommendations: []
    };
  }

  async run() {
    console.log('🔍 PDF转换环境诊断开始...\n');
    
    await this.checkSystem();
    await this.checkDependencies();
    await this.checkPermissions();
    await this.checkFonts();
    await this.generateReport();
    
    return this.results;
  }

  async checkSystem() {
    console.log('📊 系统环境检测...');
    
    this.results.system = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cwd: process.cwd(),
      isWindows: process.platform === 'win32',
      isLinux: process.platform === 'linux',
      isMac: process.platform === 'darwin'
    };

    console.log(`   ✅ 平台: ${this.results.system.platform}`);
    console.log(`   ✅ Node.js: ${this.results.system.nodeVersion}`);
  }

  async checkDependencies() {
    console.log('\n🔧 核心依赖检测...');
    
    const deps = [
      { name: 'Ghostscript', windows: 'gswin64c', linux: 'gs', mac: 'gs' },
      { name: 'GraphicsMagick', windows: 'gm', linux: 'gm', mac: 'gm' },
      { name: 'ImageMagick', windows: 'convert', linux: 'convert', mac: 'convert' }
    ];

    for (const dep of deps) {
      const cmd = this.results.system.isWindows ? dep.windows : dep.linux;
      try {
        const result = execSync(`${cmd} --version`, { encoding: 'utf8', stdio: 'pipe' });
        this.results.dependencies[dep.name] = {
          installed: true,
          version: result.split('\n')[0],
          path: this.findCommandPath(cmd)
        };
        console.log(`   ✅ ${dep.name}: ${this.results.dependencies[dep.name].version}`);
      } catch (error) {
        this.results.dependencies[dep.name] = {
          installed: false,
          error: error.message
        };
        console.log(`   ❌ ${dep.name}: 未安装`);
        this.results.recommendations.push(`安装${dep.name}`);
      }
    }
  }

  async checkPermissions() {
    console.log('\n🔐 权限检查...');
    
    const dirs = [
      path.join(__dirname, '../server/uploads'),
      path.join(__dirname, '../server/outputs'),
      path.join(__dirname, '../temp')
    ];

    for (const dir of dirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`   📁 创建目录: ${dir}`);
        }
        
        fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK);
        this.results.permissions[dir] = { 
          accessible: true,
          exists: true 
        };
        console.log(`   ✅ ${dir}: 可读写`);
      } catch (error) {
        this.results.permissions[dir] = { 
          accessible: false, 
          error: error.message 
        };
        console.log(`   ❌ ${dir}: 权限问题 - ${error.message}`);
      }
    }
  }

  async checkFonts() {
    console.log('\n📝 字体检测...');
    
    if (this.results.system.isWindows) {
      // Windows字体检查
      const fontPaths = [
        'C:\\Windows\\Fonts\\simsun.ttc',
        'C:\\Windows\\Fonts\\simhei.ttf',
        'C:\\Windows\\Fonts\\msyh.ttc'
      ];
      
      for (const fontPath of fontPaths) {
        if (fs.existsSync(fontPath)) {
          this.results.fonts[path.basename(fontPath)] = true;
          console.log(`   ✅ 中文字体: ${path.basename(fontPath)}`);
        }
      }
    } else {
      // Linux/Mac字体检查
      try {
        const fonts = execSync('fc-list | grep -i "chinese\|CN\|zh"', { 
          encoding: 'utf8', 
          stdio: 'pipe' 
        });
        this.results.fonts.chineseFonts = fonts.split('\n').filter(f => f.trim());
        console.log(`   ✅ 找到 ${this.results.fonts.chineseFonts.length} 个中文字体`);
      } catch (error) {
        console.log('   ⚠️ 字体检测跳过');
      }
    }
  }

  findCommandPath(command) {
    try {
      const result = execSync(
        this.results.system.isWindows ? `where ${command}` : `which ${command}`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      return result.trim();
    } catch (error) {
      return null;
    }
  }

  async generateReport() {
    console.log('\n📋 诊断报告:');
    console.log('=' * 50);
    
    const reportPath = path.join(__dirname, '../logs/diagnosis-report.json');
    const logDir = path.dirname(reportPath);
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // 关键问题总结
    const criticalIssues = [];
    
    if (!this.results.dependencies.Ghostscript?.installed) {
      criticalIssues.push('❗ Ghostscript未安装 - PDF转换必需');
    }
    
    if (!this.results.dependencies['GraphicsMagick']?.installed) {
      criticalIssues.push('⚠️ GraphicsMagick未安装 - 推荐安装');
    }
    
    Object.entries(this.results.permissions).forEach(([dir, status]) => {
      if (!status.accessible) {
        criticalIssues.push(`❗ 目录权限问题: ${dir}`);
      }
    });
    
    console.log('\n🔍 关键发现:');
    criticalIssues.forEach(issue => console.log(`   ${issue}`));
    
    console.log(`\n📄 详细报告已保存: ${reportPath}`);
    
    if (criticalIssues.length === 0) {
      console.log('✅ 环境检测通过，准备下一步...');
    } else {
      console.log(`🎯 发现 ${criticalIssues.length} 个关键问题需要修复`);
    }
  }
}

// 运行诊断
if (require.main === module) {
  const diagnostics = new PDFDiagnostics();
  diagnostics.run().catch(console.error);
}

module.exports = PDFDiagnostics;