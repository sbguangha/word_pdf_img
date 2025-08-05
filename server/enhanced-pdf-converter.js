const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * 增强版PDF转图片转换器
 * 解决Ghostscript路径和配置问题
 */

class EnhancedPDFConverter {
  constructor() {
    this.setupEnvironment();
    this.conversionOptions = {
      ghostscript: {
        binary: this.findGhostscript(),
        quality: {
          low: { density: 150, width: 1240, height: 1754 },
          medium: { density: 200, width: 1653, height: 2339 },
          high: { density: 300, width: 2480, height: 3508 },
          ultra: { density: 600, width: 4960, height: 7016 }
        }
      }
    };
  }

  setupEnvironment() {
    // 配置环境变量
    const gsPath = this.findGhostscript();
    if (gsPath) {
      // 确保Ghostscript在PATH中
      const paths = (process.env.PATH || '').split(path.delimiter);
      const gsDir = path.dirname(gsPath);
      
      if (!paths.includes(gsDir)) {
        process.env.PATH = `${gsDir}${path.delimiter}${process.env.PATH}`;
      }
    }
  }

  findGhostscript() {
    const possiblePaths = [
      // Windows
      'C:\\Program Files\\gs\\gs10.02.1\\bin\\gswin64c.exe',
      'C:\\Program Files (x86)\\gs\\gs10.02.1\\bin\\gswin32c.exe',
      'C:\\Program Files\\gs\\gs10.02.0\\bin\\gswin64c.exe',
      'C:\\Program Files\\gs\\gs9.56.1\\bin\\gswin64c.exe',
      // Linux/macOS
      '/usr/bin/gs',
      '/usr/local/bin/gs',
      '/opt/homebrew/bin/gs'
    ];

    for (const gsPath of possiblePaths) {
      if (fs.existsSync(gsPath)) {
        console.log(`✅ 找到Ghostscript: ${gsPath}`);
        return gsPath;
      }
    }

    try {
      // 尝试从PATH查找
      const result = process.platform === 'win32' 
        ? execSync('where gswin64c', { encoding: 'utf8' }).trim()
        : execSync('which gs', { encoding: 'utf8' }).trim();
      return result;
    } catch (error) {
      console.error('❌ 未找到Ghostscript');
      throw new Error('Ghostscript未安装或不在PATH中');
    }
  }

  async convertPdfToImages(pdfPath, outputDir, options = {}) {
    const {
      format = 'jpg',
      quality = 'high',
      pages = 'all',
      prefix = 'page'
    } = options;

    const settings = this.conversionOptions.ghostscript.quality[quality];
    const gsBinary = this.conversionOptions.ghostscript.binary;

    console.log(`🔄 开始转换: ${path.basename(pdfPath)}`);
    console.log(`   格式: ${format}, 质量: ${quality}, 页面: ${pages}`);

    try {
      const results = await this.executeGhostscript(
        pdfPath, 
        outputDir, 
        settings, 
        format, 
        prefix, 
        pages
      );

      return {
        success: true,
        files: results,
        pages: results.length,
        format,
        quality
      };
    } catch (error) {
      console.error('❌ Ghostscript转换失败:', error.message);
      return await this.fallbackConversion(pdfPath, outputDir, options);
    }
  }

  async executeGhostscript(pdfPath, outputDir, settings, format, prefix, pages) {
    return new Promise((resolve, reject) => {
      const outputPattern = path.join(outputDir, `${prefix}-%03d.${format}`);
      const args = [
        '-dNOPAUSE',
        '-dBATCH',
        '-dSAFER',
        '-sDEVICE=jpeg',
        '-r' + settings.density,
        '-dJPEGQ=85',
        '-dTextAlphaBits=4',
        '-dGraphicsAlphaBits=4',
        '-dPDFFitPage=true',
        '-sOutputFile=' + outputPattern,
        '-f',
        pdfPath
      ];

      // 页面范围处理
      if (pages !== 'all') {
        if (Array.isArray(pages)) {
          args.splice(-1, 0, '-dFirstPage=' + pages[0], '-dLastPage=' + pages[pages.length - 1]);
        } else if (typeof pages === 'string' && pages.includes('-')) {
          const [start, end] = pages.split('-').map(Number);
          args.splice(-1, 0, '-dFirstPage=' + start, '-dLastPage=' + end);
        }
      }

      const gsProcess = spawn(this.conversionOptions.ghostscript.binary, args);
      let stderr = '';

      gsProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      gsProcess.on('close', (code) => {
        if (code === 0) {
          const files = fs.readdirSync(outputDir)
            .filter(f => f.startsWith(prefix) && f.endsWith(`.${format}`))
            .sort()
            .map(f => path.join(outputDir, f));
          
          resolve(files);
        } else {
          reject(new Error(`Ghostscript错误: ${stderr}`));
        }
      });

      gsProcess.on('error', (error) => {
        reject(new Error(`Ghostscript进程错误: ${error.message}`));
      });
    });
  }

  async fallbackConversion(pdfPath, outputDir, options) {
    console.log('🔄 使用备用转换方案...');
    
    try {
      // 使用pdf-poppler作为备用
      const pdf2pic = require('pdf2pic');
      const { quality, format, prefix } = options;
      
      const settings = this.conversionOptions.ghostscript.quality[quality];
      
      const convert = pdf2pic.fromPath(pdfPath, {
        density: settings.density,
        saveFilename: prefix,
        savePath: outputDir,
        format: format,
        width: settings.width,
        height: settings.height,
        quality: 85
      });

      const results = await convert.bulk(-1);
      return results.map(r => r.path).filter(p => fs.existsSync(p));
      
    } catch (error) {
      console.error('❌ 备用方案也失败:', error.message);
      throw error;
    }
  }

  async createZipBundle(imageFiles, outputPath) {
    const JSZip = require('jszip');
    const zip = new JSZip();

    for (let i = 0; i < imageFiles.length; i++) {
      const buffer = fs.readFileSync(imageFiles[i]);
      const filename = `page-${String(i + 1).padStart(3, '0')}.jpg`;
      zip.file(filename, buffer);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(outputPath, zipBuffer);
    
    return outputPath;
  }
}

module.exports = EnhancedPDFConverter;