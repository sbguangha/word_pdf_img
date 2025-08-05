const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { PDFDocument, rgb } = require('pdf-lib');

// 创建日志文件
const logFile = path.join(__dirname, 'conversion.log');
function log(message) {
  const timestamp = new Date().toLocaleString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logMessage);
}

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 创建上传和输出目录
const uploadsDir = path.join(__dirname, 'uploads');
const outputsDir = path.join(__dirname, 'outputs');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
}

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000000000);
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, `${timestamp}-${randomNum}-${originalName}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB限制
  }
});

// 改进的PDF转图片函数 - 修复版
const convertPdfToImageImproved = async (inputPath, outputPath) => {
  try {
    log('=== 开始改进版PDF转图片 ===');
    log('输入文件: ' + inputPath);
    log('输出文件: ' + outputPath);
    log('当前时间: ' + new Date().toLocaleString());

    // 方法1: 使用PDF.js进行真实渲染 - 修复版
    try {
      log('🎯 === 方案1: 使用PDF.js进行真实PDF渲染（修复版） ===');

      // 设置Node.js环境的polyfills
      const canvas = require('canvas');
      const { Image } = canvas;

      // 为PDF.js设置必要的全局变量和polyfills
      if (typeof global.DOMMatrix === 'undefined') {
        global.DOMMatrix = class DOMMatrix {
          constructor(init) {
            if (Array.isArray(init)) {
              this.a = init[0] || 1; this.b = init[1] || 0; this.c = init[2] || 0;
              this.d = init[3] || 1; this.e = init[4] || 0; this.f = init[5] || 0;
            } else {
              this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
            }
          }
        };
      }

      // 设置Canvas Image polyfill
      if (typeof global.Image === 'undefined') {
        global.Image = Image;
      }

      // 设置Canvas polyfill
      if (typeof global.HTMLCanvasElement === 'undefined') {
        global.HTMLCanvasElement = canvas.Canvas;
      }

      // 动态导入pdfjs-dist
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

      // 设置worker路径（避免worker相关错误）
      pdfjsLib.GlobalWorkerOptions.workerSrc = null;

      log('✅ PDF.js导入成功');

      // 读取PDF文件并转换为正确格式
      const pdfBuffer = fs.readFileSync(inputPath);
      const pdfData = new Uint8Array(pdfBuffer);

      // 加载PDF文档 - 使用兼容性配置
      const loadingTask = pdfjsLib.getDocument({
        data: pdfData,
        verbosity: 0,
        disableWorker: true,  // 禁用worker避免兼容性问题
        isEvalSupported: false,
        disableAutoFetch: true,
        disableStream: true
      });

      const pdfDocument = await loadingTask.promise;
      log(`✅ PDF加载成功，共${pdfDocument.numPages}页`);

      // 按页拆分渲染 - 每页生成独立图片
      const totalPages = pdfDocument.numPages;
      log(`📄 准备按页拆分渲染PDF，共${totalPages}页`);

      // 创建输出目录（以时间戳命名）
      const timestamp = Date.now();
      const outputDir = path.join(path.dirname(outputPath), `pdf-pages-${timestamp}`);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const pageFiles = [];
      const renderScale = 2.5; // 高分辨率渲染

      // 渲染每一页为独立图片 - 修复版
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        log(`🖼️ 渲染第${pageNum}页为独立图片...`);

        try {
          // 获取当前页面
          const page = await pdfDocument.getPage(pageNum);

          // 获取页面视口尺寸（所见即所得）
          const viewport = page.getViewport({ scale: renderScale });
          const pageWidth = Math.ceil(viewport.width);
          const pageHeight = Math.ceil(viewport.height);

          log(`📐 第${pageNum}页尺寸: ${pageWidth} x ${pageHeight}`);

          // 为当前页面创建独立Canvas
          const pageCanvas = canvas.createCanvas(pageWidth, pageHeight);
          const pageContext = pageCanvas.getContext('2d');

          // 设置白色背景
          pageContext.fillStyle = 'white';
          pageContext.fillRect(0, 0, pageWidth, pageHeight);

          // 增强的渲染上下文 - 添加Canvas兼容性支持
          const renderContext = {
            canvasContext: pageContext,
            viewport: viewport,
            // 添加图像处理支持
            canvasFactory: {
              create: (width, height) => {
                const canvasElement = canvas.createCanvas(width, height);
                return {
                  canvas: canvasElement,
                  context: canvasElement.getContext('2d')
                };
              },
              reset: (canvasAndContext, width, height) => {
                canvasAndContext.canvas.width = width;
                canvasAndContext.canvas.height = height;
              },
              destroy: (canvasAndContext) => {
                // 清理资源
                canvasAndContext.canvas.width = 0;
                canvasAndContext.canvas.height = 0;
              }
            }
          };

          await page.render(renderContext).promise;

          // 保存当前页面为独立图片文件
          const pageFilename = `page-${pageNum.toString().padStart(3, '0')}.jpg`;
          const pageFilePath = path.join(outputDir, pageFilename);

          const pageBuffer = pageCanvas.toBuffer('image/jpeg', { quality: 0.95 });
          fs.writeFileSync(pageFilePath, pageBuffer);

          const pageStats = fs.statSync(pageFilePath);
          log(`✅ 第${pageNum}页保存成功: ${pageFilename} (${(pageStats.size / 1024).toFixed(2)} KB)`);

          pageFiles.push({
            filename: pageFilename,
            path: pageFilePath,
            size: pageStats.size,
            width: pageWidth,
            height: pageHeight
          });

        } catch (pageError) {
          log(`❌ 第${pageNum}页渲染失败: ${pageError.message}`);
          // 继续渲染其他页面
        }
      }

      if (pageFiles.length === 0) {
        throw new Error('没有成功渲染任何页面');
      }

      log(`✅ 成功渲染${pageFiles.length}/${totalPages}页`);

      // 创建ZIP文件包含所有页面
      const JSZip = require('jszip');
      const zip = new JSZip();

      // 添加所有页面图片到ZIP
      for (const pageFile of pageFiles) {
        const imageBuffer = fs.readFileSync(pageFile.path);
        zip.file(pageFile.filename, imageBuffer);
      }

      // 添加信息文件
      const infoText = `PDF转换信息
