const path = require('path');
const fs = require('fs');

// 测试健壮版PDF转换器
async function testRobustConverter() {
  console.log('=== 测试健壮版PDF转换器 ===');
  
  try {
    // 导入转换函数
    const converterPath = path.join(__dirname, 'server', 'robust-pdf-converter.js');
    
    // 检查是否有现有的PDF文件可以测试
    const uploadsDir = path.join(__dirname, 'server', 'uploads');
    const outputsDir = path.join(__dirname, 'server', 'outputs');
    
    console.log('检查上传目录:', uploadsDir);
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('❌ 上传目录不存在');
      return;
    }
    
    const files = fs.readdirSync(uploadsDir);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
    
    console.log('找到PDF文件:', pdfFiles.length, '个');
    
    if (pdfFiles.length === 0) {
      console.log('❌ 没有找到PDF文件进行测试');
      return;
    }
    
    // 选择第一个PDF文件进行测试
    const testPdfFile = pdfFiles[0];
    const inputPath = path.join(uploadsDir, testPdfFile);
    
    console.log('测试文件:', testPdfFile);
    console.log('文件路径:', inputPath);
    
    // 检查文件是否存在
    if (!fs.existsSync(inputPath)) {
      console.log('❌ 测试文件不存在');
      return;
    }
    
    const fileStats = fs.statSync(inputPath);
    console.log('文件大小:', (fileStats.size / 1024).toFixed(2), 'KB');
    
    // 测试PDF.js方案
    console.log('\n=== 测试PDF.js方案 ===');
    
    try {
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
      
      console.log('✅ Canvas polyfills设置完成');
      
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = null;
      
      console.log('✅ PDF.js导入成功');
      
      const pdfBuffer = fs.readFileSync(inputPath);
      const pdfData = new Uint8Array(pdfBuffer);
      
      console.log('✅ PDF文件读取成功，大小:', pdfData.length, '字节');
      
      const loadingTask = pdfjsLib.getDocument({
        data: pdfData,
        verbosity: 0,
        disableWorker: true,
        isEvalSupported: false,
        disableAutoFetch: true,
        disableStream: true
      });
      
      const pdfDocument = await loadingTask.promise;
      console.log(`✅ PDF加载成功，共${pdfDocument.numPages}页`);
      
      // 测试渲染第一页
      const page = await pdfDocument.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });
      
      console.log(`✅ 第1页信息: ${viewport.width} x ${viewport.height}`);
      
      const testCanvas = canvas.createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const testContext = testCanvas.getContext('2d');
      
      testContext.fillStyle = 'white';
      testContext.fillRect(0, 0, testCanvas.width, testCanvas.height);
      
      const renderContext = {
        canvasContext: testContext,
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
      
      // 保存测试图片
      const testOutputPath = path.join(outputsDir, 'test-robust-output.jpg');
      const testBuffer = testCanvas.toBuffer('image/jpeg', { quality: 0.95 });
      fs.writeFileSync(testOutputPath, testBuffer);
      
      const outputStats = fs.statSync(testOutputPath);
      console.log(`🎉 PDF.js测试成功！输出文件: ${testOutputPath}`);
      console.log(`📊 输出文件大小: ${(outputStats.size / 1024).toFixed(2)} KB`);
      
    } catch (pdfjsError) {
      console.log('❌ PDF.js测试失败:', pdfjsError.message);
      console.log('错误详情:', pdfjsError.stack);
    }
    
    // 测试pdf-parse方案
    console.log('\n=== 测试pdf-parse方案 ===');
    
    try {
      const pdfParse = require('pdf-parse');
      const pdfBuffer = fs.readFileSync(inputPath);
      const pdfData = await pdfParse(pdfBuffer);
      
      console.log(`✅ PDF文本提取成功`);
      console.log(`📄 页数: ${pdfData.numpages}`);
      console.log(`📝 文本长度: ${pdfData.text.length}字符`);
      console.log(`📋 文本预览: ${pdfData.text.substring(0, 100)}...`);
      
      if (pdfData.text && pdfData.text.trim().length > 0) {
        console.log('🎉 pdf-parse方案可用作兜底方案');
      } else {
        console.log('⚠️ PDF文本为空，pdf-parse方案不适用');
      }
      
    } catch (parseError) {
      console.log('❌ pdf-parse测试失败:', parseError.message);
    }
    
    console.log('\n=== 测试完成 ===');
    console.log('建议：');
    console.log('1. 如果PDF.js测试成功，说明修复有效');
    console.log('2. 如果仍有问题，可以安装ImageMagick使用pdf2pic方案');
    console.log('3. pdf-parse可以作为最后的兜底方案');
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 运行测试
testRobustConverter().catch(console.error);
