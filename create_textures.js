const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'frontend', 'public', 'project_A', 'v1');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// 写入空图片作为占位贴图 (也可以放真实图片)
fs.writeFileSync(path.join(targetDir, 'front_base.png'), 'dummy image data');
fs.writeFileSync(path.join(targetDir, 'front_cloud.png'), 'dummy image data');
fs.writeFileSync(path.join(targetDir, 'front_specular.png'), 'dummy image data');

console.log('Dummy textures created!');
