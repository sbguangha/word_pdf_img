const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 测试路由
app.get('/', (req, res) => {
  res.json({ message: '服务器运行正常' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API测试成功' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
