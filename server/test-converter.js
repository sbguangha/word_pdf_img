const fs = require('fs');
const path = require('path');
const EnhancedPDFConverter = require('./enhanced-pdf-converter');
const MultiStrategyConverter = require('./multi-strategy-converter');
const { ConversionProgress } = require('./conversion-progress');

/**
 * PDF转换测试套件
 * 验证所有策略是否正常工作
 */

class PDFTestSuite {
  constructor() {
    this.converter = new MultiStrategyConverter();
    this.progress = new ConversionProgress();
    this.testDir = path.join(__dirname, '../test-files');
    this.outputDir = path.join(__dirname, '../test-outputs');
    
    this.setupTestEnvironment();
    this.setupProgressListeners();
  }

  setupTestEnvironment() {
    if (!fs.existsSync(this.testDir)) {
      fs.mkdirSync(this.testDir, { recursive: true });
    }
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  setupProgressListeners() {
    this.progress.on('conversion:start', (data) => {
      console.log(`🚀 开始转换: ${data.fileName} (${data.totalPages}页)`);
    });

    this.progress.on('conversion:progress', (data) => {
      console.log(`📊 进度: ${data.percentage}% (${data.currentPage}/${data.totalPages}) 策略: ${data.strategy}`);
    });

    this.progress.on('conversion:complete', (data) => {
      console.log(`✅ 完成: ${data.fileName} (${data.pages}页, ${Math.round(data.duration/1000)}s)`);
    });

    this.progress.on('conversion:error', (data) => {
      console.log(`❌ 失败: ${data.fileName} - ${data.error}`);
    });
  }

  async runAllTests() {
    console.log('🧪 开始PDF转换测试套件...\n');

    const testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };

    const tests = [
      {
        name: 'Ghostscript直接转换',
        test: () => this.testGhostscriptDirect()
      },
      {
        name: '多重策略验证',
        test: () => this.testMultiStrategy()
      },
      {
        name: '中文PDF处理',
        test: () => this.testChinesePDF()
      },
      {
        name: '大文件处理',
        test: () => this.testLargeFile()
      }
    ];

    for (const test of tests) {
      console.log(`\n📋 运行: ${test.name}`);
      testResults.total++;
      
      try {
        const result = await test.test();
        if (result.success) {
          testResults.passed++;
          console.log(`   ✅ ${test.name} 通过`);
        } else {
          testResults.failed++;
          console.log(`   ❌ ${test.name} 失败: ${result.error}`);
        }
        testResults.details.push(result);
      } catch (error) {
        testResults.failed++;
        console.log(`   ❌ ${test.name} 异常: ${error.message}`);
        testResults.details.push({ success: false, error: error.message });
      }
    }

    this.printSummary(testResults);
    return testResults;
  }

