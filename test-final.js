const fs = require('fs');
const path = require('path');
const http = require('http');

async function testChineseWordToPdf() {
  console.log('=== 最终中文Word转PDF测试 ===');
  
  // 创建测试目录
  const uploadsDir = path.join(__dirname, 'server', 'uploads');
  const outputsDir = path.join(__dirname, 'server', 'outputs');
  
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });
  
  // 创建中文测试文件
  const testFilePath = path.join(uploadsDir, 'chinese-word-test.txt');
  const testContent = '中文Word转PDF测试\n\n你好，世界！\n\n这是包含中文字符的测试文档：\n- 上、下、左、右\n- 中文支持\n- Unicode字符\n\n测试完成！';
  fs.writeFileSync(testFilePath, testContent);
  
  console.log('✅ 测试文件已创建');
  
  // 测试上传
  const formData = new FormData();
  const buffer = fs.readFileSync(testFilePath);
  
  // 直接测试API
  const testData = {
    filename: 'chinese-word-test.txt',
    targetFormat: 'pdf'
  };
  
  const postData = JSON.stringify(testData);
  
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
        if (response.message === '转换成功') {
          console.log('🎉 中文Word转PDF成功！');
          console.log('📁 输出文件:', response.outputFilename);
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
    console.error('连接错误:', error.message);
  });
  
  req.write(postData);
  req.end();
}

testChineseWordToPdf();