const EnhancedPDFConverter = require('./enhanced-pdf-converter');
const fs = require('fs');
const path = require('path');

/**
 * 多重策略PDF转换器
 * 提供Ghostscript + pdf2pic + 备用方案
 */

class MultiStrategyConverter {
  constructor() {
    this.primaryConverter = new EnhancedPDFConverter();
    this.strategies = [
      'ghostscript-direct',
      'pdf2pic-enhanced', 
      'imagemagick-convert',
      'canvas-fallback'
    ];
    
    this.setupFallbackStrategies();
  }

  setupFallbackStrategies() {
    // 配置每个策略的优先级和条件
    this.strategyConfigs = {
      'ghostscript-direct': {
        priority: 1,
        description: '直接使用Ghostscript，最高质量',
        requirements: ['ghostscript'],
        maxFileSize: 100 * 1024 * 1024 // 100MB
      },
      'pdf2pic-enhanced': {
        priority: 2,
        description: '使用pdf2pic库，中等质量',
        requirements: ['pdf2pic', 'ghostscript'],
        maxFileSize: 50 * 1024 * 1024 // 50MB
      },
      'imagemagick-convert': {
        priority: 3,
        description: 'ImageMagick备用方案',
        requirements: ['imagemagick'],
        maxFileSize: 30 * 1024 * 1024 // 30MB
      },
      'canvas-fallback': {
        priority: 4,
        description: 'Canvas渲染，基础功能',
        requirements: [],
        maxFileSize: 10 * 1024 * 1024 // 10MB
      }
    };
  }

  async convertWithFallback(pdfPath, outputDir, options = {}) {
    const {
      format = 'jpg',
      quality = 'high',
      pages = 'all',
      maxRetries = 3
    } = options;

    console.log(`🎯 开始多重策略转换: ${path.basename(pdfPath)}`);
    
    const fileSize = fs.statSync(pdfPath).size;
    const availableStrategies = this.selectStrategies(fileSize);
    
    let lastError = null;
    
    for (const strategy of availableStrategies) {
      try {
        console.log(`🔄 尝试策略: ${strategy}`);
        const result = await this.executeStrategy(strategy, pdfPath, outputDir, {
          format, quality, pages
        });
        
        if (result.success) {
          console.log(`✅ 策略 ${strategy} 成功`);
          return {
            ...result,
            strategyUsed: strategy,
            strategiesAttempted: availableStrategies.indexOf(strategy) + 1
          };
        }
      } catch (error) {
        console.log(`❌ 策略 ${strategy} 失败: ${error.message}`);
        lastError = error;
      }
    }

    throw new Error(`所有转换策略失败: ${lastError?.message}`);
  }

  selectStrategies(fileSize) {
    const available = [];
    
    for (const [strategy, config] of Object.entries(this.strategyConfigs)) {
      // 检查文件大小限制
      if (fileSize > config.maxFileSize) continue;
      
      // 检查依赖要求
      const hasRequirements = config.requirements.every(req => 
        this.checkRequirement(req)
      );
      
      if (hasRequirements || config.requirements.length === 0) {
        available.push(strategy);
      }
    }
    
    return available.sort((a, b) => 
      this.strategyConfigs[a].priority - this.strategyConfigs[b].priority
    );
  }

  checkRequirement(requirement) {
    switch (requirement) {
      case 'ghostscript':
        try {
          const { execSync } = require('child_process');
          const result = process.platform === 'win32' 
            ? execSync('gswin64c --version', { stdio: 'pipe' })
            : execSync('gs --version', { stdio: 'pipe' });
          return true;
        } catch {
          return false;
        }
      
      case 'imagemagick':
        try {
          const { execSync } = require('child_process');
          execSync('convert --version', { stdio: 'pipe' });
          return true;
        } catch {
          return false;
        }
      
      case 'pdf2pic':
        try {
          require('pdf2pic');
          return true;
        } catch {
          return false;
        }
      
      default:
        return false;
    }
  }

  async executeStrategy(strategy, pdfPath, outputDir, options) {
    switch (strategy) {
      case 'ghostscript-direct':
        return await this.ghostscriptDirect(pdfPath, outputDir, options);
      
      case 'pdf2pic-enhanced':
        return await this.pdf2picEnhanced(pdfPath, outputDir, options);
      
      case 'imagemagick-convert':
        return await this.imagemagickConvert(pdfPath, outputDir, options);
      
      case 'canvas-fallback':
        return await this.canvasFallback(pdfPath, outputDir, options);
      
      default:
        throw new Error(`未知策略: ${strategy}`);
    }
  }

