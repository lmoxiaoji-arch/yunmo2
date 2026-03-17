const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 注册业务路由
const assetRoutes = require('./controllers/assets');
const projectRoutes = require('./controllers/projects');
const authRoutes = require('./controllers/auth');

app.use('/api/assets', assetRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`B-End API Server is running on http://localhost:${PORT}`);
});
