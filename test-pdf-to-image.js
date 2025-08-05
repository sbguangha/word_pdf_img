const fs = require('fs');
const path = require('path');

// 创建一个简单的测试PDF文件
const { PDFDocument, rgb } = require('pdf-lib');

async function createTestPDF() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  
  // 添加英文内容（避免中文编码问题）
  page.drawText('PDF to Image Test File', {
    x: 50,
    y: height - 100,
    size: 24,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('This is a test document for PDF to image conversion.', {
    x: 50,
    y: height - 150,
    size: 16,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  page.drawText('Test contents:', {
    x: 50,
    y: height - 200,
    size: 14,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  page.drawText('• Multiple pages', {
    x: 70,
    y: height - 230,
    size: 12,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  page.drawText('• Mixed content types', {
    x: 70,
    y: height - 250,
    size: 12,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  const pdfBytes = await pdfDoc.save();
  const testPath = path.join(__dirname, 'test-simple.pdf');
  fs.writeFileSync(testPath, pdfBytes);
  console.log('测试PDF已创建:', testPath);
  return testPath;
}

createTestPDF().catch(console.error);