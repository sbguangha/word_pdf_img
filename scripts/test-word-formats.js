// 测试Word格式识别和转换
const fs = require('fs');
const path = require('path');

// 测试函数
const convertWordToPdf = require('../server/index.js').convertWordToPdf;

async function testWordFormats() {
  console.log('=== Word格式测试 ===\n');
  
  // 测试文件路径
  const testDir = path.join(__dirname, '..', 'server', 'uploads');
  const testDocx = path.join(testDir, 'test.docx');
  const testDoc = path.join(testDir, 'test.doc');
  
  // 创建测试内容
  const testContent = `中文Word测试文档

这是一个测试Word转PDF功能的中文内容。

测试内容：
1. 中文标题
2. 中文段落
3. 中英文混排：Hello 世界！

测试完成！
`;
  
  // 创建测试文件
  try {
    // .docx测试文件
    if (!fs.existsSync(testDocx)) {
      fs.writeFileSync(testDocx, testContent, 'utf8');
      console.log('✅ 创建测试.docx文件');
    }
    
    // .doc测试文件
    if (!fs.existsSync(testDoc)) {
      fs.writeFileSync(testDoc, testContent, 'utf8');
      console.log('✅ 创建测试.doc文件');
    }
    
    console.log('\n=== 开始测试 ===');
    
    // 测试.docx
    try {
      const outputDocx = path.join(__dirname, '..', 'server', 'outputs', 'test-docx-output.pdf');
      await convertWordToPdf(testDocx, outputDocx);
      console.log('✅ .docx转PDF成功');
    } catch (error) {
      console.log('❌ .docx转PDF失败:', error.message);
    }
    
    // 测试.doc
    try {
      const outputDoc = path.join(__dirname, '..', 'server', 'outputs', 'test-doc-output.pdf');
      await convertWordToPdf(testDoc, outputDoc);
      console.log('✅ .doc转PDF成功');
    } catch (error) {
      console.log('❌ .doc转PDF失败:', error.message);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testWordFormats();