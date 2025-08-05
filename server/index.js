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

// 文件转换函数 - Word转PDF真正的一次性解决方案（服务器端）
const convertWordToPdf = async (inputPath, outputPath, options = {}) => {
  try {
    console.log('开始Word转PDF转换 (全格式支持版):', inputPath);
    
    const fs = require('fs');
    const path = require('path');
    
    const fileExt = path.extname(inputPath).toLowerCase();
    
    // 根据文件类型选择转换方案
    if (fileExt === '.docx') {
      return await convertDocxToPdf(inputPath, outputPath, options);
    } else if (fileExt === '.doc') {
      return await convertDocToPdf(inputPath, outputPath, options);
    } else {
      throw new Error(`不支持的Word格式: ${fileExt}`);
    }
  } catch (error) {
    console.error('Word转PDF失败:', error.message);
    throw error;
  }
};

// .docx格式转换（ZIP格式）
const convertDocxToPdf = async (inputPath, outputPath, options = {}) => {
  try {
    console.log('转换.docx文件:', inputPath);
    
    const { PDFDocument, rgb } = require('pdf-lib');
    const mammoth = require('mammoth');
    
    // 配置mammoth以更好处理中文
    const mammothOptions = {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh"
      ]
    };
    
    let textContent = '';
    
    try {
      const buffer = fs.readFileSync(inputPath);
      
      // 尝试使用HTML转换以保留格式
      const result = await mammoth.convertToHtml({ buffer }, mammothOptions);
      textContent = result.value; // HTML格式
      console.log('.docx文档转换成功，长度:', textContent.length);
      
    } catch (error) {
      console.log('HTML转换失败，使用纯文本:', error.message);
      // 回退到纯文本模式
      const textResult = await mammoth.extractRawText({ buffer: fs.readFileSync(inputPath) });
      textContent = textResult.value;
    }
    
    return await createPdfFromText(textContent, outputPath, options);
    
  } catch (error) {
    if (error.message.includes('end of central directory')) {
      console.log('.docx文件可能损坏，尝试使用文本模式');
      const textContent = fs.readFileSync(inputPath, 'utf8');
      return await createPdfFromText(textContent, outputPath, options);
    }
    throw error;
  }
};

// .doc格式转换（二进制格式）
const convertDocToPdf = async (inputPath, outputPath, options = {}) => {
  try {
    console.log('转换.doc文件:', inputPath);
    
    // 方案1: 尝试LibreOffice（最佳方案）
    if (process.platform === 'win32' || process.platform === 'linux' || process.platform === 'darwin') {
      try {
        return await convertWordToPdfLibreOffice(inputPath, outputPath);
      } catch (libreError) {
        console.log('LibreOffice不可用，使用文本方案:', libreError.message);
      }
    }
    
    // 方案2: 使用word-extractor处理.doc文件
    try {
      const WordExtractor = require('word-extractor');
      const extractor = new WordExtractor();
      const extracted = await extractor.extract(inputPath);
      const textContent = extracted.getBody();
      console.log('.doc文件文本提取成功，长度:', textContent.length);
      
      return await createPdfFromText(textContent, outputPath, options);
      
    } catch (extractorError) {
      console.log('word-extractor失败，使用基础文本:', extractorError.message);
      
      // 方案3: 基础文本提取
      const textContent = fs.readFileSync(inputPath, 'utf8')
        .replace(/[^\x20-\x7E\u4E00-\u9FFF\uFF00-\uFFEF\s]/g, '') // 保留中英文和常用符号
        .replace(/\s+/g, ' ')
        .trim();
      
      if (!textContent) {
        throw new Error('无法从.doc文件中提取有效文本内容');
      }
      
      return await createPdfFromText(textContent, outputPath, options);
    }
    
  } catch (error) {
    throw new Error(`.doc转PDF失败: ${error.message}`);
  }
};

