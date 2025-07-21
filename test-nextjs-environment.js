// Next.js环境完整测试脚本
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Next.js环境完整测试开始...\n');

// 测试配置
const tests = [
  {
    name: '依赖检查',
    test: checkDependencies
  },
  {
    name: '配置文件检查',
    test: checkConfigFiles
  },
  {
    name: '构建测试',
    test: testBuild
  },
  {
    name: '开发服务器测试',
    test: testDevServer
  },
  {
    name: '生产服务器测试',
    test: testProdServer
  }
];

// 运行所有测试
async function runAllTests() {
  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    console.log(`\n📋 测试: ${test.name}`);
    console.log('─'.repeat(50));
    
    try {
      const result = await test.test();
      if (result) {
        console.log(`✅ ${test.name} - 通过`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name} - 失败`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - 错误: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 测试结果: ${passedTests}/${totalTests} 通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！Next.js环境完全正常！');
  } else {
    console.log('⚠️  部分测试失败，需要进一步检查');
  }
}

// 1. 检查依赖
async function checkDependencies() {
  console.log('检查package.json和node_modules...');
  
  // 检查package.json
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json不存在');
  }
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✓ package.json存在，项目名: ${packageJson.name}`);
  
  // 检查node_modules
  if (!fs.existsSync('node_modules')) {
    throw new Error('node_modules不存在，请运行npm install');
  }
  console.log('✓ node_modules存在');
  
  // 检查关键依赖
  const keyDeps = ['next', 'react', 'react-dom', 'tailwindcss'];
  for (const dep of keyDeps) {
    if (!fs.existsSync(path.join('node_modules', dep))) {
      throw new Error(`关键依赖${dep}缺失`);
    }
    console.log(`✓ ${dep}已安装`);
  }
  
  return true;
}

// 2. 检查配置文件
async function checkConfigFiles() {
  console.log('检查配置文件...');
  
  const configFiles = [
    { file: 'next.config.ts', required: true },
    { file: 'tsconfig.json', required: true },
    { file: 'tailwind.config.js', required: true },
    { file: 'postcss.config.js', required: true },
    { file: 'src/app/layout.tsx', required: true },
    { file: 'src/app/page.tsx', required: true },
    { file: 'src/app/globals.css', required: true }
  ];
  
  for (const config of configFiles) {
    if (config.required && !fs.existsSync(config.file)) {
      throw new Error(`必需的配置文件${config.file}不存在`);
    }
    if (fs.existsSync(config.file)) {
      console.log(`✓ ${config.file}存在`);
    }
  }
  
  return true;
}

// 3. 测试构建
async function testBuild() {
  console.log('测试构建过程...');
  
  return new Promise((resolve, reject) => {
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let errorOutput = '';
    
    buildProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    buildProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✓ 构建成功完成');
        
        // 检查构建输出
        if (fs.existsSync('.next')) {
          console.log('✓ .next目录已生成');
          resolve(true);
        } else {
          reject(new Error('构建完成但.next目录不存在'));
        }
      } else {
        console.log('构建输出:', output);
        console.log('错误输出:', errorOutput);
        reject(new Error(`构建失败，退出代码: ${code}`));
      }
    });
    
    // 设置超时
    setTimeout(() => {
      buildProcess.kill();
      reject(new Error('构建超时'));
    }, 120000); // 2分钟超时
  });
}

// 4. 测试开发服务器
async function testDevServer() {
  console.log('测试开发服务器...');
  
  return new Promise((resolve, reject) => {
    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let serverReady = false;
    
    devProcess.stdout.on('data', (data) => {
      output += data.toString();
      
      // 检查服务器是否就绪
      if (output.includes('Ready in') && output.includes('localhost:3000')) {
        serverReady = true;
        console.log('✓ 开发服务器启动成功');
        
        // 等待一秒后关闭服务器
        setTimeout(() => {
          devProcess.kill();
          resolve(true);
        }, 1000);
      }
    });
    
    devProcess.stderr.on('data', (data) => {
      const errorData = data.toString();
      if (errorData.includes('Error') || errorData.includes('Failed')) {
        console.log('开发服务器错误:', errorData);
        devProcess.kill();
        reject(new Error('开发服务器启动失败'));
      }
    });
    
    devProcess.on('close', (code) => {
      if (serverReady) {
        resolve(true);
      } else {
        reject(new Error(`开发服务器异常退出，代码: ${code}`));
      }
    });
    
    // 设置超时
    setTimeout(() => {
      if (!serverReady) {
        devProcess.kill();
        reject(new Error('开发服务器启动超时'));
      }
    }, 30000); // 30秒超时
  });
}

// 5. 测试生产服务器
async function testProdServer() {
  console.log('测试生产服务器...');
  
  // 确保有构建文件
  if (!fs.existsSync('.next')) {
    throw new Error('没有构建文件，请先运行构建测试');
  }
  
  return new Promise((resolve, reject) => {
    const prodProcess = spawn('npm', ['start'], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let serverReady = false;
    
    prodProcess.stdout.on('data', (data) => {
      output += data.toString();
      
      // 检查服务器是否就绪
      if (output.includes('Ready in') && output.includes('localhost:3000')) {
        serverReady = true;
        console.log('✓ 生产服务器启动成功');
        
        // 等待一秒后关闭服务器
        setTimeout(() => {
          prodProcess.kill();
          resolve(true);
        }, 1000);
      }
    });
    
    prodProcess.stderr.on('data', (data) => {
      const errorData = data.toString();
      if (errorData.includes('Error') || errorData.includes('Failed')) {
        console.log('生产服务器错误:', errorData);
        prodProcess.kill();
        reject(new Error('生产服务器启动失败'));
      }
    });
    
    prodProcess.on('close', (code) => {
      if (serverReady) {
        resolve(true);
      } else {
        reject(new Error(`生产服务器异常退出，代码: ${code}`));
      }
    });
    
    // 设置超时
    setTimeout(() => {
      if (!serverReady) {
        prodProcess.kill();
        reject(new Error('生产服务器启动超时'));
      }
    }, 15000); // 15秒超时
  });
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