  async testGhostscriptDirect() {
    try {
      // 创建一个简单的测试PDF
      const testPdfPath = path.join(this.testDir, 'test-simple.pdf');
      if (!fs.existsSync(testPdfPath)) {
        return { success: false, error: '测试PDF文件不存在' };
      }

      const outputDir = path.join(this.outputDir, 'ghostscript-test');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const converter = new EnhancedPDFConverter();
      const conversionId = 'test-ghostscript-' + Date.now();
      
      this.progress.startConversion(conversionId, 'test-simple.pdf', 1);
      
      const result = await converter.convertPdfToImages(
        testPdfPath,
        outputDir,
        { format: 'jpg', quality: 'medium' }
      );

      this.progress.completeConversion(conversionId, result);

      return {
        success: true,
        files: result,
        note: 'Ghostscript直接转换成功'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testMultiStrategy() {
    try {
      const testPdfPath = path.join(this.testDir, 'test-multi-page.pdf');
      if (!fs.existsSync(testPdfPath)) {
        return { success: false, error: '多页测试PDF文件不存在' };
      }

      const outputDir = path.join(this.outputDir, 'multi-strategy-test');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const conversionId = 'test-multi-strategy-' + Date.now();
      
      this.progress.startConversion(conversionId, 'test-multi-page.pdf', 3);
      
      const result = await this.converter.convertWithFallback(
        testPdfPath,
        outputDir,
        { format: 'jpg', quality: 'high', pages: 'all' }
      );

      this.progress.completeConversion(conversionId, result);

      return {
        success: true,
        strategy: result.strategyUsed,
        pages: result.files.length,
        note: `使用策略: ${result.strategyUsed}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testChinesePDF() {
    try {
      const testPdfPath = path.join(this.testDir, 'test-chinese.pdf');
      if (!fs.existsSync(testPdfPath)) {
        return { success: false, error: '中文测试PDF文件不存在' };
      }

      const outputDir = path.join(this.outputDir, 'chinese-test');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const conversionId = 'test-chinese-' + Date.now();
      
      this.progress.startConversion(conversionId, 'test-chinese.pdf', 1);
      
      const result = await this.converter.convertWithFallback(
        testPdfPath,
        outputDir,
        { format: 'jpg', quality: 'high' }
      );

      this.progress.completeConversion(conversionId, result);

      return {
        success: true,
        strategy: result.strategyUsed,
        note: '中文PDF处理成功'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testLargeFile() {
    try {
      const testPdfPath = path.join(this.testDir, 'test-large.pdf');
      if (!fs.existsSync(testPdfPath)) {
        return { success: false, error: '大文件测试PDF不存在' };
      }

      const fileSize = fs.statSync(testPdfPath).size;
      const mbSize = Math.round(fileSize / 1024 / 1024);

      console.log(`   📊 文件大小: ${mbSize}MB`);

      const outputDir = path.join(this.outputDir, 'large-file-test');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const conversionId = 'test-large-' + Date.now();
      
      this.progress.startConversion(conversionId, 'test-large.pdf', 5);
      
      const startTime = Date.now();
      const result = await this.converter.convertWithFallback(
        testPdfPath,
        outputDir,
        { format: 'jpg', quality: 'medium' }
      );
      
      const duration = Date.now() - startTime;

      this.progress.completeConversion(conversionId, {
        ...result,
        duration
      });

      return {
        success: true,
        strategy: result.strategyUsed,
        duration: Math.round(duration / 1000),
        note: `大文件处理完成 (${mbSize}MB, ${Math.round(duration/1000)}s)`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  printSummary(results) {
    console.log('\n' + '=' * 50);
    console.log('🎯 测试结果汇总');
    console.log('=' * 50);
    console.log(`总测试数: ${results.total}`);
    console.log(`通过: ${results.passed}`);
    console.log(`失败: ${results.failed}`);
    console.log(`成功率: ${Math.round((results.passed / results.total) * 100)}%`);
    
    console.log('\n📊 详细结果:');
    results.details.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.note || result.error}`);
    });
  }

  async createDemoFiles() {
    console.log('📄 创建演示文件...');
    
    // 创建简单的测试PDF文件（使用现有文件或提示用户）
    const demoContent = {
      simple: '简单PDF测试',
      chinese: '中文PDF测试',
      multi: '多页PDF测试',
      large: '大文件PDF测试'
    };

    Object.entries(demoContent).forEach(([key, name]) => {
      const filePath = path.join(this.testDir, `test-${key}.pdf`);
      if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️ 请将测试PDF文件放在: ${filePath}`);
      }
    });
  }
}

// 运行测试
if (require.main === module) {
  const suite = new PDFTestSuite();
  
  suite.createDemoFiles();
  suite.runAllTests().then(results => {
    if (results.failed === 0) {
      console.log('\n🎉 所有测试通过！PDF转换功能已修复');
    } else {
      console.log('\n⚠️ 部分测试失败，请检查错误信息');
    }
  }).catch(console.error);
}

module.exports = PDFTestSuite;