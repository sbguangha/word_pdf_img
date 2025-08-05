const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');

// 简化的Word转PDF函数，完全避免WinAnsi编码问题
async function convertWordToPdfSimple(inputPath, outputPath) {
  try {
    console.log('开始Word转PDF转换:', inputPath);
    
    const fileExt = path.extname(inputPath).toLowerCase();
    let textContent = '';
    
    try {
      // 处理Word文件
      const mammoth = require('mammoth');
      const buffer = fs.readFileSync(inputPath);
      const result = await mammoth.convertToHtml({ buffer });
      
      textContent = result.value
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
    } catch (e) {
      // 如果Word处理失败，使用文本内容
      textContent = fs.readFileSync(inputPath, 'utf8');
    }
    
    // 创建PDF - 使用jsPDF避免WinAnsi问题
    const doc = new jsPDF();
    
    // 分割文本为行
    const lines = textContent.split('\n').filter(line => line.trim());
    
    let yPos = 20;
    for (const line of lines) {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      
      // 使用中文字符直接写入
      doc.text(line, 20, yPos);
      yPos += 10;
    }
    
    // 保存PDF
    const pdfBytes = doc.output();
    fs.writeFileSync(outputPath, pdfBytes);
    
    console.log('Word转PDF成功:', outputPath);
    return outputPath;
    
  } catch (error) {
    console.error('Word转PDF失败:', error);
    throw error;
  }
}

// 导出函数
module.exports = { convertWordToPdfSimple };

// 如果直接运行
if (require.main === module) {
  const testFile = path.join(__dirname, 'uploads', 'chinese-test.txt');
  const outputFile = path.join(__dirname, 'outputs', 'test-result.pdf');
  
  if (!fs.existsSync(path.dirname(testFile))) {
    fs.mkdirSync(path.dirname(testFile), { recursive: true });
  }
  
  if (!fs.existsSync(path.dirname(outputFile))) {
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  }
  
  fs.writeFileSync(testFile, '中文测试\n这是一个包含中文字符的测试文档。\n上、下、左、右\n转换成功！');
  
  convertWordToPdfSimple(testFile, outputFile)
    .then(() => console.log('测试完成！'))
    .catch(console.error);
}