const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('=== 中文Word转PDF测试 ===');

// 创建测试目录
const testDir = path.join(__dirname, 'server', 'uploads');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// 创建测试文件
const testFilePath = path.join(testDir, 'chinese-test.docx');
const testContent = '中文测试文档 - 你好世界！这是测试内容。';
fs.writeFileSync(testFilePath, testContent);

console.log('测试文件已创建:', testFilePath);

// 测试API
const postData = JSON.stringify({
  filename: 'chinese-test.docx',
  targetFormat: 'pdf'
});

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/convert',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('测试结果:', response.message || response.error);
      if (response.message === '转换成功') {
        console.log('✅ 中文Word转PDF测试成功！');
        console.log('📁 输出文件名:', response.outputFilename);
        console.log('⬇️  下载链接: http://localhost:3001' + response.downloadUrl);
      } else {
        console.log('❌ 转换失败:', response.error);
      }
    } catch (e) {
      console.log('响应:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('测试失败:', error.message);
});

req.write(postData);
req.end();