const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');

// 直接测试中文PDF生成
async function testChinesePdf() {
  console.log('=== 直接测试中文PDF生成 ===');
  
  try {
    // 创建PDF文档
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 添加中文字符
    const textContent = '中文测试\n大家好！\n这是一个中文测试文档。\n上、下、左、右\n中文转换功能正常！';
    
    doc.setFontSize(12);
    doc.text(textContent, 20, 20);
    
    // 保存到文件
    const outputPath = path.join(__dirname, 'server', 'outputs', 'chinese-test.pdf');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const pdfBytes = doc.output();
    fs.writeFileSync(outputPath, pdfBytes);
    
    console.log('✅ 中文PDF生成成功:', outputPath);
    console.log('📁 文件大小:', fs.statSync(outputPath).size, '字节');
    
    // 测试下载链接
    console.log('🔗 测试下载: http://localhost:3001/api/download/chinese-test.pdf');
    
  } catch (error) {
    console.error('❌ 中文PDF生成失败:', error.message);
  }
}

// 测试Word转PDF函数
async function testWordToPdfFunction() {
  console.log('=== 测试Word转PDF函数 ===');
  
  try {
    const convertWordToPdf = require('./server/index.js').convertWordToPdf;
    
    // 创建测试文件
    const testFilePath = path.join(__dirname, 'server', 'uploads', 'chinese-test.txt');
    const outputPath = path.join(__dirname, 'server', 'outputs', 'chinese-word-test.pdf');
    
    const testDir = path.dirname(testFilePath);
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    
    fs.writeFileSync(testFilePath, '中文测试\n这是一个包含中文字符的测试文档。\n上、下、左、右\n转换成功！');
    
    // 直接调用转换函数
    const result = await convertWordToPdf(testFilePath, outputPath);
    console.log('✅ Word转PDF成功:', result);
    
  } catch (error) {
    console.error('❌ Word转PDF失败:', error.message);
  }
}

// 运行测试
testChinesePdf().then(() => testWordToPdfFunction());