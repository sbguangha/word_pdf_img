// 调试Canvas渲染问题
const fs = require('fs');
const path = require('path');

async function debugCanvasRendering() {
  try {
    console.log('=== 调试Canvas渲染问题 ===');
    
    // 检查PDF文件
    const uploadsDir = path.join(__dirname, 'server/uploads');
    const files = fs.readdirSync(uploadsDir);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      console.log('❌ 没有找到PDF文件');
      return;
    }
    
    const testFile = path.join(uploadsDir, pdfFiles[0]);
    console.log(`📄 测试文件: ${pdfFiles[0]}`);
    
    // 设置Canvas环境
    const canvas = require('canvas');
    console.log('✅ Canvas模块加载成功');
    
    // 设置polyfills
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
      console.log('✅ DOMMatrix polyfill设置完成');
    }
    
    // 导入PDF.js
    console.log('📦 导入PDF.js...');
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    console.log('✅ PDF.js导入成功');
    
    // 读取PDF
    const pdfBuffer = fs.readFileSync(testFile);
    const pdfData = new Uint8Array(pdfBuffer);
    console.log(`📊 PDF数据大小: ${pdfData.length} bytes`);
    
    // 加载PDF文档
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      verbosity: 1
    });
    
    const pdfDocument = await loadingTask.promise;
    console.log(`✅ PDF加载成功，共${pdfDocument.numPages}页`);
    
    // 获取第一页
    const page = await pdfDocument.getPage(1);
    console.log('✅ 获取第一页成功');
    
    // 获取页面信息
    const viewport = page.getViewport({ scale: 1.0 });
    console.log(`📐 原始页面尺寸: ${viewport.width.toFixed(0)} x ${viewport.height.toFixed(0)}`);
    
    // 创建小尺寸测试Canvas
    const testScale = 1.0;
    const testViewport = page.getViewport({ scale: testScale });
    const testCanvas = canvas.createCanvas(testViewport.width, testViewport.height);
    const testContext = testCanvas.getContext('2d');
    
    console.log(`🎨 测试Canvas尺寸: ${testViewport.width.toFixed(0)} x ${testViewport.height.toFixed(0)}`);
    
    // 设置白色背景
    testContext.fillStyle = 'white';
    testContext.fillRect(0, 0, testViewport.width, testViewport.height);
    console.log('✅ 白色背景设置完成');
    
    // 添加测试标记
    testContext.fillStyle = 'red';
    testContext.fillRect(10, 10, 50, 50);
    testContext.fillStyle = 'blue';
    testContext.font = '20px Arial';
    testContext.fillText('TEST', 70, 40);
    console.log('✅ 测试标记添加完成');
    
    // 渲染PDF内容
    console.log('🖼️ 开始渲染PDF内容...');
    const renderContext = {
      canvasContext: testContext,
      viewport: testViewport
    };
    
    const renderTask = page.render(renderContext);
    await renderTask.promise;
    console.log('✅ PDF内容渲染完成');
    
    // 保存测试图片
    const outputPath = path.join(__dirname, 'debug-canvas-test.jpg');
    const buffer = testCanvas.toBuffer('image/jpeg', { quality: 0.95 });
    fs.writeFileSync(outputPath, buffer);
    
    const stats = fs.statSync(outputPath);
    console.log(`💾 测试图片保存: debug-canvas-test.jpg`);
    console.log(`📊 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // 创建纯Canvas测试（无PDF内容）
    const pureCanvas = canvas.createCanvas(400, 300);
    const pureContext = pureCanvas.getContext('2d');
    
    pureContext.fillStyle = 'white';
    pureContext.fillRect(0, 0, 400, 300);
    
    pureContext.fillStyle = 'black';
    pureContext.font = '24px Arial';
    pureContext.fillText('Pure Canvas Test', 50, 50);
    
    pureContext.fillStyle = 'green';
    pureContext.fillRect(50, 100, 100, 100);
    
    const pureBuffer = pureCanvas.toBuffer('image/jpeg', { quality: 0.95 });
    const pureOutputPath = path.join(__dirname, 'debug-pure-canvas.jpg');
    fs.writeFileSync(pureOutputPath, pureBuffer);
    
    const pureStats = fs.statSync(pureOutputPath);
    console.log(`💾 纯Canvas测试图片保存: debug-pure-canvas.jpg`);
    console.log(`📊 文件大小: ${(pureStats.size / 1024).toFixed(2)} KB`);
    
    console.log('\n🔍 调试结果分析:');
    console.log('1. 检查 debug-canvas-test.jpg - 应该包含PDF内容和测试标记');
    console.log('2. 检查 debug-pure-canvas.jpg - 应该是纯Canvas绘制的测试图');
    console.log('3. 如果两个文件都正常，说明Canvas工作正常');
    console.log('4. 如果PDF内容没有显示，可能是字体或渲染问题');
    
  } catch (error) {
    console.error('❌ Canvas调试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

debugCanvasRendering();
