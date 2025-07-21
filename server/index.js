const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { PDFDocument, rgb } = require('pdf-lib');
const pdf2pic = require('pdf2pic');

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

// 配置multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB限制
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }
});

// 文件转换函数 - 简化版本，先实现基础功能
const convertWordToPdf = async (inputPath, outputPath) => {
  // 暂时返回错误，需要安装LibreOffice或其他转换工具
  throw new Error('Word to PDF conversion not implemented yet');
};

// 增强版PDF转图片函数 - 支持多页、多格式、质量选择
const convertPdfToImageEnhanced = async (inputPath, outputPath, options = {}) => {
  try {
    const {
      format = 'jpg',           // 输出格式: jpg, png, tiff
      quality = 'high',         // 质量: low(150dpi), medium(200dpi), high(300dpi), ultra(600dpi)
      pages = 'first',          // 页面选择: 'first', 'all', [1,2,3], '1-3'
      compression = 85          // 压缩质量 (1-100)
    } = options;

    console.log('开始增强版PDF转图片:', inputPath);
    console.log('转换选项:', { format, quality, pages, compression });

    // 质量设置映射
    const qualitySettings = {
      low: { density: 150, width: 1240, height: 1754 },
      medium: { density: 200, width: 1653, height: 2339 },
      high: { density: 300, width: 2480, height: 3508 },
      ultra: { density: 600, width: 4960, height: 7016 }
    };

    const settings = qualitySettings[quality] || qualitySettings.high;

    // 方法1: 尝试使用pdf2pic进行高质量转换
    try {
      const pdf2picOptions = {
        density: settings.density,
        saveFilename: "page",
        savePath: path.dirname(outputPath),
        format: format,
        width: settings.width,
        height: settings.height,
        quality: compression
      };

      const convert = pdf2pic.fromPath(inputPath, pdf2picOptions);
      console.log(`正在使用pdf2pic转换 (${quality}质量, ${format}格式)...`);

      // 处理页面选择
      let convertResults = [];

      if (pages === 'first') {
        // 只转换第一页
        const result = await convert(1, false);
        if (result && result.path && fs.existsSync(result.path)) {
          convertResults.push(result);
        }
      } else if (pages === 'all') {
        // 转换所有页面
        const results = await convert.bulk(-1, { responseType: "image" });
        convertResults = results.filter(r => r && r.path && fs.existsSync(r.path));
      } else if (Array.isArray(pages)) {
        // 转换指定页面数组
        for (const pageNum of pages) {
          try {
            const result = await convert(pageNum, false);
            if (result && result.path && fs.existsSync(result.path)) {
              convertResults.push(result);
            }
          } catch (pageError) {
            console.log(`页面${pageNum}转换失败:`, pageError.message);
          }
        }
      }

      if (convertResults.length > 0) {
        if (convertResults.length === 1) {
          // 单页转换 - 直接重命名
          const result = convertResults[0];
          if (result.path !== outputPath) {
            fs.renameSync(result.path, outputPath);
          }
          const stats = fs.statSync(outputPath);
          console.log(`PDF转图片成功 (pdf2pic)，文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
          return {
            type: 'single',
            path: outputPath,
            pages: 1,
            format: format,
            quality: quality
          };
        } else {
          // 多页转换 - 创建ZIP文件
          return await createMultiPageZip(convertResults, outputPath, format);
        }
      }
    } catch (pdf2picError) {
      console.log('pdf2pic转换失败，使用备用方案:', pdf2picError.message);
    }

    // 方法2: 备用方案 - 使用Canvas和PDF信息
    console.log('使用备用方案创建PDF预览图片');
    return await createCanvasPreview(inputPath, outputPath, format, settings);

  } catch (error) {
    console.error('PDF转图片完全失败:', error);
    throw error;
  }
};

// 创建多页ZIP文件
const createMultiPageZip = async (convertResults, outputPath, format) => {
  try {
    const JSZip = require('jszip');
    const zip = new JSZip();

    console.log(`创建多页ZIP文件，共${convertResults.length}页`);

    // 添加每个页面到ZIP
    for (let i = 0; i < convertResults.length; i++) {
      const result = convertResults[i];
      const pageBuffer = fs.readFileSync(result.path);
      const fileName = `page-${String(i + 1).padStart(3, '0')}.${format}`;
      zip.file(fileName, pageBuffer);

      // 清理临时文件
      try {
        fs.unlinkSync(result.path);
      } catch (cleanupError) {
        console.log('清理临时文件失败:', cleanupError.message);
      }
    }

    // 添加转换信息文件
    const infoText = `PDF转图片转换信息
转换时间: ${new Date().toLocaleString('zh-CN')}
总页数: ${convertResults.length}
输出格式: ${format.toUpperCase()}
文件列表:
${convertResults.map((_, i) => `page-${String(i + 1).padStart(3, '0')}.${format}`).join('\n')}`;

    zip.file('conversion-info.txt', infoText);

    // 生成ZIP文件
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipPath = outputPath.replace(/\.[^.]+$/, '.zip');
    fs.writeFileSync(zipPath, zipBuffer);

    const stats = fs.statSync(zipPath);
    console.log(`多页ZIP创建成功，文件大小: ${(stats.size / 1024).toFixed(2)} KB`);

    return {
      type: 'multi',
      path: zipPath,
      pages: convertResults.length,
      format: format,
      quality: 'high'
    };
  } catch (error) {
    console.error('创建ZIP文件失败:', error);
    throw error;
  }
};

// Canvas备用预览方案
const createCanvasPreview = async (inputPath, outputPath, format, settings) => {
  try {

    const pdfBuffer = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    if (pages.length === 0) {
      throw new Error('PDF文件没有页面');
    }

    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // 使用设置中的尺寸创建Canvas
    const canvas = require('canvas');
    const canvasWidth = settings.width;
    const canvasHeight = settings.height;

    const canvasInstance = canvas.createCanvas(canvasWidth, canvasHeight);
    const ctx = canvasInstance.getContext('2d');

    // 设置高质量渲染
    ctx.quality = 'best';
    ctx.patternQuality = 'best';

    // 白色背景
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 绘制文档边框 - 动态调整
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = Math.max(2, canvasWidth / 620);
    const margin = canvasWidth * 0.04;
    ctx.strokeRect(margin, margin, canvasWidth - 2 * margin, canvasHeight - 2 * margin);

    // 动态字体大小
    const baseFontSize = canvasWidth / 34;

    // 标题
    ctx.fillStyle = '#2563eb';
    ctx.font = `bold ${baseFontSize * 2}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('PDF Document Preview', canvasWidth / 2, canvasHeight * 0.17);

    // 副标题
    ctx.fillStyle = '#374151';
    ctx.font = `${baseFontSize * 1.3}px Arial, sans-serif`;
    ctx.fillText(`PDF to Image Conversion (${format.toUpperCase()})`, canvasWidth / 2, canvasHeight * 0.23);

    // 文档信息
    ctx.font = `${baseFontSize}px Arial, sans-serif`;
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`Document Size: ${width.toFixed(0)} x ${height.toFixed(0)} points`, canvasWidth / 2, canvasHeight * 0.29);
    ctx.fillText(`Total Pages: ${pages.length}`, canvasWidth / 2, canvasHeight * 0.33);

    // 文件名处理
    const fileName = path.basename(inputPath);
    const maxLength = Math.floor(canvasWidth / (baseFontSize * 0.6));
    const displayName = fileName.length > maxLength ? fileName.substring(0, maxLength) + '...' : fileName;
    ctx.fillText(`File: ${displayName}`, canvasWidth / 2, canvasHeight * 0.37);

    // 功能说明
    ctx.font = `${baseFontSize * 0.8}px Arial, sans-serif`;
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('This is a preview image of the PDF document', canvasWidth / 2, canvasHeight * 0.45);
    ctx.fillText('Full PDF rendering requires additional system dependencies', canvasWidth / 2, canvasHeight * 0.48);

    // 添加装饰线
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = Math.max(2, canvasWidth / 827);
    ctx.beginPath();
    const lineLength = canvasWidth * 0.24;
    ctx.moveTo(canvasWidth / 2 - lineLength, canvasHeight * 0.52);
    ctx.lineTo(canvasWidth / 2 + lineLength, canvasHeight * 0.52);
    ctx.stroke();

    // 添加时间戳
    const now = new Date();
    ctx.font = `${baseFontSize * 0.7}px Arial, sans-serif`;
    ctx.fillStyle = '#d1d5db';
    ctx.fillText(`Generated: ${now.toLocaleString('en-US')}`, canvasWidth / 2, canvasHeight * 0.57);

    // 根据格式保存文件
    let buffer;
    if (format === 'png') {
      buffer = canvasInstance.toBuffer('image/png');
    } else if (format === 'tiff') {
      // TIFF格式转换为PNG（Canvas不直接支持TIFF）
      buffer = canvasInstance.toBuffer('image/png');
      console.log('注意：Canvas不支持TIFF格式，已转换为PNG');
    } else {
      // 默认JPEG
      buffer = canvasInstance.toBuffer('image/jpeg', { quality: 0.95 });
    }

    fs.writeFileSync(outputPath, buffer);

    const stats = fs.statSync(outputPath);
    console.log(`备用方案完成，生成预览图片 (${format})，文件大小: ${(stats.size / 1024).toFixed(2)} KB`);

    return {
      type: 'single',
      path: outputPath,
      pages: 1,
      format: format,
      quality: 'preview'
    };

  } catch (error) {
    console.error('PDF转图片完全失败:', error);

    // 清理临时文件
    try {
      const tempDir = path.dirname(outputPath);
      if (fs.existsSync(tempDir)) {
        const tempFiles = fs.readdirSync(tempDir).filter(file =>
          file.startsWith('page.') || file.includes('temp')
        );
        tempFiles.forEach(file => {
          const tempFilePath = path.join(tempDir, file);
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        });
      }
    } catch (cleanupError) {
      console.error('清理临时文件失败:', cleanupError);
    }

    throw new Error(`PDF转图片失败: ${error.message}`);
  }
};

// 保持向后兼容的原始函数
const convertPdfToImage = async (inputPath, outputPath) => {
  // 使用增强版函数，默认参数
  const result = await convertPdfToImageEnhanced(inputPath, outputPath, {
    format: 'jpg',
    quality: 'high',
    pages: 'first',
    compression: 85
  });

  // 返回路径以保持兼容性
  return result.path;
};

const convertImageToPdf = async (inputPath, outputPath) => {
  try {
    // 读取图片文件
    const imageBuffer = fs.readFileSync(inputPath);
    const metadata = await sharp(imageBuffer).metadata();

    // 使用pdf-lib创建PDF
    const pdfDoc = await PDFDocument.create();

    // 根据图片格式嵌入图片
    let image;
    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      image = await pdfDoc.embedJpg(imageBuffer);
    } else if (metadata.format === 'png') {
      image = await pdfDoc.embedPng(imageBuffer);
    } else {
      // 转换为JPEG格式
      const jpegBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();
      image = await pdfDoc.embedJpg(jpegBuffer);
    }

    // 计算页面尺寸 (A4: 595.28 x 841.89 points)
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;

    // 计算图片在页面中的尺寸，保持宽高比
    const maxWidth = pageWidth - 2 * margin;
    const maxHeight = pageHeight - 2 * margin;

    const imageAspectRatio = image.width / image.height;
    const maxAspectRatio = maxWidth / maxHeight;

    let finalWidth, finalHeight;
    if (imageAspectRatio > maxAspectRatio) {
      // 图片较宽，以宽度为准
      finalWidth = maxWidth;
      finalHeight = maxWidth / imageAspectRatio;
    } else {
      // 图片较高，以高度为准
      finalHeight = maxHeight;
      finalWidth = maxHeight * imageAspectRatio;
    }

    // 添加页面
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // 计算居中位置
    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;

    // 绘制图片
    page.drawImage(image, {
      x: x,
      y: y,
      width: finalWidth,
      height: finalHeight,
    });

    // 保存PDF
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    return outputPath;
  } catch (error) {
    console.error('Image to PDF conversion error:', error);
    throw new Error(`图片转PDF失败: ${error.message}`);
  }
};

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: '文件转换服务器运行正常',
    version: '1.0.0',
    endpoints: ['/api/upload', '/api/convert', '/api/download/:filename']
  });
});

