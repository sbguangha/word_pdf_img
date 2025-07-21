// 测试增强版PDF转图片功能
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🧪 测试增强版PDF转图片功能...\n');

// 简单的HTTP请求函数
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: data,
            json: () => JSON.parse(data)
          };
          resolve(result);
        } catch (error) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: data,
            json: () => { throw new Error('Invalid JSON'); }
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// 测试配置
const serverUrl = 'http://localhost:3001';
const testCases = [
  {
    name: '基础JPG转换 - 高质量',
    options: {
      format: 'jpg',
      quality: 'high',
      pages: 'first',
      compression: 85
    }
  },
  {
    name: 'PNG格式转换 - 中等质量',
    options: {
      format: 'png',
      quality: 'medium',
      pages: 'first',
      compression: 85
    }
  },
  {
    name: '多页转换 - 所有页面',
    options: {
      format: 'jpg',
      quality: 'high',
      pages: 'all',
      compression: 90
    }
  },
  {
    name: '超高质量转换',
    options: {
      format: 'jpg',
      quality: 'ultra',
      pages: 'first',
      compression: 95
    }
  },
  {
    name: '低质量快速转换',
    options: {
      format: 'jpg',
      quality: 'low',
      pages: 'first',
      compression: 70
    }
  }
];

// 运行所有测试
async function runAllTests() {
  console.log('📋 检查服务器状态...');
  
  try {
    const response = await makeRequest(serverUrl);
    if (!response.ok) {
      throw new Error('服务器响应异常');
    }
    console.log('✅ 服务器连接正常\n');
  } catch (error) {
    console.error('❌ 无法连接到服务器:', error.message);
    console.log('请确保服务器正在运行: node server/index.js');
    return;
  }

  // 检查是否有测试PDF文件
  const uploadsDir = path.join(__dirname, 'server/uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.log('❌ uploads目录不存在');
    return;
  }

  const pdfFiles = fs.readdirSync(uploadsDir).filter(file => file.toLowerCase().endsWith('.pdf'));
  if (pdfFiles.length === 0) {
    console.log('❌ 没有找到测试PDF文件');
    console.log('请先上传一个PDF文件到 server/uploads/ 目录');
    return;
  }

  const testFile = pdfFiles[0];
  console.log(`📄 使用测试文件: ${testFile}\n`);

  let passedTests = 0;
  let totalTests = testCases.length;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`🔬 测试 ${i + 1}/${totalTests}: ${testCase.name}`);
    console.log('─'.repeat(60));

    try {
      const result = await testConversion(testFile, testCase.options);
      if (result.success) {
        console.log(`✅ 测试通过`);
        console.log(`   输出文件: ${result.filename}`);
        console.log(`   转换信息: ${result.info.type}, ${result.info.pages}页, ${result.info.format}格式`);
        passedTests++;
      } else {
        console.log(`❌ 测试失败: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ 测试异常: ${error.message}`);
    }
    
    console.log(''); // 空行分隔
  }

  console.log('='.repeat(60));
  console.log(`📊 测试结果: ${passedTests}/${totalTests} 通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！增强版PDF转图片功能完全正常！');
  } else {
    console.log('⚠️  部分测试失败，需要进一步检查');
  }
}

// 测试单个转换
async function testConversion(filename, options) {
  try {
    // 调用转换API
    const convertResponse = await makeRequest(`${serverUrl}/api/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: filename,
        targetFormat: options.format,
        quality: options.quality,
        pages: options.pages,
        compression: options.compression
      })
    });

    if (!convertResponse.ok) {
      const errorData = convertResponse.json();
      return {
        success: false,
        error: errorData.error || '转换失败'
      };
    }

    const result = convertResponse.json();
    
    // 检查输出文件是否存在
    const outputPath = path.join(__dirname, 'server/outputs', result.outputFilename);
    if (!fs.existsSync(outputPath)) {
      return {
        success: false,
        error: '输出文件不存在'
      };
    }

    // 检查文件大小
    const stats = fs.statSync(outputPath);
    if (stats.size === 0) {
      return {
        success: false,
        error: '输出文件为空'
      };
    }

    return {
      success: true,
      filename: result.outputFilename,
      info: result.conversionInfo,
      fileSize: stats.size
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 功能演示
async function demonstrateFeatures() {
  console.log('🎯 增强版PDF转图片功能演示\n');
  
  console.log('📋 新增功能:');
  console.log('1. ✅ 多种输出格式: JPG, PNG, TIFF');
  console.log('2. ✅ 质量选择: 低(150DPI), 中(200DPI), 高(300DPI), 超高(600DPI)');
  console.log('3. ✅ 页面选择: 第一页, 所有页面, 自定义页面');
  console.log('4. ✅ 压缩控制: 1-100% 质量调节');
  console.log('5. ✅ 多页ZIP: 自动打包多页转换结果');
  console.log('6. ✅ 详细信息: 转换类型、页数、格式等信息');
  console.log('7. ✅ 备用方案: Canvas预览图（当pdf2pic失败时）');
  console.log('');

  console.log('🔧 API增强:');
  console.log('- 新增quality参数: low|medium|high|ultra');
  console.log('- 新增pages参数: first|all|[1,2,3]');
  console.log('- 新增compression参数: 1-100');
  console.log('- 增强响应信息: conversionInfo对象');
  console.log('');

  console.log('🎨 前端改进:');
  console.log('- 增强版测试页面: pdf-enhanced.html');
  console.log('- 直观的选项界面');
  console.log('- 实时进度显示');
  console.log('- 详细的转换结果信息');
  console.log('');
}

// 运行演示和测试
if (require.main === module) {
  demonstrateFeatures();
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testConversion };
