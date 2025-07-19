const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { PDFDocument, rgb } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3002;

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

// 创建日志文件
const logFile = path.join(__dirname, 'reliable-conversion.log');
function log(message) {
  const timestamp = new Date().toLocaleString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logMessage);
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

// 可靠的PDF转图片函数 - 使用pdf2pic
const convertPdfToImagesReliable = async (inputPath, outputPath) => {
  try {
    log('=== 开始可靠版PDF按页转图片 ===');
    log('输入文件: ' + inputPath);
    log('输出文件: ' + outputPath);
    
    // 方法1: 使用pdf2pic进行真实PDF渲染（按页拆分）
    try {
      log('🎯 === 方案1: 使用pdf2pic进行按页拆分渲染 ===');
      
      const pdf2pic = require('pdf2pic');
      
      // 创建输出目录（以时间戳命名）
      const timestamp = Date.now();
      const outputDir = path.join(path.dirname(outputPath), `pdf-pages-${timestamp}`);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // 配置pdf2pic选项 - 高质量设置
      const options = {
        density: 300,           // 高分辨率300 DPI
        saveFilename: "page",   // 文件名前缀
        savePath: outputDir,    // 保存路径
        format: "jpg",          // 输出格式
        width: 2480,           // A4纸张宽度（300 DPI）
        height: 3508,          // A4纸张高度（300 DPI）
        quality: 95            // JPEG质量
      };
      
      const convert = pdf2pic.fromPath(inputPath, options);
      log('📄 开始按页转换PDF...');
      
      // 转换所有页面
      const results = await convert.bulk(-1, { responseType: "image" });
      log(`✅ pdf2pic转换完成，共处理${results.length}页`);
      
      const pageFiles = [];
      
      // 处理每个转换结果
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result && result.path && fs.existsSync(result.path)) {
          // 重命名文件为标准格式
          const pageNum = i + 1;
          const standardFilename = `page-${pageNum.toString().padStart(3, '0')}.jpg`;
          const standardPath = path.join(outputDir, standardFilename);
          
          if (result.path !== standardPath) {
            fs.renameSync(result.path, standardPath);
          }
          
          const pageStats = fs.statSync(standardPath);
          log(`✅ 第${pageNum}页保存成功: ${standardFilename} (${(pageStats.size / 1024).toFixed(2)} KB)`);
          
          pageFiles.push({
            filename: standardFilename,
            path: standardPath,
            size: pageStats.size,
            width: options.width,
            height: options.height
          });
        } else {
          log(`❌ 第${i+1}页转换失败`);
        }
      }
      
      if (pageFiles.length === 0) {
        throw new Error('pdf2pic没有成功转换任何页面');
      }
      
      log(`✅ pdf2pic成功转换${pageFiles.length}页`);
      
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
总页数: ${results.length}
成功转换: ${pageFiles.length}页
渲染方式: pdf2pic (GraphicsMagick/ImageMagick)
分辨率: ${options.density} DPI
输出尺寸: ${options.width}x${options.height}
JPEG质量: ${options.quality}%
生成时间: ${new Date().toLocaleString()}

页面详情:
${pageFiles.map((f, i) => `第${i+1}页: ${f.filename} (${f.width}x${f.height}, ${(f.size/1024).toFixed(2)}KB)`).join('\n')}

使用说明:
- 每个页面都是独立的高质量图片文件
- 所见即所得，保持原PDF的布局和比例
- 可以直接查看或进一步处理每个页面
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
      
    } catch (pdf2picError) {
      log('❌ pdf2pic渲染失败: ' + pdf2picError.message);
      
      // 检查是否是依赖问题
      if (pdf2picError.message.includes('spawn') || pdf2picError.message.includes('ENOENT')) {
        log('💡 提示: pdf2pic需要安装GraphicsMagick或ImageMagick');
        log('💡 Windows安装: https://imagemagick.org/script/download.php#windows');
        log('💡 或者: choco install imagemagick');
      }
      
      throw pdf2picError;
    }

  } catch (error) {
    log('❌ PDF转图片完全失败: ' + error.message);
    throw new Error(`PDF转图片失败: ${error.message}`);
  }
};

// API路由
app.get('/', (req, res) => {
  res.json({
    message: '可靠版PDF转图片服务器运行正常',
    version: '3.0.0',
    status: 'online',
    features: [
      'pdf2pic真实渲染',
      '按页拆分输出', 
      '高质量图片生成',
      'ZIP自动打包',
      '所见即所得'
    ],
    requirements: [
      'GraphicsMagick 或 ImageMagick',
      '推荐安装: choco install imagemagick'
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

    log(`开始转换: ${fileExt} -> ${targetFormat}`);

    let resultPath;
    let outputFilename;

    // 只支持PDF转图片
    if (fileExt === '.pdf' && (targetFormat === 'jpg' || targetFormat === 'jpeg')) {
      // PDF转图片 - 使用可靠版函数（返回ZIP文件）
      outputFilename = `converted-${timestamp}.${targetFormat}`;
      const outputPath = path.join(outputsDir, outputFilename);
      resultPath = await convertPdfToImagesReliable(inputPath, outputPath);
      outputFilename = path.basename(resultPath);
    } else {
      return res.status(400).json({
        error: `此服务器只支持PDF转JPG格式，不支持从 ${fileExt} 转换到 ${targetFormat} 格式`
      });
    }

    log('转换完成: ' + outputFilename);

    res.json({
      message: '转换成功',
      outputFilename: outputFilename,
      downloadUrl: `/api/download/${outputFilename}`,
      fileType: 'zip',
      description: 'ZIP文件包含所有页面的高质量图片'
    });

  } catch (error) {
    log('转换错误: ' + error.message);
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

    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    console.error('下载错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  log(`可靠版PDF转图片服务器启动成功！`);
  log(`服务器地址: http://localhost:${PORT}`);
  log(`功能特性:`);
  log(`  - pdf2pic真实PDF渲染`);
  log(`  - 按页拆分输出`);
  log(`  - 高质量图片生成`);
  log(`  - ZIP自动打包`);
  log(`  - 所见即所得`);
  log(`依赖要求:`);
  log(`  - GraphicsMagick 或 ImageMagick`);
  log(`  - 推荐安装: choco install imagemagick`);
  log(`上传目录: ${uploadsDir}`);
  log(`输出目录: ${outputsDir}`);
});
