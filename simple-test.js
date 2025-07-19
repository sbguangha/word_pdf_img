// 简单测试PDF.js导入
async function testImport() {
  try {
    console.log('测试PDF.js导入...');
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    console.log('✅ PDF.js导入成功');
    console.log('getDocument函数:', typeof pdfjsLib.getDocument);
  } catch (error) {
    console.error('❌ 导入失败:', error.message);
  }
}

testImport();