原文件: ${path.basename(inputPath)}
总页数: ${totalPages}
成功转换: ${pageFiles.length}页
渲染比例: ${renderScale}x
生成时间: ${new Date().toLocaleString()}

页面详情:
${pageFiles.map((f, i) => `第${i+1}页: ${f.filename} (${f.width}x${f.height}, ${(f.size/1024).toFixed(2)}KB)`).join('\n')}
`;

      zip.file('conversion-info.txt', infoText);

      // 生成ZIP文件
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      const zipFilename = `pdf-pages-${timestamp}.zip`;
      const zipPath = path.join(path.dirname(outputPath), zipFilename);
      fs.writeFileSync(zipPath, zipBuffer);

      const zipStats = fs.statSync(zipPath);
      log(`📦 ZIP文件创建成功: ${zipFilename} (${(zipStats.size / 1024).toFixed(2)} KB)`);

      // 清理临时目录
      try {
        for (const pageFile of pageFiles) {
          fs.unlinkSync(pageFile.path);
        }
        fs.rmdirSync(outputDir);
        log('🧹 临时文件清理完成');
      } catch (cleanupError) {
        log('⚠️ 临时文件清理失败: ' + cleanupError.message);
      }

      // 返回ZIP文件路径
      return zipPath;

    } catch (pdfjsError) {
      log('❌ PDF.js渲染失败，尝试备用方案: ' + pdfjsError.message);
      log('错误详情: ' + pdfjsError.stack);
    }

    // 方法1.5: 使用pdf-parse提取文本内容生成真实内容图片
    try {
      log('📝 === 方案1.5: 使用pdf-parse提取PDF文本内容 ===');
      const pdfParse = require('pdf-parse');

      const pdfBuffer = fs.readFileSync(inputPath);
      const pdfData = await pdfParse(pdfBuffer);

      log(`✅ PDF文本提取成功，共${pdfData.numpages}页`);
      log(`📄 文本长度: ${pdfData.text.length}字符`);

      if (pdfData.text && pdfData.text.trim().length > 0) {
        // 创建包含真实PDF文本的图片
        const canvas = require('canvas');
        const canvasWidth = 2480;
        const canvasHeight = 3508;

        const canvasInstance = canvas.createCanvas(canvasWidth, canvasHeight);
        const ctx = canvasInstance.getContext('2d');

        // 白色背景
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 标题
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 60px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PDF Content (Text Extracted)', canvasWidth / 2, 100);

        // PDF信息
        ctx.fillStyle = '#374151';
        ctx.font = '36px Arial, sans-serif';
        ctx.fillText(`Pages: ${pdfData.numpages} | Characters: ${pdfData.text.length}`, canvasWidth / 2, 160);

        // 绘制文本内容
        ctx.fillStyle = '#000000';
        ctx.font = '24px Arial, sans-serif';
        ctx.textAlign = 'left';

        const lines = pdfData.text.split('\n');
        const maxLines = 120; // 最多显示120行
        const lineHeight = 28;
        const startY = 220;
        const margin = 80;
        const maxWidth = canvasWidth - 2 * margin;

        let currentY = startY;
        let lineCount = 0;

        for (let i = 0; i < lines.length && lineCount < maxLines; i++) {
          let line = lines[i].trim();
          if (line.length === 0) continue;

          // 处理长行，自动换行
          while (line.length > 0 && lineCount < maxLines) {
            const metrics = ctx.measureText(line);
            if (metrics.width <= maxWidth) {
              // 整行可以放下
              ctx.fillText(line, margin, currentY);
              currentY += lineHeight;
              lineCount++;
              break;
            } else {
              // 需要分割行
              let splitIndex = Math.floor(line.length * maxWidth / metrics.width);
              while (splitIndex > 0 && line[splitIndex] !== ' ') {
                splitIndex--;
              }
              if (splitIndex === 0) splitIndex = Math.floor(line.length * maxWidth / metrics.width);

              const part = line.substring(0, splitIndex);
              ctx.fillText(part, margin, currentY);
              line = line.substring(splitIndex).trim();
              currentY += lineHeight;
              lineCount++;
            }
          }
        }

        // 如果还有更多内容
        if (lineCount >= maxLines && lines.length > maxLines) {
          ctx.fillStyle = '#6b7280';
          ctx.font = '20px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('... (Content truncated, showing first 120 lines)', canvasWidth / 2, currentY + 40);
        }

        // 保存图片
        const buffer = canvasInstance.toBuffer('image/jpeg', { quality: 0.95 });
        fs.writeFileSync(outputPath, buffer);

        const stats = fs.statSync(outputPath);
        log(`🎉 PDF文本内容图片生成成功，文件大小: ${(stats.size / 1024).toFixed(2)} KB`);

        return outputPath;
      } else {
        log('❌ PDF文本提取为空，继续使用其他方案');
      }

    } catch (parseError) {
      log('❌ PDF文本提取失败: ' + parseError.message);
    }

    // 方法2: 尝试使用pdf2pic
    try {
      console.log('🔧 === 方案2: 尝试使用pdf2pic ===');
      const pdf2pic = require('pdf2pic');
      const options = {
        density: 300,
        saveFilename: "page",
        savePath: path.dirname(outputPath),
        format: "jpg",
        width: 2480,
        height: 3508
      };

      const convert = pdf2pic.fromPath(inputPath, options);
      console.log('正在使用pdf2pic转换...');
      const result = await convert(1, false);

      if (result && result.path && fs.existsSync(result.path)) {
        if (result.path !== outputPath) {
          fs.renameSync(result.path, outputPath);
        }

        const stats = fs.statSync(outputPath);
        console.log(`✅ PDF转图片成功 (pdf2pic)，文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
        return outputPath;
      }
    } catch (pdf2picError) {
      console.log('❌ pdf2pic转换失败:', pdf2picError.message);
    }

    // 方法3: 备用方案 - 生成高质量PDF信息预览图
    log('📋 === 方案3: 使用备用方案创建PDF信息预览图片 ===');

    const pdfBuffer = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    if (pages.length === 0) {
      throw new Error('PDF文件没有页面');
    }

    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // 创建高质量Canvas图片
    const canvas = require('canvas');
    const canvasWidth = 2480;
    const canvasHeight = 3508;

    const canvasInstance = canvas.createCanvas(canvasWidth, canvasHeight);
    const ctx = canvasInstance.getContext('2d');

    // 设置高质量渲染
    ctx.quality = 'best';
    ctx.patternQuality = 'best';

    // 白色背景
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 绘制文档边框
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 50, canvasWidth - 100, canvasHeight - 100);

    // 主标题
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 80px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PDF Document', canvasWidth / 2, 250);

    // 副标题
    ctx.fillStyle = '#374151';
    ctx.font = '56px Arial, sans-serif';
    ctx.fillText('Content Preview', canvasWidth / 2, 340);

    // 状态说明
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.fillText('Real PDF rendering not available', canvasWidth / 2, 450);

    // 文档信息
    ctx.fillStyle = '#4b5563';
    ctx.font = '38px Arial, sans-serif';
    ctx.fillText(`Pages: ${pages.length}`, canvasWidth / 2, 550);
    ctx.fillText(`Size: ${width.toFixed(0)} x ${height.toFixed(0)} points`, canvasWidth / 2, 610);

    // 文件信息
    const stats = fs.statSync(inputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    const fileName = path.basename(inputPath);
    const displayName = fileName.length > 40 ? fileName.substring(0, 40) + '...' : fileName;
    
    ctx.fillText(`File: ${displayName}`, canvasWidth / 2, 670);
    ctx.fillText(`Size: ${fileSizeKB} KB`, canvasWidth / 2, 730);

    // 解决方案建议
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillText('To get real PDF content:', canvasWidth / 2, 850);
    
    ctx.fillStyle = '#065f46';
    ctx.font = '32px Arial, sans-serif';
    ctx.fillText('1. Install GraphicsMagick or ImageMagick', canvasWidth / 2, 920);
    ctx.fillText('2. Or use a different PDF processing tool', canvasWidth / 2, 970);

    // 装饰性边框
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(200, 1050, canvasWidth - 400, 1800);

    // 模拟文档内容区域
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(250, 1100, canvasWidth - 500, 1700);

    // 模拟文本行 - 更真实的布局
    ctx.fillStyle = '#cbd5e1';
    const lineHeight = 45;
    const startY = 1150;
    
    for (let i = 0; i < 25; i++) {
      const y = startY + i * lineHeight;
      if (y > 2700) break;
      
      // 随机行长度，模拟真实文本
      const lineWidth = Math.random() * (canvasWidth - 700) + 200;
      const lineX = 300;
      
      ctx.fillRect(lineX, y, lineWidth, 25);
      
      // 偶尔添加段落间距
      if (Math.random() < 0.15) {
        i++; // 跳过一行
      }
    }

    // 添加时间戳
    const now = new Date();
    ctx.font = '28px Arial, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(`Generated: ${now.toLocaleString()}`, canvasWidth / 2, 3200);

    // 版本信息
    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = '#d1d5db';
    ctx.fillText('PDF to Image Converter v2.0 - Improved Version', canvasWidth / 2, 3300);

    // 保存为高质量JPEG
    const buffer = canvasInstance.toBuffer('image/jpeg', { quality: 0.95 });
    fs.writeFileSync(outputPath, buffer);

    const finalStats = fs.statSync(outputPath);
    console.log(`改进版备用方案完成，文件大小: ${(finalStats.size / 1024).toFixed(2)} KB`);

    return outputPath;

  } catch (error) {
    console.error('PDF转图片完全失败:', error);
    throw new Error(`PDF转图片失败: ${error.message}`);
  }
};

