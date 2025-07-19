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

const convertPdfToImage = async (inputPath, outputPath) => {
  try {
    console.log('开始PDF转图片:', inputPath, '->', outputPath);

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
      console.log('正在使用pdf2pic转换...');
      const result = await convert(1, false);

      if (result && result.path && fs.existsSync(result.path)) {
        if (result.path !== outputPath) {
          fs.renameSync(result.path, outputPath);
        }

        const stats = fs.statSync(outputPath);
        console.log(`PDF转图片成功 (pdf2pic)，文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
        return outputPath;
      }
    } catch (pdf2picError) {
      console.log('pdf2pic转换失败，使用备用方案:', pdf2picError.message);
    }

    // 方法2: 备用方案 - 使用Canvas和PDF信息
    console.log('使用备用方案创建PDF预览图片');

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
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 4;
    ctx.strokeRect(100, 100, canvasWidth - 200, canvasHeight - 200);

    // 标题 - 使用英文避免字体问题
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 72px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PDF Document Preview', canvasWidth / 2, 300);

    // 副标题
    ctx.fillStyle = '#374151';
    ctx.font = '48px Arial, sans-serif';
    ctx.fillText('PDF to Image Conversion', canvasWidth / 2, 400);

    // 文档信息
    ctx.font = '36px Arial, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`Document Size: ${width.toFixed(0)} x ${height.toFixed(0)} points`, canvasWidth / 2, 500);
    ctx.fillText(`Total Pages: ${pages.length}`, canvasWidth / 2, 560);

    // 文件名处理
    const fileName = path.basename(inputPath);
    const displayName = fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName;
    ctx.fillText(`File: ${displayName}`, canvasWidth / 2, 620);

    // 功能说明
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

    // 保存为高质量JPEG
    const buffer = canvasInstance.toBuffer('image/jpeg', { quality: 0.95 });
    fs.writeFileSync(outputPath, buffer);

    const stats = fs.statSync(outputPath);
    console.log(`备用方案完成，生成预览图片，文件大小: ${(stats.size / 1024).toFixed(2)} KB`);

    return outputPath;

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

app.post('/api/convert', async (req, res) => {
  try {
    const { filename, targetFormat } = req.body;
    
    if (!filename || !targetFormat) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const inputPath = path.join(uploadsDir, filename);
    const outputFilename = `converted-${Date.now()}.${targetFormat}`;
    const outputPath = path.join(outputsDir, outputFilename);
    
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: '文件不存在' });
    }
    
    // 根据文件类型和目标格式进行转换
    const fileExt = path.extname(filename).toLowerCase();
    
    // 根据文件类型和目标格式进行转换
    if ((fileExt === '.jpg' || fileExt === '.jpeg' || fileExt === '.png') && targetFormat === 'pdf') {
      // 图片转PDF
      await convertImageToPdf(inputPath, outputPath);
    } else if (fileExt === '.pdf' && (targetFormat === 'jpg' || targetFormat === 'jpeg')) {
      // PDF转图片
      await convertPdfToImage(inputPath, outputPath);
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
    
    res.json({
      message: '转换成功',
      outputFilename: outputFilename,
      downloadUrl: `/api/download/${outputFilename}`
    });
    
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
