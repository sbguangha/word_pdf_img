// 测试转换API
const fs = require('fs');
const path = require('path');

async function testConvert() {
  try {
    console.log('开始测试PDF转换API...');
    
    // 检查是否有PDF文件
    const uploadsDir = path.join(__dirname, 'server/uploads');
    const files = fs.readdirSync(uploadsDir);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      console.log('❌ 没有找到PDF文件');
      return;
    }
    
    const testFile = pdfFiles[0];
    console.log(`📄 使用测试文件: ${testFile}`);
    
    // 调用转换API
    const response = await fetch('http://localhost:3001/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: testFile,
        targetFormat: 'jpg'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ 转换失败:', errorData.error);
      return;
    }
    
    const result = await response.json();
    console.log('✅ 转换成功:', result);
    
    // 检查输出文件
    const outputPath = path.join(__dirname, 'server/outputs', result.outputFilename);
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`📊 输出文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
    } else {
      console.log('❌ 输出文件不存在');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testConvert();