// 图片转PDF函数
const convertImageToPdf = async (inputPath, outputPath) => {
  try {
    const imageBuffer = fs.readFileSync(inputPath);
    const metadata = await sharp(imageBuffer).metadata();

    const pdfDoc = await PDFDocument.create();

    let image;
    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      image = await pdfDoc.embedJpg(imageBuffer);
    } else if (metadata.format === 'png') {
      image = await pdfDoc.embedPng(imageBuffer);
    } else {
      const jpegBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();
      image = await pdfDoc.embedJpg(jpegBuffer);
    }

    const { width, height } = image.size();
    const aspectRatio = width / height;

    const maxWidth = 595;
    const maxHeight = 842;

    let finalWidth, finalHeight;
    if (aspectRatio > maxWidth / maxHeight) {
      finalWidth = maxWidth;
      finalHeight = maxWidth / aspectRatio;
    } else {
      finalHeight = maxHeight;
      finalWidth = maxHeight * aspectRatio;
    }

    const pageWidth = Math.max(finalWidth + 40, 595);
    const pageHeight = Math.max(finalHeight + 40, 842);

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;

    page.drawImage(image, { x, y, width: finalWidth, height: finalHeight });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    return outputPath;
  } catch (error) {
    throw new Error(`图片转PDF失败: ${error.message}`);
  }
};

