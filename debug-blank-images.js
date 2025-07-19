// 调试空白图片问题
const fs = require('fs');
const path = require('path');

async function debugBlankImages() {
  try {
    console.log('=== 调试空白图片问题 ===');
    
    // 检查最新生成的ZIP文件
    const outputsDir = path.join(__dirname, 'server/outputs');
    const files = fs.readdirSync(outputsDir);
    const zipFiles = files.filter(f => f.endsWith('.zip')).sort();
    
    if (zipFiles.length === 0) {
      console.log('❌ 没有找到ZIP文件');
      return;
    }
    
    const latestZip = zipFiles[zipFiles.length - 1];
    const zipPath = path.join(outputsDir, latestZip);
    
    console.log(`📦 检查ZIP文件: ${latestZip}`);
    console.log(`📊 ZIP文件大小: ${(fs.statSync(zipPath).size / 1024).toFixed(2)} KB`);
    
    // 解压ZIP文件检查内容
    const JSZip = require('jszip');
    const zipBuffer = fs.readFileSync(zipPath);
    const zip = await JSZip.loadAsync(zipBuffer);
    
    console.log('\n📋 ZIP文件内容:');
    for (const filename in zip.files) {
      const file = zip.files[filename];
      if (!file.dir) {
        console.log(`  - ${filename}: ${(file._data.uncompressedSize / 1024).toFixed(2)} KB`);
        
        // 如果是图片文件，提取并检查
        if (filename.endsWith('.jpg')) {
          const imageBuffer = await file.async('nodebuffer');
          const tempImagePath = path.join(__dirname, `temp-${filename}`);
          fs.writeFileSync(tempImagePath, imageBuffer);
          
          const stats = fs.statSync(tempImagePath);
          console.log(`    → 提取到: ${tempImagePath} (${(stats.size / 1024).toFixed(2)} KB)`);
          
          // 使用sharp检查图片信息
          try {
            const sharp = require('sharp');
            const metadata = await sharp(tempImagePath).metadata();
            console.log(`    → 图片信息: ${metadata.width}x${metadata.height}, ${metadata.format}, ${metadata.channels}通道`);
            
            // 检查图片是否为纯色（空白）
            const { data, info } = await sharp(tempImagePath)
              .raw()
              .toBuffer({ resolveWithObject: true });
            
            // 检查前100个像素是否都是相同的
            let isBlank = true;
            const firstPixel = [data[0], data[1], data[2]];
            for (let i = 0; i < Math.min(300, data.length); i += 3) {
              if (data[i] !== firstPixel[0] || data[i+1] !== firstPixel[1] || data[i+2] !== firstPixel[2]) {
                isBlank = false;
                break;
              }
            }
            
            if (isBlank) {
              console.log(`    ⚠️ 图片疑似空白 (前100像素都是 RGB(${firstPixel.join(',')}))`);
            } else {
              console.log(`    ✅ 图片包含内容`);
            }
            
          } catch (sharpError) {
            console.log(`    ❌ 无法分析图片: ${sharpError.message}`);
          }
        }
      }
    }
    
    // 检查转换信息
    if (zip.files['conversion-info.txt']) {
      const infoContent = await zip.files['conversion-info.txt'].async('string');
      console.log('\n📄 转换信息:');
      console.log(infoContent);
    }
    
    console.log('\n🔍 问题分析:');
    console.log('1. 如果图片文件很小(< 10KB)且疑似空白，说明PDF.js渲染失败');
    console.log('2. PDF.js在Node.js环境下可能无法正确处理某些PDF元素');
    console.log('3. 需要使用更可靠的PDF渲染方案');
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugBlankImages();
