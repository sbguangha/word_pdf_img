const fs = require('fs');
const path = require('path');

// 创建一个简单的Word测试文件
const testContent = `这是一个测试Word文档

格式测试：
- 标题1
- 标题2
- 列表项目

这是用于测试Word转PDF功能的示例文档。

测试内容：
1. 文本内容
2. 格式测试
3. 转换验证

结束。
`;

// 创建临时目录
const tempDir = path.join(__dirname, 'temp-test');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// 创建一个简单的文本文件作为Word测试文件
const testFilePath = path.join(tempDir, 'test-document.txt');
fs.writeFileSync(testFilePath, testContent);

console.log('测试文件已创建：', testFilePath);
console.log('文件大小：', fs.statSync(testFilePath).size, '字节');

// 测试Word转PDF API
const axios = require('axios');
const FormData = require('form-data');
const formData = new FormData();
formData.append('file', fs.createReadStream(testFilePath));

axios.post('http://localhost:3001/api/upload', formData, {
  headers: formData.getHeaders()
}).then(response => {
  console.log('上传成功：', response.data);
  
  return axios.post('http://localhost:3001/api/convert', {
    filename: response.data.filename,
    targetFormat: 'pdf'
  });
}).then(response => {
  console.log('转换成功：', response.data);
  console.log('下载链接：http://localhost:3001' + response.data.downloadUrl);
}).catch(error => {
  console.error('测试失败：', error.response?.data || error.message);
});