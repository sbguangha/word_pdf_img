// 检查LibreOffice安装状态
const { execSync } = require('child_process');
const os = require('os');

function checkLibreOffice() {
  const platform = os.platform();
  console.log('平台:', platform);
  
  let command;
  if (platform === 'win32') {
    // Windows: 检查常见安装路径
    const fs = require('fs');
    const path = require('path');
    
    const possiblePaths = [
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
    ];
    
    for (const librePath of possiblePaths) {
      if (fs.existsSync(librePath)) {
        console.log('✅ LibreOffice Windows版本已安装:', librePath);
        return librePath;
      }
    }
    
    console.log('❌ LibreOffice未在常见Windows路径找到');
    return null;
    
  } else if (platform === 'linux') {
    command = 'which libreoffice';
  } else if (platform === 'darwin') {
    command = 'which libreoffice';
  } else {
    console.log('❌ 不支持的平台:', platform);
    return null;
  }
  
  try {
    const result = execSync(command, { encoding: 'utf8' });
    const path = result.trim();
    console.log('✅ LibreOffice已安装:', path);
    return path;
  } catch (error) {
    console.log('❌ LibreOffice未安装或不在PATH中');
    return null;
  }
}

// 测试运行
checkLibreOffice();