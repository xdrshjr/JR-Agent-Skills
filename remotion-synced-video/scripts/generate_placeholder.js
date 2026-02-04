#!/usr/bin/env node
/**
 * 生成渐变占位图（纯 Node.js，无需外部依赖）
 * 当所有图片搜索都失败时使用
 */

const fs = require('fs');
const path = require('path');

// 场景主题色映射 (16进制 RGB)
const themeGradients = {
  'intro': ['#667eea', '#764ba2'],           // 紫蓝渐变
  'hero': ['#f093fb', '#f5576c'],            // 粉红渐变
  'feature': ['#4facfe', '#00f2fe'],         // 青蓝渐变
  'solution': ['#43e97b', '#38f9d7'],        // 绿色渐变
  'challenge': ['#fa709a', '#fee140'],       // 橙红渐变
  'result': ['#30cfd0', '#330867'],          // 深紫渐变
  'outro': ['#a8edea', '#fed6e3'],           // 柔和渐变
  'default': ['#1a1a2e', '#16213e']          // 深蓝默认
};

// 解析16进制颜色
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 26, g: 26, b: 46 };
}

// 线性插值
function lerp(start, end, t) {
  return start + (end - start) * t;
}

// 根据场景ID获取渐变色
function getGradientColors(sceneId) {
  for (const [key, colors] of Object.entries(themeGradients)) {
    if (sceneId.toLowerCase().includes(key)) {
      return colors;
    }
  }
  return themeGradients['default'];
}

// 生成简单的 BMP 图片（无需外部库）
function generateBMP(width, height, color1, color2, text) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  // BMP 文件头
  const rowSize = Math.ceil((width * 3) / 4) * 4; // 每行字节数（4字节对齐）
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;
  
  const buffer = Buffer.alloc(fileSize);
  
  // BMP 文件头 (14字节)
  buffer.write('BM', 0);                          // 签名
  buffer.writeUInt32LE(fileSize, 2);              // 文件大小
  buffer.writeUInt32LE(0, 6);                     // 保留
  buffer.writeUInt32LE(54, 10);                   // 数据偏移
  
  // DIB 头 (40字节)
  buffer.writeUInt32LE(40, 14);                   // 头大小
  buffer.writeInt32LE(width, 18);                 // 宽度
  buffer.writeInt32LE(height, 22);                // 高度
  buffer.writeUInt16LE(1, 26);                    // 颜色平面数
  buffer.writeUInt16LE(24, 28);                   // 每像素位数 (24-bit)
  buffer.writeUInt32LE(0, 30);                    // 压缩方式
  buffer.writeUInt32LE(pixelDataSize, 34);        // 数据大小
  buffer.writeInt32LE(2835, 38);                  // 水平分辨率
  buffer.writeInt32LE(2835, 42);                  // 垂直分辨率
  buffer.writeUInt32LE(0, 46);                    // 颜色数
  buffer.writeUInt32LE(0, 50);                    // 重要颜色数
  
  // 像素数据 (从底部开始写入，BMP是倒置的)
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    const t = y / (height - 1); // 渐变比例
    const r = Math.round(lerp(c1.r, c2.r, t));
    const g = Math.round(lerp(c1.g, c2.g, t));
    const b = Math.round(lerp(c1.b, c2.b, t));
    
    for (let x = 0; x < width; x++) {
      buffer.writeUInt8(b, offset++);  // B
      buffer.writeUInt8(g, offset++);  // G
      buffer.writeUInt8(r, offset++);  // R
    }
    
    // 行填充
    const padding = rowSize - (width * 3);
    for (let p = 0; p < padding; p++) {
      buffer.writeUInt8(0, offset++);
    }
  }
  
  return buffer;
}

// 生成占位图
function generatePlaceholder(sceneId, outputPath, options = {}) {
  const width = options.width || 1920;
  const height = options.height || 1080;
  const colors = getGradientColors(sceneId);
  
  // 生成 BMP
  const bmpBuffer = generateBMP(width, height, colors[0], colors[1], sceneId);
  
  // 保存为 BMP（虽然BMP兼容性更好，但我们希望是JPG，所以这里使用简化方案）
  // 实际上我们可以生成 PPM 然后使用 ffmpeg 转换
  
  // 更简单的方案：生成 PPM，然后用 ffmpeg 转 JPG
  const ppmPath = outputPath.replace('.jpg', '.ppm');
  const ppmBuffer = generatePPM(width, height, colors[0], colors[1]);
  fs.writeFileSync(ppmPath, ppmBuffer);
  
  // 使用 ffmpeg 转换为 JPG
  try {
    const { execSync } = require('child_process');
    execSync(`ffmpeg -i "${ppmPath}" -q:v 2 "${outputPath}" -y`, { stdio: 'pipe' });
    fs.unlinkSync(ppmPath); // 删除临时 PPM
  } catch (e) {
    // ffmpeg 失败，保留 PPM
    fs.renameSync(ppmPath, outputPath.replace('.jpg', '.ppm'));
    return {
      path: outputPath.replace('.jpg', '.ppm'),
      size: `${(fs.statSync(outputPath.replace('.jpg', '.ppm')).size / 1024).toFixed(1)} KB`,
      colors: colors,
      resolution: `${width}x${height}`,
      note: 'ffmpeg not available, saved as PPM'
    };
  }
  
  const stats = fs.statSync(outputPath);
  return {
    path: outputPath,
    size: `${(stats.size / 1024).toFixed(1)} KB`,
    colors: colors,
    resolution: `${width}x${height}`
  };
}

// 生成 PPM 格式（更简单，纯文本）
function generatePPM(width, height, color1, color2) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  let ppm = `P6\n${width} ${height}\n255\n`;
  const header = Buffer.from(ppm, 'ascii');
  
  const pixelData = Buffer.alloc(width * height * 3);
  let offset = 0;
  
  for (let y = 0; y < height; y++) {
    const t = y / (height - 1);
    const r = Math.round(lerp(c1.r, c2.r, t));
    const g = Math.round(lerp(c1.g, c2.g, t));
    const b = Math.round(lerp(c1.b, c2.b, t));
    
    for (let x = 0; x < width; x++) {
      pixelData.writeUInt8(r, offset++);
      pixelData.writeUInt8(g, offset++);
      pixelData.writeUInt8(b, offset++);
    }
  }
  
  return Buffer.concat([header, pixelData]);
}

// 命令行支持
if (require.main === module) {
  const args = process.argv.slice(2);
  const sceneId = args[0] || 'default';
  const outputPath = args[1] || `./placeholder-${sceneId}.jpg`;
  
  try {
    const result = generatePlaceholder(sceneId, outputPath);
    console.log(`✅ 占位图已生成: ${result.path}`);
    console.log(`   分辨率: ${result.resolution}`);
    console.log(`   大小: ${result.size}`);
    console.log(`   渐变色: ${result.colors.join(' → ')}`);
    if (result.note) console.log(`   注意: ${result.note}`);
  } catch (error) {
    console.error(`❌ 生成失败: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { generatePlaceholder, getGradientColors };
