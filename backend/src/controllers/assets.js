const express = require('express');
const router = express.Router();
const uploadConfig = require('../middlewares/upload');
const { optimizeImage } = require('../middlewares/optimizer');

// 统一的图片资产上传入口
// POST /api/upload
// body: { projectId: 'project_A', side: 'front', layerType: 'cloud' } + file
router.post('/upload', 
  uploadConfig.single('asset'), // Multer 接收文件并改名存盘
  optimizeImage,                // Sharp 接管并转码 webp，删除原图
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // 拼接可在前端访问的静态服链接 (带破缓存戳)
    // 实际生产环境这里应该是发往 OSS 的链接
    const assetUrl = `/uploads/${req.body.projectId}/${req.file.filename}?v=${req.file.versionHash}`;
    
    res.json({
      message: 'Asset uploaded & optimized successfully',
      url: assetUrl,
      thumbUrl: `/uploads/${req.body.projectId}/${req.file.filename.replace('.webp', '_min.webp')}?v=${req.file.versionHash}`
    });
  }
);

module.exports = router;
