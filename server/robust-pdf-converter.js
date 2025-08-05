const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const JSZip = require('jszip');

const app = express();
const PORT = 3003;

// 中间件
app.use(cors());
app.use(express.json());

// 日志函数
const log = (message) => {
  const timestamp = new Date().toLocaleString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  // 写入日志文件
  const logFile = path.join(__dirname, 'robust-conversion.log');
  fs.appendFileSync(logFile, logMessage + '\n');
};

// 确保目录存在
const uploadsDir = path.join(__dirname, 'uploads');
const outputsDir = path.join(__dirname, 'outputs');
[uploadsDir, outputsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 文件上传配置
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000000000);
    const filename = `${timestamp}-${randomNum}-${file.originalname}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// 健壮的PDF转图片函数 - 多重备选方案
const convertPdfToImagesRobust = async (inputPath, outputPath) => {
  try {
    log('=== 开始健壮版PDF转图片 ===');
    log('输入文件: ' + inputPath);
    log('输出文件: ' + outputPath);
    
    // 方案1: 使用pdf2pic（如果系统支持）
    try {
      log('🎯 === 方案1: 尝试使用pdf2pic ===');
      const pdf2pic = require('pdf2pic');
      
      const timestamp = Date.now();
      const outputDir = path.join(path.dirname(outputPath), `pdf-pages-${timestamp}`);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const options = {
        density: 300,
        saveFilename: "page",
        savePath: outputDir,
        format: "jpg",
        width: 2480,
        height: 3508,
        quality: 95
      };
      
      const convert = pdf2pic.fromPath(inputPath, options);
      const results = await convert.bulk(-1, { responseType: "image" });
      
      if (results && results.length > 0) {
        log(`✅ pdf2pic转换成功，共处理${results.length}页`);
        
        // 创建ZIP文件
        const zip = new JSZip();
        const pageFiles = [];
        
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result.path && fs.existsSync(result.path)) {
            const imageBuffer = fs.readFileSync(result.path);
            const filename = `page-${(i + 1).toString().padStart(3, '0')}.jpg`;
            zip.file(filename, imageBuffer);
            pageFiles.push(filename);
          }
        }
        
        if (pageFiles.length > 0) {
          const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
          const zipPath = outputPath.replace(/\.[^.]+$/, '.zip');
          fs.writeFileSync(zipPath, zipBuffer);
          
          // 清理临时文件
          try {
            fs.rmSync(outputDir, { recursive: true, force: true });
          } catch (cleanupError) {
            log('清理临时文件失败: ' + cleanupError.message);
          }
          
          log(`🎉 pdf2pic转换完成，ZIP文件: ${path.basename(zipPath)}`);
          return zipPath;
        }
      }
    } catch (pdf2picError) {
      log('❌ pdf2pic转换失败: ' + pdf2picError.message);
    }
    
    // 方案2: 使用修复版PDF.js
    try {
      log('🎯 === 方案2: 尝试使用修复版PDF.js ===');
      
      const canvas = require('canvas');
      const { Image } = canvas;
      
      // 设置全局polyfills
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
      
      if (typeof global.Image === 'undefined') {
        global.Image = Image;
      }
      
      if (typeof global.HTMLCanvasElement === 'undefined') {
        global.HTMLCanvasElement = canvas.Canvas;
      }
      
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = null;
      
      const pdfBuffer = fs.readFileSync(inputPath);
      const pdfData = new Uint8Array(pdfBuffer);
      
      const loadingTask = pdfjsLib.getDocument({
        data: pdfData,
        verbosity: 0,
        disableWorker: true,
        isEvalSupported: false,
        disableAutoFetch: true,
        disableStream: true
      });
      
      const pdfDocument = await loadingTask.promise;
      log(`✅ PDF.js加载成功，共${pdfDocument.numPages}页`);
      
      const timestamp = Date.now();
      const outputDir = path.join(path.dirname(outputPath), `pdf-pages-${timestamp}`);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const pageFiles = [];
      const renderScale = 2.0;
      
      for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        try {
          const page = await pdfDocument.getPage(pageNum);
          const viewport = page.getViewport({ scale: renderScale });
          const pageWidth = Math.ceil(viewport.width);
          const pageHeight = Math.ceil(viewport.height);
          
          const pageCanvas = canvas.createCanvas(pageWidth, pageHeight);
          const pageContext = pageCanvas.getContext('2d');
          
          pageContext.fillStyle = 'white';
          pageContext.fillRect(0, 0, pageWidth, pageHeight);
          
          const renderContext = {
            canvasContext: pageContext,
            viewport: viewport,
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
                canvasAndContext.canvas.width = 0;
                canvasAndContext.canvas.height = 0;
              }
            }
          };
          
          await page.render(renderContext).promise;
          
          const pageFilename = `page-${pageNum.toString().padStart(3, '0')}.jpg`;
          const pageFilePath = path.join(outputDir, pageFilename);
          
          const pageBuffer = pageCanvas.toBuffer('image/jpeg', { quality: 0.95 });
          fs.writeFileSync(pageFilePath, pageBuffer);
          
          pageFiles.push({
            filename: pageFilename,
            path: pageFilePath
          });
          
          log(`✅ 第${pageNum}页渲染成功`);
          
        } catch (pageError) {
          log(`❌ 第${pageNum}页渲染失败: ${pageError.message}`);
        }
      }
      
      if (pageFiles.length > 0) {
        const zip = new JSZip();
        
        for (const pageFile of pageFiles) {
          const imageBuffer = fs.readFileSync(pageFile.path);
          zip.file(pageFile.filename, imageBuffer);
        }
        
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        const zipPath = outputPath.replace(/\.[^.]+$/, '.zip');
        fs.writeFileSync(zipPath, zipBuffer);
        
        // 清理临时文件
        try {
          fs.rmSync(outputDir, { recursive: true, force: true });
        } catch (cleanupError) {
          log('清理临时文件失败: ' + cleanupError.message);
        }
        
        log(`🎉 PDF.js转换完成，共${pageFiles.length}页`);
        return zipPath;
      }
      
    } catch (pdfjsError) {
      log('❌ PDF.js转换失败: ' + pdfjsError.message);
    }
    
    // 方案3: 使用pdf-parse提取文本并生成图片
    try {
      log('🎯 === 方案3: 使用pdf-parse提取文本生成图片 ===');
      
      const pdfParse = require('pdf-parse');
      const canvas = require('canvas');
      
      const pdfBuffer = fs.readFileSync(inputPath);
      const pdfData = await pdfParse(pdfBuffer);
      
      if (pdfData.text && pdfData.text.trim().length > 0) {
        log(`✅ PDF文本提取成功，共${pdfData.numpages}页，文本长度: ${pdfData.text.length}字符`);
        
        // 创建文本图片
        const canvasWidth = 1200;
        const canvasHeight = 1600;
        const textCanvas = canvas.createCanvas(canvasWidth, canvasHeight);
        const ctx = textCanvas.getContext('2d');
        
        // 设置背景
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 设置文本样式
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        
        // 绘制文本
        const lines = pdfData.text.split('\n');
        const lineHeight = 20;
        const margin = 50;
        let y = margin + lineHeight;
        
        for (const line of lines) {
          if (y > canvasHeight - margin) break;
          ctx.fillText(line.substring(0, 80), margin, y);
          y += lineHeight;
        }
        
        // 添加标题
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#333';
        ctx.fillText('PDF文本内容预览', margin, 30);
        
        const textBuffer = textCanvas.toBuffer('image/jpeg', { quality: 0.9 });
        fs.writeFileSync(outputPath, textBuffer);
        
        log('🎉 PDF文本图片生成成功');
        return outputPath;
      }
      
    } catch (textError) {
      log('❌ 文本提取失败: ' + textError.message);
    }
    
    throw new Error('所有PDF转换方案都失败了');
    
  } catch (error) {
    log('❌ PDF转图片完全失败: ' + error.message);
    throw error;
  }
};

// API路由
app.get('/', (req, res) => {
  res.json({
    message: '健壮版PDF转图片服务器运行正常',
    version: '4.0.0',
    status: 'online',
    features: [
      '多重备选方案',
      'pdf2pic优先',
      '修复版PDF.js备选',
      '文本提取兜底',
      '自动错误恢复'
    ]
  });
});

// 文件上传
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    log('文件上传成功: ' + req.file.filename);
    
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

// 转换API
app.post('/api/convert', async (req, res) => {
  try {
    const { filename, targetFormat } = req.body;
    
    if (!filename || !targetFormat) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const inputPath = path.join(uploadsDir, filename);
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    const timestamp = Date.now();
    const fileExt = path.extname(filename).toLowerCase();

    log(`开始转换: ${fileExt} -> ${targetFormat}`);

    if (fileExt === '.pdf' && (targetFormat === 'jpg' || targetFormat === 'jpeg')) {
      const outputFilename = `converted-${timestamp}.${targetFormat}`;
      const outputPath = path.join(outputsDir, outputFilename);
      
      const resultPath = await convertPdfToImagesRobust(inputPath, outputPath);
      const finalFilename = path.basename(resultPath);
      
      res.json({
        message: '转换成功',
        outputFilename: finalFilename,
        downloadUrl: `/api/download/${finalFilename}`,
        fileType: finalFilename.endsWith('.zip') ? 'zip' : 'image'
      });
    } else {
      return res.status(400).json({
        error: `此服务器只支持PDF转JPG格式`
      });
    }

  } catch (error) {
    log('转换错误: ' + error.message);
    res.status(500).json({ error: error.message });
  }
});

// 下载API
app.get('/api/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(outputsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }
    
    res.download(filePath, filename);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  log('健壮版PDF转图片服务器启动成功！');
  log(`服务器地址: http://localhost:${PORT}`);
  log('功能特性:');
  log('  - 多重备选方案自动切换');
  log('  - pdf2pic优先（高质量）');
  log('  - 修复版PDF.js备选');
  log('  - 文本提取兜底方案');
  log('  - 自动错误恢复');
  log(`上传目录: ${uploadsDir}`);
  log(`输出目录: ${outputsDir}`);
});