// API路由
app.get('/', (req, res) => {
  res.json({
    message: '改进版PDF转图片服务器运行正常',
    version: '2.0.0',
    status: 'online',
    features: [
      'PDF.js真实渲染',
      'pdf2pic备用方案',
      '高质量预览图生成',
      '图片转PDF'
    ],
    endpoints: ['/api/upload', '/api/convert', '/api/download/:filename']
  });
});

// 文件上传
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    console.log('文件上传成功:', req.file.filename);

    res.json({
      message: '文件上传成功',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('上传错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 文件转换
app.post('/api/convert', async (req, res) => {
  try {
    const { filename, targetFormat } = req.body;

    if (!filename || !targetFormat) {
      return res.status(400).json({
        error: '缺少必要参数: filename 和 targetFormat'
      });
    }

    const inputPath = path.join(uploadsDir, filename);

    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    const timestamp = Date.now();
    const fileExt = path.extname(filename).toLowerCase();

    console.log(`开始转换: ${fileExt} -> ${targetFormat}`);

    let resultPath;
    let outputFilename;

    // 根据文件类型和目标格式进行转换
    if ((fileExt === '.jpg' || fileExt === '.jpeg' || fileExt === '.png') && targetFormat === 'pdf') {
      // 图片转PDF
      outputFilename = `converted-${timestamp}.${targetFormat}`;
      const outputPath = path.join(outputsDir, outputFilename);
      resultPath = await convertImageToPdf(inputPath, outputPath);
      outputFilename = path.basename(resultPath);
    } else if (fileExt === '.pdf' && (targetFormat === 'jpg' || targetFormat === 'jpeg')) {
      // PDF转图片 - 使用改进版函数（返回ZIP文件）
      outputFilename = `converted-${timestamp}.${targetFormat}`;
      const outputPath = path.join(outputsDir, outputFilename);
      resultPath = await convertPdfToImageImproved(inputPath, outputPath);
      outputFilename = path.basename(resultPath);
    } else {
      return res.status(400).json({
        error: `不支持从 ${fileExt} 转换到 ${targetFormat} 格式`
      });
    }

    console.log('转换完成:', outputFilename);

    // 检查返回的文件类型
    const isZipFile = outputFilename.endsWith('.zip');

    res.json({
      message: '转换成功',
      outputFilename: outputFilename,
      downloadUrl: `/api/download/${outputFilename}`,
      fileType: isZipFile ? 'zip' : 'image',
      description: isZipFile ? 'ZIP文件包含所有页面图片' : '单个图片文件'
    });

  } catch (error) {
    console.error('转换错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 文件下载
app.get('/api/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(outputsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    const stat = fs.statSync(filePath);
    const isZipFile = filename.endsWith('.zip');

    res.setHeader('Content-Length', stat.size);

    if (isZipFile) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    console.error('下载错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`改进版PDF转图片服务器启动成功！`);
  console.log(`服务器地址: http://localhost:${PORT}`);
  console.log(`功能特性:`);
  console.log(`  - PDF.js真实PDF渲染`);
  console.log(`  - pdf2pic备用方案`);
  console.log(`  - 高质量预览图生成`);
  console.log(`  - 图片转PDF支持`);
  console.log(`上传目录: ${uploadsDir}`);
  console.log(`输出目录: ${outputsDir}`);
});