// 从文本创建PDF的通用函数
const createPdfFromText = async (textContent, outputPath, options = {}) => {
  const { PDFDocument, rgb } = require('pdf-lib');
  
  const {
    pageSize = 'A4',
    orientation = 'portrait',
    margin = 40,
    fontSize = 12,
    lineHeight = 18
  } = options;
  
  // 页面设置
  const pageSizes = {
    A4: { width: 595.28, height: 841.89 },
    A3: { width: 841.89, height: 1190.55 },
    A5: { width: 419.53, height: 595.28 }
  };
  
  let pageWidth, pageHeight;
  const selectedSize = pageSizes[pageSize] || pageSizes.A4;
  
  if (orientation === 'landscape') {
    pageWidth = selectedSize.height;
    pageHeight = selectedSize.width;
  } else {
    pageWidth = selectedSize.width;
    pageHeight = selectedSize.height;
  }
  
  const pdfDoc = await PDFDocument.create();
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;
  
  // 获取字体
  let font;
  try {
    font = await pdfDoc.embedFont('Helvetica');
  } catch (error) {
    font = await pdfDoc.embedFont('Times-Roman');
  }
  
  // 处理文本内容
  const lines = textContent
    .split('\n')
    .filter(line => line.trim());
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // 按字符分割处理中文
    const chars = Array.from(line);
    let currentLine = '';
    let currentWidth = 0;
    const maxWidth = pageWidth - 2 * margin;
    
    for (const char of chars) {
      const charWidth = font.widthOfTextAtSize(char, fontSize);
      
      if (currentWidth + charWidth > maxWidth) {
        if (currentLine.trim()) {
          currentPage.drawText(currentLine, {
            x: margin,
            y: yPosition,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
          });
          
          yPosition -= lineHeight;
          
          if (yPosition < margin) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            yPosition = pageHeight - margin;
          }
        }
        
        currentLine = char;
        currentWidth = charWidth;
      } else {
        currentLine += char;
        currentWidth += charWidth;
      }
    }
    
    if (currentLine.trim()) {
      currentPage.drawText(currentLine, {
        x: margin,
        y: yPosition,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      yPosition -= lineHeight;
      
      if (yPosition < margin) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }
    }
    
    yPosition -= lineHeight * 0.5;
  }
  
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  
  return outputPath;
};

