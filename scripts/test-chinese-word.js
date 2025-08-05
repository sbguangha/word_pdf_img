// 测试中文Word转PDF功能
const fs = require('fs');
const path = require('path');

// 创建测试用的中文Word文档（使用HTML模拟）
const testContent = `
中文测试文档

这是一个测试中文支持的Word转PDF功能。

测试内容：
1. 中文标题
2. 中文段落
3. 中英文混排：Hello 世界！
4. 特殊字符：！@#¥%……&*（）

中文段落示例：
在数字化时代，人工智能、云计算、大数据等技术正在深刻改变我们的生活方式。
这些技术不仅提高了生产效率，也为人们带来了前所未有的便利。

测试完成！
`;

// 保存为测试文件
const testFile = path.join(__dirname, '..', 'server', 'uploads', 'test-chinese.txt');
fs.writeFileSync(testFile, testContent, 'utf8');

console.log('创建测试文件:', testFile);

// 测试Word转PDF
const convertWordToPdf = require('../server/index.js').convertWordToPdf;

async function test() {
  try {
    const outputPath = path.join(__dirname, '..', 'server', 'outputs', 'test-chinese-output.pdf');
    await convertWordToPdf(testFile, outputPath);
    console.log('✅ 中文Word转PDF测试成功！');
    console.log('输出文件:', outputPath);
  } catch (error) {
    console.error('❌ 中文Word转PDF测试失败:', error.message);
  }
}

test();