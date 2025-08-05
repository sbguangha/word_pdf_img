const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const MultiStrategyConverter = require('./multi-strategy-converter');
const { ConversionProgress } = require('./conversion-progress');
const MemoryOptimizer = require('./memory-optimizer');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 创建依赖实例
const converter = new MultiStrategyConverter();
const progress = new ConversionProgress();
const optimizer = new MemoryOptimizer();

// 创建目录
const uploadsDir = path.join(__dirname, 'uploads');
const outputsDir = path.join(__dirname, 'outputs');

[uploadsDir, outputsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  const strategies = converter.getStrategyInfo();
  const memory = optimizer.getMemoryUsage();
  const stats = optimizer.getCleanupStats();
  
  res.json({
    status: 'healthy',
    strategies,
    memory,
    files: stats,
    timestamp: new Date().toISOString()
  });
});

// 文件上传
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未上传文件' });
  }

  res.json({
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    uploadTime: new Date().toISOString()
  });
});

// 增强版转换端点
app.post('/api/convert', async (req, res) => {
  const {
    filename,
    targetFormat = 'jpg',
    quality = 'high',
    pages = 'all',
    compression = 85
  } = req.body;

  if (!filename) {
    return res.status(400).json({ error: '缺少文件名' });
  }

  const inputPath = path.join(uploadsDir, filename);
  if (!fs.existsSync(inputPath)) {
    return res.status(404).json({ error: '文件不存在' });
  }

  const conversionId = `conv-${Date.now()}`;
  const outputDir = path.join(outputsDir, conversionId);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    const fileSize = fs.statSync(inputPath).size;
    const totalPages = await getPdfPageCount(inputPath);
    
    progress.startConversion(conversionId, filename, totalPages);

    const result = await converter.convertWithFallback(
      inputPath,
      outputDir,
      { format: targetFormat, quality, pages }
    );

    progress.completeConversion(conversionId, result);

    // 处理结果
    let response;
    if (result.files.length === 1) {
      // 单文件
      const outputFile = result.files[0];
      const outputFilename = path.basename(outputFile);
      fs.renameSync(outputFile, path.join(outputsDir, outputFilename));
      
      response = {
        message: '转换成功',
        outputFilename,
        downloadUrl: `/api/download/${outputFilename}`,
        conversionInfo: {
          strategy: result.strategyUsed,
          pages: result.files.length,
          format: targetFormat,
          quality,
          duration: progress.getConversionStatus(conversionId)?.duration || 0
        }
      };
    } else {
      // 多文件打包为ZIP
      const JSZip = require('jszip');
      const zip = new JSZip();

      for (let i = 0; i < result.files.length; i++) {
        const buffer = fs.readFileSync(result.files[i]);
        const filename = `page-${String(i + 1).padStart(3, '0')}.${targetFormat}`;
        zip.file(filename, buffer);
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      const zipFilename = `${path.parse(filename).name}-converted.zip`;
      const zipPath = path.join(outputsDir, zipFilename);
      fs.writeFileSync(zipPath, zipBuffer);

      // 清理临时文件
      fs.rmSync(outputDir, { recursive: true, force: true });

      response = {
        message: `转换成功，共${result.files.length}页，已打包为ZIP`,
        outputFilename: zipFilename,
        downloadUrl: `/api/download/${zipFilename}`,
        conversionInfo: {
          strategy: result.strategyUsed,
          pages: result.files.length,
          format: targetFormat,
          quality,
          duration: progress.getConversionStatus(conversionId)?.duration || 0
        }
      };
    }

    res.json(response);

  } catch (error) {
    progress.failConversion(conversionId, error);
    res.status(500).json({ 
      error: '转换失败: ' + error.message,
      suggestion: '请检查文件格式是否正确，或尝试降低质量设置'
    });
  }
});

// 获取转换进度
app.get('/api/progress/:conversionId', (req, res) => {
  const { conversionId } = req.params;
  const status = progress.getConversionStatus(conversionId);
  
  if (!status) {
    return res.status(404).json({ error: '转换任务未找到' });
  }

  res.json(progress.generateReport(conversionId));
});

// 下载文件
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(outputsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }

  res.download(filePath);
});

// 获取系统状态
app.get('/api/system/status', (req, res) => {
  const stats = optimizer.getStats();
  const activeConversions = progress.getActiveConversions();
  
  res.json({
    system: {
      memory: optimizer.getMemoryUsage(),
      files: stats,
      activeConversions: activeConversions.length
    },
    strategies: converter.getStrategyInfo(),
    timestamp: new Date().toISOString()
  });
});

// 手动清理端点
app.post('/api/cleanup', async (req, res) => {
  try {
    const result = await optimizer.performCleanup();
    res.json({ message: '清理完成', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 辅助函数：获取PDF页数
async function getPdfPageCount(pdfPath) {
  const { execSync } = require('child_process');
  try {
    const gsBinary = process.platform === 'win32' ? 'gswin64c' : 'gs';
    const result = execSync(`${gsBinary} -q -dNODISPLAY -c "(${pdfPath}) (r) file runpdfbegin pdfpagecount = quit"`, 
      { encoding: 'utf8' });
    return parseInt(result.trim());
  } catch (error) {
    // 备用方法
    return 1;
  }
}

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? error.message : '请联系管理员'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 PDF转换服务器运行在端口 ${PORT}`);
  console.log(`📊 系统状态: http://localhost:${PORT}/api/system/status`);
  console.log(`🧪 健康检查: http://localhost:${PORT}/api/health`);
});

module.exports = app;