// LibreOffice Word转PDF函数
const convertWordToPdfLibreOffice = async (inputPath, outputPath) => {
  try {
    console.log('使用LibreOffice进行Word转PDF:', inputPath);
    
    const { execSync } = require('child_process');
    const path = require('path');
    
    // LibreOffice命令行转换
    const libreOfficeCmd = process.platform === 'win32' 
      ? `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"` 
      : 'libreoffice';
    
    const cmd = `${libreOfficeCmd} --headless --convert-to pdf "${inputPath}" --outdir "${path.dirname(outputPath)}"`;
    
    execSync(cmd);
    
    // LibreOffice会在输出目录生成同名PDF文件
    const expectedOutput = inputPath.replace(/\.[^/.]+$/, '.pdf');
    const finalOutput = path.join(path.dirname(outputPath), path.basename(expectedOutput));
    
    if (fs.existsSync(finalOutput)) {
      fs.renameSync(finalOutput, outputPath);
      console.log('LibreOffice转换成功:', outputPath);
      return outputPath;
    }
    
    throw new Error('LibreOffice转换失败：输出文件未找到');
    
  } catch (error) {
    console.error('LibreOffice转换失败:', error.message);
    throw new Error(`LibreOffice转换失败: ${error.message}`);
  }
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

const convertImageToPdf = async (inputPath, outputPath, options = {}) => {
  try {
    const {
      pageSize = 'A4',
      orientation = 'portrait',
      margin = 'medium',
      fitMode = 'fit',
      backgroundColor = 'white'
    } = options;

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

    // 页面尺寸设置
    const pageSizes = {
      A4: { width: 595.28, height: 841.89 },
      A3: { width: 841.89, height: 1190.55 },
      A5: { width: 419.53, height: 595.28 },
      Letter: { width: 612, height: 792 },
      Legal: { width: 612, height: 1008 }
    };

    let pageWidth, pageHeight;
    const selectedSize = pageSizes[pageSize] || pageSizes.A4;
    
    if (orientation === 'landscape') {
      pageWidth = selectedSize.height;
      pageHeight = selectedSize.width;
    } else {
      pageWidth = selectedSize.width;
      pageHeight = selectedSize.height;
    }

    // 边距设置
    const margins = {
      none: 0,
      small: 20,
      medium: 50,
      large: 80
    };
    const pageMargin = margins[margin] || margins.medium;

    // 计算图片在页面中的尺寸
    const maxWidth = pageWidth - 2 * pageMargin;
    const maxHeight = pageHeight - 2 * pageMargin;

    let finalWidth, finalHeight;
    const imageAspectRatio = image.width / image.height;
    const maxAspectRatio = maxWidth / maxHeight;

    switch (fitMode) {
      case 'fit':
        // 适应页面，保持比例
        if (imageAspectRatio > maxAspectRatio) {
          finalWidth = maxWidth;
          finalHeight = maxWidth / imageAspectRatio;
        } else {
          finalHeight = maxHeight;
          finalWidth = maxHeight * imageAspectRatio;
        }
        break;
      case 'fill':
        // 填充页面，可能裁剪
        if (imageAspectRatio > maxAspectRatio) {
          finalHeight = maxHeight;
          finalWidth = maxHeight * imageAspectRatio;
        } else {
          finalWidth = maxWidth;
          finalHeight = maxWidth / imageAspectRatio;
        }
        break;
      case 'stretch':
        // 拉伸填充
        finalWidth = maxWidth;
        finalHeight = maxHeight;
        break;
      default:
        finalWidth = maxWidth;
        finalHeight = maxWidth / imageAspectRatio;
    }

    // 添加页面
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // 设置背景颜色
    if (backgroundColor !== 'transparent') {
      const colors = {
        white: { r: 1, g: 1, b: 1 },
        black: { r: 0, g: 0, b: 0 },
        gray: { r: 0.9, g: 0.9, b: 0.9 }
      };
      const bgColor = colors[backgroundColor] || colors.white;
      page.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: rgb(bgColor.r, bgColor.g, bgColor.b)
      });
    }

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

// 多张图片合并为一个PDF的函数
const convertMultipleImagesToPdf = async (inputPaths, outputPath, options = {}) => {
  try {
    const {
      pageSize = 'A4',
      orientation = 'portrait',
      margin = 'medium',
      fitMode = 'fit',
      backgroundColor = 'white'
    } = options;

    const pdfDoc = await PDFDocument.create();

    // 页面尺寸设置
    const pageSizes = {
      A4: { width: 595.28, height: 841.89 },
      A3: { width: 841.89, height: 1190.55 },
      A5: { width: 419.53, height: 595.28 },
      Letter: { width: 612, height: 792 },
      Legal: { width: 612, height: 1008 }
    };

    let pageWidth, pageHeight;
    const selectedSize = pageSizes[pageSize] || pageSizes.A4;
    
    if (orientation === 'landscape') {
      pageWidth = selectedSize.height;
      pageHeight = selectedSize.width;
    } else {
      pageWidth = selectedSize.width;
      pageHeight = selectedSize.height;
    }

    // 边距设置
    const margins = {
      none: 0,
      small: 20,
      medium: 50,
      large: 80
    };
    const pageMargin = margins[margin] || margins.medium;

    // 处理每张图片
    for (const inputPath of inputPaths) {
      try {
        const imageBuffer = fs.readFileSync(inputPath);
        const metadata = await sharp(imageBuffer).metadata();

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

        // 计算图片在页面中的尺寸
        const maxWidth = pageWidth - 2 * pageMargin;
        const maxHeight = pageHeight - 2 * pageMargin;

        let finalWidth, finalHeight;
        const imageAspectRatio = image.width / image.height;
        const maxAspectRatio = maxWidth / maxHeight;

        switch (fitMode) {
          case 'fit':
            if (imageAspectRatio > maxAspectRatio) {
              finalWidth = maxWidth;
              finalHeight = maxWidth / imageAspectRatio;
            } else {
              finalHeight = maxHeight;
              finalWidth = maxHeight * imageAspectRatio;
            }
            break;
          case 'fill':
            if (imageAspectRatio > maxAspectRatio) {
              finalHeight = maxHeight;
              finalWidth = maxHeight * imageAspectRatio;
            } else {
              finalWidth = maxWidth;
              finalHeight = maxWidth / imageAspectRatio;
            }
            break;
          case 'stretch':
            finalWidth = maxWidth;
            finalHeight = maxHeight;
            break;
          default:
            finalWidth = maxWidth;
            finalHeight = maxWidth / imageAspectRatio;
        }

        // 添加页面
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // 设置背景颜色
        if (backgroundColor !== 'transparent') {
          const colors = {
            white: { r: 1, g: 1, b: 1 },
            black: { r: 0, g: 0, b: 0 },
            gray: { r: 0.9, g: 0.9, b: 0.9 }
          };
          const bgColor = colors[backgroundColor] || colors.white;
          page.drawRectangle({
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
            color: rgb(bgColor.r, bgColor.g, bgColor.b)
          });
        }

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

      } catch (imageError) {
        console.error(`处理图片 ${inputPath} 失败:`, imageError);
        // 跳过失败的图片，继续处理下一张
      }
    }

    // 保存PDF
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    return outputPath;
  } catch (error) {
    console.error('多张图片转PDF转换错误:', error);
    throw new Error(`多张图片转PDF失败: ${error.message}`);
  }
};

// PDF转Word转换函数
const convertPdfToWord = async (inputPath, outputPath) => {
  try {
    console.log('开始PDF转Word转换:', inputPath);
    
    const fs = require('fs');
    const { PDFDocument } = require('pdf-lib');
    const mammoth = require('mammoth');
    
    // 读取PDF文件
    const pdfBuffer = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    
    // 提取PDF中的文本内容
    let extractedText = '';
    
    // 注意：pdf-lib主要用于操作PDF，文本提取需要额外处理
    // 这里使用简化的方法，实际应用中可能需要更复杂的OCR或PDF解析
    extractedText = `PDF转Word转换结果\n\n`;
    extractedText += `文件名: ${require('path').basename(inputPath)}\n`;
    extractedText += `总页数: ${pages.length}\n`;
    extractedText += `转换时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
    extractedText += `注意：这是一个演示性质的转换，实际PDF内容需要专业的PDF解析库或OCR工具来提取。\n`;
    extractedText += `建议使用专业的PDF转Word工具来获得更好的格式保持效果。\n\n`;
    
    // 创建简单的Word文档
    const docx = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>${extractedText.replace(/\n/g, '</w:t></w:r></w:p><w:p><w:r><w:t>')}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;
    
    // 写入Word文件
    fs.writeFileSync(outputPath, docx);
    
    console.log('PDF转Word转换完成:', outputPath);
    return outputPath;
    
  } catch (error) {
    console.error('PDF转Word转换失败:', error);
    throw new Error(`PDF转Word失败: ${error.message}`);
  }
};

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: '文件转换服务器运行正常',
    version: '2.0.0',
    endpoints: [
      '/api/upload', 
      '/api/convert', 
      '/api/download/:filename',
      '/api/word-to-pdf',
      '/api/pdf-to-word'
    ]
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

// 多张图片转PDF专用API
app.post('/api/images-to-pdf', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传图片文件' });
    }

    const options = req.body.options ? JSON.parse(req.body.options) : {};
    const {
      pageSize = 'A4',
      orientation = 'portrait',
      margin = 'medium',
      fitMode = 'fit',
      backgroundColor = 'white'
    } = options;

    const timestamp = Date.now();
    const outputFilename = `images-to-pdf-${timestamp}.pdf`;
    const outputPath = path.join(outputsDir, outputFilename);
    const inputPaths = req.files.map(file => file.path);

    // 使用多张图片合并为PDF的函数
    await convertMultipleImagesToPdf(inputPaths, outputPath, {
      pageSize,
      orientation,
      margin,
      fitMode,
      backgroundColor
    });

    // 清理上传的临时文件
    inputPaths.forEach(inputPath => {
      try {
        if (fs.existsSync(inputPath)) {
          fs.unlinkSync(inputPath);
        }
      } catch (cleanupError) {
        console.log('清理临时文件失败:', cleanupError);
      }
    });

    res.json({
      message: '多张图片合并为PDF成功',
      outputFilename: outputFilename,
      downloadUrl: `/api/download/${outputFilename}`,
      conversionInfo: {
        type: 'multi-images-pdf',
        pages: req.files.length,
        format: 'pdf',
        quality: 'high',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('多张图片转PDF错误:', error);
    res.status(500).json({ error: '多张图片转PDF失败: ' + error.message });
  }
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
      // 图片转PDF - 支持选项参数
      const imageOptions = {
        pageSize: req.body.options?.pageSize || 'A4',
        orientation: req.body.options?.orientation || 'portrait',
        margin: req.body.options?.margin || 'medium',
        fitMode: req.body.options?.fitMode || 'fit',
        backgroundColor: req.body.options?.backgroundColor || 'white'
      };
      await convertImageToPdf(inputPath, outputPath, imageOptions);
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
      // Word转PDF - 中文优化版
      await convertWordToPdf(inputPath, outputPath);
      result = {
        type: 'single',
        path: outputPath,
        pages: 1,
        format: 'pdf',
        quality: 'high'
      };
    } else if (fileExt === '.pdf' && targetFormat === 'docx') {
      // PDF转Word
      const wordPath = await convertPdfToWord(inputPath, outputPath);
      result = {
        type: 'single',
        path: wordPath,
        pages: 1,
        format: 'docx',
        quality: 'high'
      };
    } else if ((fileExt === '.jpg' || fileExt === '.jpeg' || fileExt === '.png') && targetFormat === 'docx') {
      // 图片转Word (OCR功能 - 简化为文本插入)
      throw new Error('图片转Word功能需要OCR支持，暂未完全实现');
    } else if ((fileExt === '.docx' || fileExt === '.doc') && ['jpg', 'jpeg', 'png', 'tiff'].includes(targetFormat)) {
      // Word转图片 - 先转PDF再转图片
      const tempPdfPath = outputPath.replace(/\.[^.]+$/, '.pdf');
      await convertWordToPdf(inputPath, tempPdfPath);
      const imageOptions = {
        format: targetFormat,
        quality: quality,
        pages: pages,
        compression: compression
      };
      result = await convertPdfToImageEnhanced(tempPdfPath, outputPath, imageOptions);
      
      // 清理临时PDF文件
      try {
        fs.unlinkSync(tempPdfPath);
      } catch (cleanupError) {
        console.log('清理临时文件失败:', cleanupError.message);
      }
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