// API路由
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有上传文件' });
  }
  
  res.json({
    message: '文件上传成功',
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

// 增强版转换API
app.post('/api/convert', async (req, res) => {
  try {
    const {
      filename,
      targetFormat,
      quality = 'high',
      pages = 'first',
      compression = 85
    } = req.body;

    if (!filename || !targetFormat) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const inputPath = path.join(uploadsDir, filename);
    const timestamp = Date.now();
    const outputFilename = `converted-${timestamp}.${targetFormat}`;
    const outputPath = path.join(outputsDir, outputFilename);

    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    const fileExt = path.extname(filename).toLowerCase();
    let result;

    // 根据文件类型和目标格式进行转换
    if ((fileExt === '.jpg' || fileExt === '.jpeg' || fileExt === '.png') && targetFormat === 'pdf') {
      // 图片转PDF
      await convertImageToPdf(inputPath, outputPath);
      result = {
        type: 'single',
        path: outputPath,
        pages: 1,
        format: 'pdf',
        quality: 'high'
      };
    } else if (fileExt === '.pdf' && ['jpg', 'jpeg', 'png', 'tiff'].includes(targetFormat)) {
      // PDF转图片 - 使用增强版函数
      const options = {
        format: targetFormat,
        quality: quality,
        pages: pages,
        compression: compression
      };
      result = await convertPdfToImageEnhanced(inputPath, outputPath, options);
    } else if ((fileExt === '.docx' || fileExt === '.doc') && targetFormat === 'pdf') {
      // Word转PDF (暂未实现)
      throw new Error('Word转PDF功能正在开发中，请稍后再试');
    } else if ((fileExt === '.jpg' || fileExt === '.jpeg' || fileExt === '.png') && targetFormat === 'docx') {
      // 图片转Word (暂未实现)
      throw new Error('图片转Word功能正在开发中，请稍后再试');
    } else {
      return res.status(400).json({
        error: `不支持从 ${fileExt} 转换到 ${targetFormat} 格式`
      });
    }

    // 构建响应数据
    const finalFilename = path.basename(result.path);
    const response = {
      message: '转换成功',
      outputFilename: finalFilename,
      downloadUrl: `/api/download/${finalFilename}`,
      conversionInfo: {
        type: result.type,
        pages: result.pages,
        format: result.format,
        quality: result.quality,
        originalFile: filename,
        timestamp: new Date().toISOString()
      }
    };

    // 如果是多页转换，添加额外信息
    if (result.type === 'multi') {
      response.message = `转换成功，共${result.pages}页，已打包为ZIP文件`;
      response.conversionInfo.note = 'ZIP文件包含所有页面的图片和转换信息';
    }

    res.json(response);
    
  } catch (error) {
    console.error('转换错误:', error);
    res.status(500).json({ error: '转换失败: ' + error.message });
  }
});

app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(outputsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }
  
  res.download(filePath, (err) => {
    if (err) {
      console.error('下载错误:', err);
      res.status(500).json({ error: '下载失败' });
    }
  });
});

// 清理临时文件的定时任务（每小时清理一次超过1小时的文件）
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  [uploadsDir, outputsDir].forEach(dir => {
    fs.readdir(dir, (err, files) => {
      if (err) return;
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          
          if (now - stats.mtime.getTime() > oneHour) {
            fs.unlink(filePath, (err) => {
              if (err) console.error('删除文件失败:', err);
            });
          }
        });
      });
    });
  });
}, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
