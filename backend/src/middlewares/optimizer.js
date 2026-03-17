const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// ── 常量定义 ─────────────────────────────────────────
const WEBP_QUALITY_FULL = 80;
const WEBP_QUALITY_THUMB = 60;
const THUMB_WIDTH = 500;

// ── Pipeline 单元 (SRP: 每个函数只做一件事) ────────────

/**
 * 将源图转换为 WebP 格式 (保留原始尺寸)
 * @returns {string} 输出文件路径
 */
async function generateWebP(sourcePath, outputDir, baseName) {
  const outputPath = path.join(outputDir, `${baseName}.webp`);
  await sharp(sourcePath)
    .webp({ quality: WEBP_QUALITY_FULL })
    .toFile(outputPath);
  return outputPath;
}

/**
 * 生成缩略图 WebP (压制宽度)
 * @returns {string} 输出文件路径
 */
async function generateThumbnail(sourcePath, outputDir, baseName) {
  const outputPath = path.join(outputDir, `${baseName}_min.webp`);
  await sharp(sourcePath)
    .resize({ width: THUMB_WIDTH })
    .webp({ quality: WEBP_QUALITY_THUMB })
    .toFile(outputPath);
  return outputPath;
}

/**
 * 安全删除源文件 (仅当源文件与目标不同时删除)
 */
function removeOriginal(sourcePath, finalPath) {
  if (sourcePath !== finalPath && fs.existsSync(sourcePath)) {
    fs.unlinkSync(sourcePath);
  }
}

// ── 中间件编排器 (Orchestrator) ─────────────────────
const optimizeImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const sourcePath = req.file.path;
    const parsedPath = path.parse(sourcePath);
    const baseName = parsedPath.name;
    const outputDir = parsedPath.dir;

    // 执行 Pipeline
    const finalPath = await generateWebP(sourcePath, outputDir, baseName);
    await generateThumbnail(sourcePath, outputDir, baseName);
    removeOriginal(sourcePath, finalPath);

    // 更新 req.file 元数据供下游路由使用
    const finalName = `${baseName}.webp`;
    req.file.path = finalPath;
    req.file.filename = finalName;
    req.file.mimetype = 'image/webp';
    req.file.versionHash = Date.now().toString(36);

    next();
  } catch (error) {
    console.error('Image optimization pipeline error:', error);
    next(error);
  }
};

module.exports = { optimizeImage, generateWebP, generateThumbnail };
