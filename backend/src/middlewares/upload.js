const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { projectId } = req.body; // 从请求体中获取当前项目 ID
    if (!projectId) {
      return cb(new Error('Missing projectId in upload request.'));
    }
    
    // 按项目 ID 隔离上传文件夹
    const dir = path.join(__dirname, '../../uploads', projectId);
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // 强制重命名逻辑 (从 req.body 中获取指定的面和图层类型，例如 side: 'front', type: 'base')
    const { side, layerType } = req.body;
    if (!side || !layerType) {
      return cb(new Error('Missing relative position arguments (side, layerType).'));
    }
    
    // 强制重命名格式: {side}_{layerType}.[ext] -> 例如: front_base.webp (后缀由 sharp 中间件最后决定，此处暂存原后缀)
    const ext = path.extname(file.originalname).toLowerCase();
    const finalName = `${side}_${layerType}${ext}`;
    
    cb(null, finalName);
  }
});

// 文件过滤器：只接受图片
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const uploadConfig = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制 10MB
  }
});

module.exports = uploadConfig;
