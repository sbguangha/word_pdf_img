console.log('Testing server startup...');

try {
  console.log('Loading dependencies...');
  const express = require('express');
  console.log('✓ Express loaded');
  
  const multer = require('multer');
  console.log('✓ Multer loaded');
  
  const cors = require('cors');
  console.log('✓ CORS loaded');
  
  const sharp = require('sharp');
  console.log('✓ Sharp loaded');
  
  const { PDFDocument } = require('pdf-lib');
  console.log('✓ PDF-lib loaded');
  
  const canvas = require('canvas');
  console.log('✓ Canvas loaded');
  
  console.log('All dependencies loaded successfully!');
  
  // 尝试启动简单服务器
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  app.get('/', (req, res) => {
    res.json({ message: 'Test server is working!' });
  });
  
  const server = app.listen(3002, () => {
    console.log('Test server started on port 3002');
  });
  
  // 5秒后关闭
  setTimeout(() => {
    console.log('Closing test server...');
    server.close(() => {
      console.log('Test server closed');
      process.exit(0);
    });
  }, 5000);
  
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
