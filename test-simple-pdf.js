// 创建一个简单的PDF来测试渲染
const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

async function createAndTestSimplePDF() {
  try {
    console.log('=== 创建简单PDF测试 ===');
    
    // 创建一个简单的PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    
    // 添加文本
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText('Hello PDF.js Test!', {
      x: 50,
      y: 350,
      size: 30,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('This is a simple test PDF', {
      x: 50,
      y: 300,
      size: 20,
      font: font,
      color: rgb(0, 0, 1),
    });
    
    // 添加矩形
    page.drawRectangle({
      x: 50,
      y: 200,
      width: 200,
      height: 100,
      borderColor: rgb(1, 0, 0),
      borderWidth: 2,
    });
    
    // 保存PDF
    const pdfBytes = await pdfDoc.save();
    const testPdfPath = path.join(__dirname, 'test-simple.pdf');
    fs.writeFileSync(testPdfPath, pdfBytes);
    console.log('✅ 简单PDF创建完成: test-simple.pdf');
    
    // 现在用PDF.js渲染这个简单PDF
    console.log('📦 使用PDF.js渲染简单PDF...');
    
    const canvas = require('canvas');
    
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
    }
    
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // 读取刚创建的PDF
    const pdfBuffer = fs.readFileSync(testPdfPath);
    const pdfData = new Uint8Array(pdfBuffer);
    
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      verbosity: 1
    });
    
    const pdfDocument = await loadingTask.promise;
    console.log(`✅ 简单PDF加载成功，共${pdfDocument.numPages}页`);
    
    const page1 = await pdfDocument.getPage(1);
    const viewport = page1.getViewport({ scale: 2.0 });
    
    const canvasInstance = canvas.createCanvas(viewport.width, viewport.height);
    const context = canvasInstance.getContext('2d');
    
    // 白色背景
    context.fillStyle = 'white';
    context.fillRect(0, 0, viewport.width, viewport.height);
    
    // 渲染PDF
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page1.render(renderContext).promise;
    console.log('✅ 简单PDF渲染完成');
    
    // 保存渲染结果
    const outputPath = path.join(__dirname, 'test-simple-rendered.jpg');
    const buffer = canvasInstance.toBuffer('image/jpeg', { quality: 0.95 });
    fs.writeFileSync(outputPath, buffer);
    
    const stats = fs.statSync(outputPath);
    console.log(`💾 简单PDF渲染结果: test-simple-rendered.jpg`);
    console.log(`📊 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
    
    console.log('\n🔍 测试结果:');
    console.log('1. 检查 test-simple.pdf - 原始PDF文件');
    console.log('2. 检查 test-simple-rendered.jpg - PDF.js渲染结果');
    console.log('3. 如果渲染结果包含文本和矩形，说明PDF.js工作正常');
    console.log('4. 如果只有白色背景，说明渲染有问题');
    
  } catch (error) {
    console.error('❌ 简单PDF测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

createAndTestSimplePDF();
