// 调试PDF.js渲染问题
const fs = require('fs');
const path = require('path');

async function debugPDFjs() {
  try {
    console.log('=== PDF.js调试开始 ===');
    
    // 检查uploads目录中的PDF文件
    const uploadsDir = path.join(__dirname, 'server/uploads');
    if (!fs.existsSync(uploadsDir)) {
      console.log('❌ uploads目录不存在');
      return;
    }
    
    const files = fs.readdirSync(uploadsDir);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      console.log('❌ 没有找到PDF文件');
      console.log('可用文件:', files);
      return;
    }
    
    const testFile = path.join(uploadsDir, pdfFiles[0]);
    console.log(`📄 测试文件: ${pdfFiles[0]}`);
    console.log(`📊 文件大小: ${(fs.statSync(testFile).size / 1024).toFixed(2)} KB`);
    
    // 设置polyfills
    const canvas = require('canvas');
    
    if (typeof global.DOMMatrix === 'undefined') {
      console.log('🔧 设置DOMMatrix polyfill...');
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
    
    console.log('📦 导入PDF.js...');
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    console.log('✅ PDF.js导入成功');
    
    // 读取PDF
    console.log('📖 读取PDF文件...');
    const pdfBuffer = fs.readFileSync(testFile);
    
    // 加载PDF文档
    console.log('🔄 加载PDF文档...');
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBuffer,
      verbosity: 1 // 增加日志级别
    });
    
    const pdfDocument = await loadingTask.promise;
    console.log(`✅ PDF加载成功，共${pdfDocument.numPages}页`);
    
    // 获取第一页
    console.log('📄 获取第一页...');
    const page = await pdfDocument.getPage(1);
    console.log('✅ 成功获取第一页');
    
    // 获取页面信息
    const viewport = page.getViewport({ scale: 1.0 });
    console.log(`📐 页面尺寸: ${viewport.width.toFixed(0)} x ${viewport.height.toFixed(0)}`);
    
    // 创建Canvas
    console.log('🎨 创建Canvas...');
    const scale = 2.0;
    const scaledViewport = page.getViewport({ scale });
    const canvasInstance = canvas.createCanvas(scaledViewport.width, scaledViewport.height);
    const context = canvasInstance.getContext('2d');
    
    console.log(`🎨 Canvas尺寸: ${scaledViewport.width.toFixed(0)} x ${scaledViewport.height.toFixed(0)}`);
    
    // 白色背景
    context.fillStyle = 'white';
    context.fillRect(0, 0, scaledViewport.width, scaledViewport.height);
    
    // 渲染PDF页面
    console.log('🖼️ 开始渲染PDF页面...');
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport
    };
    
    const renderTask = page.render(renderContext);
    await renderTask.promise;
    console.log('✅ PDF页面渲染完成');
    
    // 保存图片
    const outputPath = path.join(__dirname, 'debug-output.jpg');
    const buffer = canvasInstance.toBuffer('image/jpeg', { quality: 0.95 });
    fs.writeFileSync(outputPath, buffer);
    
    const stats = fs.statSync(outputPath);
    console.log(`💾 图片保存成功: debug-output.jpg`);
    console.log(`📊 输出文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
    
    console.log('🎉 PDF.js调试测试完全成功！');
    console.log('如果这个测试成功，说明PDF.js工作正常，问题可能在服务器代码中');
    
  } catch (error) {
    console.error('❌ PDF.js调试失败:', error.message);
    console.error('错误堆栈:', error.stack);
    
    if (error.message.includes('Cannot find module')) {
      console.log('\n🔧 可能的解决方案:');
      console.log('1. 重新安装pdfjs-dist: npm uninstall pdfjs-dist && npm install pdfjs-dist');
      console.log('2. 检查Node.js版本是否支持ES模块');
    }
    
    if (error.message.includes('DOMMatrix')) {
      console.log('\n🔧 DOM polyfill问题:');
      console.log('1. 安装jsdom: npm install jsdom');
      console.log('2. 或使用其他PDF渲染库');
    }
  }
}

// 运行调试
debugPDFjs();
