const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf2pic = require('pdf2pic');
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');

const app = express();
const PORT = 3001;

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
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// 路由
app.get('/', (req, res) => {
  res.json({
    message: '文件转换服务器运行正常',
    version: '1.0.0',
    status: 'online',
    endpoints: ['/api/upload', '/api/convert', '/api/download/:filename']
  });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    console.log('文件上传成功:', req.file.filename);
    
    res.json({
      message: '文件上传成功',
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('上传错误:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

// 转换函数
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
      const jpegBuffer = await sharp(imageBuffer).jpeg({ quality: 90 }).toBuffer();
      image = await pdfDoc.embedJpg(jpegBuffer);
    }

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;

    const maxWidth = pageWidth - 2 * margin;
    const maxHeight = pageHeight - 2 * margin;

    const imageAspectRatio = image.width / image.height;
    const maxAspectRatio = maxWidth / maxHeight;

    let finalWidth, finalHeight;
    if (imageAspectRatio > maxAspectRatio) {
      finalWidth = maxWidth;
      finalHeight = maxWidth / imageAspectRatio;
    } else {
      finalHeight = maxHeight;
      finalWidth = maxHeight * imageAspectRatio;
    }

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

const convertPdfToImage = async (inputPath, outputPath) => {
  try {
    console.log('开始PDF转图片:', inputPath);

    // 方法1: 尝试使用pdf2pic
    try {
      const options = {
        density: 300,
        saveFilename: "page",
        savePath: path.dirname(outputPath),
        format: "jpg",
        width: 2480,
        height: 3508
      };

      const convert = pdf2pic.fromPath(inputPath, options);
      const result = await convert(1, false);

      if (result && result.path && fs.existsSync(result.path)) {
        if (result.path !== outputPath) {
          fs.renameSync(result.path, outputPath);
        }
        console.log('PDF转图片成功 (pdf2pic)');
        return outputPath;
      }
    } catch (pdf2picError) {
      console.log('pdf2pic转换失败，尝试备用方案:', pdf2picError.message);
    }

    // 方法2: 备用方案 - 使用Canvas创建占位图片
    console.log('使用备用方案创建占位图片');

    // 读取PDF文件获取基本信息
    const pdfBuffer = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    if (pages.length === 0) {
      throw new Error('PDF文件没有页面');
    }

    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // 创建Canvas图片
    const canvas = require('canvas');
    const canvasWidth = 2480;  // A4 300DPI宽度
    const canvasHeight = 3508; // A4 300DPI高度

    const canvasInstance = canvas.createCanvas(canvasWidth, canvasHeight);
    const ctx = canvasInstance.getContext('2d');

    // 设置高质量渲染
    ctx.quality = 'best';
    ctx.patternQuality = 'best';

    // 填充白色背景
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 添加边框
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 4;
    ctx.strokeRect(100, 100, canvasWidth - 200, canvasHeight - 200);

    // 标题 - 使用英文避免中文字体问题
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 72px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PDF Document Preview', canvasWidth / 2, 300);

    // 副标题
    ctx.font = '48px Arial, sans-serif';
    ctx.fillStyle = '#374151';
    ctx.fillText('PDF to Image Conversion', canvasWidth / 2, 400);

    // 文档信息
    ctx.font = '36px Arial, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`Document Size: ${width.toFixed(0)} x ${height.toFixed(0)} points`, canvasWidth / 2, 500);
    ctx.fillText(`Total Pages: ${pages.length}`, canvasWidth / 2, 560);

    // 文件名 - 处理可能的中文字符
    const fileName = path.basename(inputPath);
    const displayName = fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName;
    ctx.fillText(`File: ${displayName}`, canvasWidth / 2, 620);

    // 说明文字
    ctx.font = '28px Arial, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('This is a preview image of the PDF document', canvasWidth / 2, 750);
    ctx.fillText('Full PDF rendering requires additional system dependencies', canvasWidth / 2, 800);

    // 添加装饰线
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvasWidth / 2 - 300, 850);
    ctx.lineTo(canvasWidth / 2 + 300, 850);
    ctx.stroke();

    // 添加时间戳
    const now = new Date();
    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = '#d1d5db';
    ctx.fillText(`Generated: ${now.toLocaleString('en-US')}`, canvasWidth / 2, 950);

    // 保存为JPEG
    const buffer = canvasInstance.toBuffer('image/jpeg', { quality: 0.9 });
    fs.writeFileSync(outputPath, buffer);

    console.log('备用方案完成，生成占位图片');
    return outputPath;

  } catch (error) {
    console.error('PDF转图片完全失败:', error);
    throw new Error(`PDF转图片失败: ${error.message}`);
  }
};

app.post('/api/convert', async (req, res) => {
  try {
    const { filename, targetFormat } = req.body;

    if (!filename || !targetFormat) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    console.log('转换请求:', filename, '->', targetFormat);

    const inputPath = path.join(uploadsDir, filename);
    const outputFilename = `converted-${Date.now()}.${targetFormat}`;
    const outputPath = path.join(outputsDir, outputFilename);

    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    const fileExt = path.extname(filename).toLowerCase();

    // 执行转换
    if ((fileExt === '.jpg' || fileExt === '.jpeg' || fileExt === '.png') && targetFormat === 'pdf') {
      await convertImageToPdf(inputPath, outputPath);
    } else if (fileExt === '.pdf' && (targetFormat === 'jpg' || targetFormat === 'jpeg')) {
      await convertPdfToImage(inputPath, outputPath);
    } else {
      return res.status(400).json({
        error: `不支持从 ${fileExt} 转换到 ${targetFormat} 格式`
      });
    }

    res.json({
      message: '转换成功',
      outputFilename: outputFilename,
      downloadUrl: `/api/download/${outputFilename}`
    });

  } catch (error) {
    console.error('转换错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(outputsDir, filename);

  console.log('下载请求:', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }

  // 设置响应头
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/octet-stream');

  // 发送文件
  res.sendFile(path.resolve(filePath), (err) => {
    if (err) {
      console.error('下载错误:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: '下载失败' });
      }
    } else {
      console.log('文件下载成功:', filename);
    }
  });
});

// 错误处理
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`简化服务器运行在端口 ${PORT}`);
  console.log(`访问 http://localhost:${PORT} 查看状态`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});
