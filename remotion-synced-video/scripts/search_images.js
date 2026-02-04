#!/usr/bin/env node
/**
 * 多源图片搜索脚本（生产版）
 * 优先级：Python Google Images → Bing Images → Unsplash → 渐变占位图
 * 
 * 使用方法：
 *   node search_images.js scenes.json --output ./public/images
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const https = require('https');
const http = require('http');

// 配置
const MIN_FILE_SIZE = 50 * 1024; // 50KB
const SEARCH_LIMIT = 5;
const DOWNLOAD_LIMIT = 2;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 解析参数
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    scenesFile: args[0] || 'scenes.json',
    outputDir: args.includes('--output') ? args[args.indexOf('--output') + 1] : './public/images'
  };
}

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 下载图片
async function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const timeout = setTimeout(() => reject(new Error('timeout')), 30000);
    
    client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      }
    }, (res) => {
      clearTimeout(timeout);
      
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadImage(res.headers.location, outputPath).then(resolve).catch(reject);
        return;
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(outputPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(outputPath);
      });
      file.on('error', reject);
    }).on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// 验证图片
function validateImage(imagePath) {
  try {
    const stats = fs.statSync(imagePath);
    if (stats.size < MIN_FILE_SIZE) {
      return { valid: false, reason: 'too_small', size: stats.size };
    }
    return { valid: true, size: stats.size };
  } catch (e) {
    return { valid: false, reason: 'error' };
  }
}

// Python Google Images 爬取（首选，更稳定）
async function searchGoogleImagesPython(query, limit = SEARCH_LIMIT) {
  console.log(`${colors.cyan}🔍 [Google/Python]${colors.reset} 搜索: "${query}"`);
  
  const scriptPath = path.join(__dirname, 'lib', 'crawl_google_images.py');
  
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [scriptPath, query, '--count', String(limit), '--json'], {
      timeout: 60000
    });
    
    let output = '';
    let errorOutput = '';
    
    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.stderr.on('data', (data) => { errorOutput += data.toString(); });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        console.log(`${colors.yellow}  ⚠️ Python 爬取失败${colors.reset}`);
        resolve([]);
        return;
      }
      
      try {
        const urls = JSON.parse(output);
        console.log(`${colors.green}  ✓${colors.reset} 找到 ${urls.length} 张图片`);
        resolve(urls.map(url => ({ url, source: 'google' })));
      } catch (e) {
        console.log(`${colors.yellow}  ⚠️ 解析失败${colors.reset}`);
        resolve([]);
      }
    });
    
    proc.on('error', (err) => {
      console.log(`${colors.yellow}  ⚠️ 启动失败: ${err.message}${colors.reset}`);
      resolve([]);
    });
  });
}

// Bing Images 搜索
async function searchBingImages(query, limit = SEARCH_LIMIT) {
  console.log(`${colors.cyan}🔍 [Bing]${colors.reset} 搜索: "${query}"`);
  
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.bing.com/images/search?q=${encodedQuery}&qft=+filterui:photo-photo+filterui:imagesize-large`;
    
    return new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const results = [];
          const murlRegex = /murl=([^&]+)/g;
          let match;
          while ((match = murlRegex.exec(data)) !== null && results.length < limit) {
            const decoded = decodeURIComponent(match[1]);
            if (decoded.startsWith('http') && !results.find(r => r.url === decoded)) {
              results.push({ url: decoded, source: 'bing' });
            }
          }
          console.log(`${colors.green}  ✓${colors.reset} 找到 ${results.length} 张图片`);
          resolve(results);
        });
      }).on('error', () => resolve([]));
    });
  } catch (error) {
    return [];
  }
}

// Unsplash API 搜索
async function searchUnsplash(query, limit = SEARCH_LIMIT) {
  console.log(`${colors.cyan}🔍 [Unsplash]${colors.reset} 搜索: "${query}"`);
  
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.log(`${colors.yellow}  ⚠️ 未设置 UNSPLASH_ACCESS_KEY${colors.reset}`);
    return [];
  }
  
  return new Promise((resolve, reject) => {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=landscape`;
    
    https.get(url, {
      headers: { 'Authorization': `Client-ID ${accessKey}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const results = (json.results || []).map(p => ({
            url: p.urls?.regular || p.urls?.small,
            source: 'unsplash'
          })).filter(r => r.url);
          console.log(`${colors.green}  ✓${colors.reset} 找到 ${results.length} 张图片`);
          resolve(results);
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

// 生成占位图
function generatePlaceholder(sceneId, outputPath) {
  const scriptPath = path.join(__dirname, 'generate_placeholder.js');
  try {
    execSync(`node "${scriptPath}" "${sceneId}" "${outputPath}"`, { stdio: 'pipe' });
    return fs.existsSync(outputPath);
  } catch (e) {
    return false;
  }
}

// 为场景搜索图片
async function searchForScene(scene, outputDir) {
  const query = scene.searchQuery || scene.title;
  const sceneId = scene.id;
  
  console.log(`\n${colors.blue}📌 场景: ${sceneId}${colors.reset}`);
  console.log(`   搜索词: "${query}"`);
  
  const failures = [];
  let allImages = [];
  
  // Level 1: Python Google Images（首选）
  const googleResults = await searchGoogleImagesPython(query, SEARCH_LIMIT);
  allImages = allImages.concat(googleResults);
  if (googleResults.length === 0) failures.push('Google: 未找到');
  if (allImages.length >= DOWNLOAD_LIMIT) {
    return await downloadImages(allImages, outputDir, sceneId, failures);
  }
  
  // Level 2: Bing Images
  const bingResults = await searchBingImages(query, SEARCH_LIMIT);
  for (const img of bingResults) {
    if (!allImages.find(existing => existing.url === img.url)) {
      allImages.push(img);
    }
  }
  if (bingResults.length === 0) failures.push('Bing: 未找到');
  if (allImages.length >= DOWNLOAD_LIMIT) {
    return await downloadImages(allImages, outputDir, sceneId, failures);
  }
  
  // Level 3: Unsplash
  const unsplashResults = await searchUnsplash(query, SEARCH_LIMIT);
  for (const img of unsplashResults) {
    if (!allImages.find(existing => existing.url === img.url)) {
      allImages.push(img);
    }
  }
  if (unsplashResults.length === 0) failures.push('Unsplash: 未找到或未配置 API Key');
  
  // 尝试下载
  const downloaded = await downloadImages(allImages, outputDir, sceneId, failures);
  if (downloaded.images.length > 0) return downloaded;
  
  // Level 4: 占位图
  console.log(`${colors.yellow}⚠️ 生成占位图${colors.reset}`);
  const placeholderPath = path.join(outputDir, `${sceneId}-placeholder.jpg`);
  
  if (generatePlaceholder(sceneId, placeholderPath)) {
    const stats = fs.statSync(placeholderPath);
    failures.push('已生成渐变占位图');
    return {
      success: true,
      images: [{
        filename: `${sceneId}-placeholder.jpg`,
        path: placeholderPath,
        size: `${(stats.size / 1024).toFixed(1)} KB`,
        source: 'placeholder'
      }],
      source: 'placeholder',
      failures
    };
  }
  
  return { success: false, images: [], failures };
}

// 下载图片
async function downloadImages(images, outputDir, sceneId, failures = []) {
  const downloaded = [];
  
  for (let i = 0; i < images.length && downloaded.length < DOWNLOAD_LIMIT; i++) {
    const img = images[i];
    const ext = path.extname(new URL(img.url).pathname) || '.jpg';
    const filename = `${sceneId}-${downloaded.length + 1}${ext}`;
    const outputPath = path.join(outputDir, filename);
    
    try {
      process.stdout.write(`  📥 下载 ${filename}... `);
      await downloadImage(img.url, outputPath);
      
      const validation = validateImage(outputPath);
      if (!validation.valid) {
        console.log(`${colors.yellow}跳过 (${validation.reason})${colors.reset}`);
        fs.unlinkSync(outputPath);
        continue;
      }
      
      const sizeKB = (validation.size / 1024).toFixed(1);
      console.log(`${colors.green}✓${colors.reset} (${sizeKB} KB) [${img.source}]`);
      
      downloaded.push({
        filename,
        path: outputPath,
        size: `${sizeKB} KB`,
        source: img.source
      });
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} ${error.message}`);
    }
  }
  
  return {
    success: downloaded.length > 0,
    images: downloaded,
    source: downloaded[0]?.source || 'none',
    failures
  };
}

// 主函数
async function main() {
  const args = parseArgs();
  
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}🖼️  多源图片搜索工具${colors.reset}`);
  console.log(`${colors.blue}   Python/Google → Bing → Unsplash → 占位图${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);
  
  if (!fs.existsSync(args.scenesFile)) {
    console.error(`${colors.red}❌ 场景文件不存在: ${args.scenesFile}${colors.reset}`);
    process.exit(1);
  }
  
  const scenes = JSON.parse(fs.readFileSync(args.scenesFile, 'utf8'));
  console.log(`📂 加载 ${scenes.length} 个场景\n`);
  
  ensureDir(args.outputDir);
  
  const stats = { total: scenes.length, google: 0, bing: 0, unsplash: 0, placeholder: 0, failures: [] };
  const imageMap = [];
  
  for (const scene of scenes) {
    const result = await searchForScene(scene, args.outputDir);
    
    if (result.source === 'google') stats.google++;
    else if (result.source === 'bing') stats.bing++;
    else if (result.source === 'unsplash') stats.unsplash++;
    else if (result.source === 'placeholder') stats.placeholder++;
    
    if (result.failures?.length > 0) {
      stats.failures.push({ sceneId: scene.id, reasons: result.failures });
    }
    
    if (result.images.length > 0) {
      imageMap.push({
        sceneId: scene.id,
        imagePath: `images/${result.images[0].filename}`,
        source: result.source
      });
    }
  }
  
  // 保存 image-map
  fs.writeFileSync(
    path.join(path.dirname(args.outputDir), 'image-map.json'),
    JSON.stringify(imageMap, null, 2)
  );
  
  // 输出摘要
  console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}📊 搜索完成摘要${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  
  console.log(`\n✅ 总计: ${stats.total} 个场景`);
  console.log(`   ${colors.green}Google:${colors.reset}    ${stats.google} 个`);
  console.log(`   ${colors.cyan}Bing:${colors.reset}      ${stats.bing} 个`);
  console.log(`   ${colors.blue}Unsplash:${colors.reset}  ${stats.unsplash} 个`);
  console.log(`   ${colors.yellow}占位图:${colors.reset}   ${stats.placeholder} 个`);
  
  if (stats.failures.length > 0) {
    console.log(`\n${colors.yellow}⚠️ 使用占位图的场景:${colors.reset}`);
    for (const fail of stats.failures) {
      console.log(`   • ${fail.sceneId}`);
      fail.reasons.forEach(r => console.log(`     - ${r}`));
    }
  }
  
  console.log(`\n📁 图片位置: ${args.outputDir}/`);
  console.log(`💾 映射文件: ${path.dirname(args.outputDir)}/image-map.json`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);
}

main().catch(err => {
  console.error(`${colors.red}❌ 错误: ${err.message}${colors.reset}`);
  process.exit(1);
});
