console.log('Testing Express...');

try {
  const express = require('express');
  console.log('Express loaded successfully');
  
  const app = express();
  console.log('Express app created');
  
  app.get('/', (req, res) => {
    res.send('Hello World!');
  });
  
  const server = app.listen(3001, () => {
    console.log('Server started on port 3001');
  });
  
  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
  
} catch (error) {
  console.error('Error:', error);
}
