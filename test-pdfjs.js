// 测试PDF.js是否能正常工作
const fs = require('fs');
const path = require('path');

async function testPDFjs() {
  try {
    console.log('开始测试PDF.js...');
    
    // 尝试导入pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    console.log('✅ PDF.js库导入成功');
    
    // 检查是否有测试PDF文件
    const testPdfPath = path.join(__dirname, 'server/uploads');
    if (!fs.existsSync(testPdfPath)) {
      console.log('❌ 没有找到uploads目录，无法进行完整测试');
      return;
    }
    
    const pdfFiles = fs.readdirSync(testPdfPath).filter(file => file.endsWith('.pdf'));
    if (pdfFiles.length === 0) {
      console.log('❌ 没有找到PDF文件，无法进行完整测试');
      console.log('请先上传一个PDF文件到server/uploads目录');
      return;
    }
    
    const testFile = path.join(testPdfPath, pdfFiles[0]);
    console.log(`📄 使用测试文件: ${pdfFiles[0]}`);
    
    // 读取PDF文件
    const pdfBuffer = fs.readFileSync(testFile);
    console.log(`📊 文件大小: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    
    // 加载PDF文档
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBuffer,
      verbosity: 0
    });
    
    const pdfDocument = await loadingTask.promise;
    console.log(`✅ PDF加载成功，共${pdfDocument.numPages}页`);
    
    // 获取第一页
    const page = await pdfDocument.getPage(1);
    console.log('✅ 成功获取第一页');
    
    // 获取页面尺寸
    const viewport = page.getViewport({ scale: 1.0 });
    console.log(`📐 页面尺寸: ${viewport.width.toFixed(0)} x ${viewport.height.toFixed(0)}`);
    
    console.log('🎉 PDF.js测试完全成功！');
    console.log('现在可以进行真实的PDF内容渲染了！');
    
  } catch (error) {
    console.error('❌ PDF.js测试失败:', error.message);
    console.log('可能的解决方案:');
    console.log('1. 确保已安装pdfjs-dist: npm install pdfjs-dist');
    console.log('2. 检查PDF文件是否有效');
    console.log('3. 检查Node.js版本兼容性');
  }
}

// 运行测试
testPDFjs();