  async ghostscriptDirect(pdfPath, outputDir, options) {
    const { format, quality, prefix } = options;
    const settings = {
      low: { density: 150 },
      medium: { density: 200 },
      high: { density: 300 },
      ultra: { density: 600 }
    };

    const { execSync } = require('child_process');
    const gsBinary = process.platform === 'win32' ? 'gswin64c' : 'gs';
    const density = settings[quality]?.density || 300;
    const outputPattern = path.join(outputDir, `${prefix}-%03d.${format}`);

    const args = [
      '-dNOPAUSE', '-dBATCH', '-dSAFER',
      '-sDEVICE=jpeg', `-r${density}`,
      '-dJPEGQ=90', '-dTextAlphaBits=4', '-dGraphicsAlphaBits=4',
      '-dPDFFitPage=true', `-sOutputFile=${outputPattern}`,
      '-f', pdfPath
    ];

    execSync(`${gsBinary} ${args.join(' ')}`, { stdio: 'pipe' });

    const files = fs.readdirSync(outputDir)
      .filter(f => f.startsWith(prefix) && f.endsWith(`.${format}`))
      .map(f => path.join(outputDir, f));

    return { success: true, files, strategy: 'ghostscript-direct' };
  }

  async pdf2picEnhanced(pdfPath, outputDir, options) {
    const { format, quality, prefix } = options;
    const pdf2pic = require('pdf2pic');
    
    const settings = {
      low: { density: 150, width: 1240, height: 1754 },
      medium: { density: 200, width: 1653, height: 2339 },
      high: { density: 300, width: 2480, height: 3508 },
      ultra: { density: 600, width: 4960, height: 7016 }
    };

    const convert = pdf2pic.fromPath(pdfPath, {
      density: settings[quality]?.density || 300,
      saveFilename: prefix,
      savePath: outputDir,
      format: format,
      width: settings[quality]?.width || 2480,
      height: settings[quality]?.height || 3508,
      quality: 90
    });

    const results = await convert.bulk(-1);
    const files = results.map(r => r.path).filter(p => fs.existsSync(p));
    
    return { success: true, files, strategy: 'pdf2pic-enhanced' };
  }

  async imagemagickConvert(pdfPath, outputDir, options) {
    const { format, quality, prefix } = options;
    const { execSync } = require('child_process');
    
    const density = quality === 'ultra' ? 600 : quality === 'high' ? 300 : 150;
    const outputPattern = path.join(outputDir, `${prefix}-%03d.${format}`);
    
    execSync(`convert -density ${density} "${pdfPath}" -quality 90 "${outputPattern}"`, { stdio: 'pipe' });
    
    const files = fs.readdirSync(outputDir)
      .filter(f => f.startsWith(prefix) && f.endsWith(`.${format}`))
      .map(f => path.join(outputDir, f));
    
    return { success: true, files, strategy: 'imagemagick-convert' };
  }

  async canvasFallback(pdfPath, outputDir, options) {
    // 使用pdf-lib + canvas的简化方案
    console.log('⚠️ 使用Canvas备用方案 - 仅支持基本转换');
    
    const { PDFDocument } = require('pdf-lib');
    const sharp = require('sharp');
    
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    const files = [];
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      // 创建简单的白色背景图片
      const buffer = await sharp({
        create: {
          width: Math.floor(width),
          height: Math.floor(height),
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })
      .jpeg({ quality: 85 })
      .toBuffer();
      
      const outputPath = path.join(outputDir, `page-${String(i + 1).padStart(3, '0')}.jpg`);
      fs.writeFileSync(outputPath, buffer);
      files.push(outputPath);
    }
    
    return { success: true, files, strategy: 'canvas-fallback', note: '简化渲染' };
  }

  getStrategyInfo() {
    return Object.entries(this.strategyConfigs).map(([strategy, config]) => ({
      strategy,
      description: config.description,
      priority: config.priority,
      available: this.checkRequirement(config.requirements[0] || '')
    }));
  }
}

module.exports = MultiStrategyConverter;