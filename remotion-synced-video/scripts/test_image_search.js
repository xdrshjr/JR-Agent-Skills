#!/usr/bin/env node
/**
 * 多源图片搜索脚本 v2 - 简化版
 * 使用 agent-browser 爬取图片
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

// 下载图片
async function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('timeout')), 30000);
    
    https.get(url, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
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
      file.on('finish', () => { file.close(); resolve(outputPath); });
    }).on('error', (err) => { clearTimeout(timeout); reject(err); });
  });
}

// 搜索 Google Images (使用 browser)
async function searchGoogleImages(query, limit = 3) {
  console.log(`🔍 [Google Images] 搜索: "${query}"`);
  
  try {
    // 1. 打开 Google Images
    const searchUrl = `https://www.google.com/search?tbm=isch\u0026q=${encodeURIComponent(query)}\u0026tbs=isz:l`;
    console.log(`  → 打开页面...`);
    execSync(`agent-browser open "${searchUrl}"`, { stdio: 'pipe', timeout: 30000 });
    
    // 2. 等待加载
    execSync('agent-browser wait 4000', { stdio: 'pipe' });
    
    // 3. 获取页面 HTML
    console.log(`  → 提取图片链接...`);
    const html = execSync('agent-browser eval "document.body.innerHTML"', { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 30000 
    });
    
    // 4. 关闭浏览器
    execSync('agent-browser close', { stdio: 'pipe' });
    
    // 5. 提取图片 URL (Google Images 使用加密链接，需要解码)
    const results = [];
    
    // 查找包含图片 URL 的模式
    // Google Images 图片通常有 data-src 或 src 包含 googleusercontent
    const patterns = [
      /https:\/\/[^\s"]+\.googleusercontent\.com\/[^\s"]+/g,
      /https:\/\/[^\s"]+gstatic\.com[^\s"]*\.jpg/g,
      /https:\/\/[^\s"]+gstatic\.com[^\s"]*\.png/g,
    ];
    
    for (const pattern of patterns) {
      const matches = html.match(pattern);
      if (matches) {
        for (const url of matches) {
          // 清理 URL (去除转义)
          const cleanUrl = url.replace(/\\x3d/g, '=').replace(/\\x26/g, '\u0026');
          if (!results.find(r => r.url === cleanUrl)) {
            results.push({ url: cleanUrl, source: 'google' });
          }
          if (results.length >= limit) break;
        }
      }
      if (results.length >= limit) break;
    }
    
    console.log(`  ✓ 找到 ${results.length} 张图片`);
    return results;
    
  } catch (error) {
    console.error(`  ✗ 失败: ${error.message}`);
    try { execSync('agent-browser close', { stdio: 'pipe' }); } catch (e) {}
    return [];
  }
}

// 使用 Unsplash API
async function searchUnsplash(query, limit = 3) {
  console.log(`🔍 [Unsplash] 搜索: "${query}"`);
  
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    console.log('  ⚠️ 未设置 UNSPLASH_ACCESS_KEY');
    return [];
  }
  
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}\u0026per_page=${limit}`;
    const response = await new Promise((resolve, reject) => {
      https.get(url, { headers: { 'Authorization': `Client-ID ${key}` } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });
    
    const results = (response.results || []).map(p => ({
      url: p.urls?.regular || p.urls?.small,
      source: 'unsplash',
      width: p.width,
      height: p.height
    })).filter(r => r.url);
    
    console.log(`  ✓ 找到 ${results.length} 张图片`);
    return results;
  } catch (e) {
    console.error(`  ✗ 失败: ${e.message}`);
    return [];
  }
}

// 主函数
async function main() {
  const query = process.argv[2] || 'nature landscape';
  const outputDir = process.argv[3] || '/tmp/test-images';
  const limit = parseInt(process.argv[4], 10) || 3;
  
  console.log('═══════════════════════════════════════════');
  console.log('🖼️  图片搜索测试');
  console.log('═══════════════════════════════════════════\n');
  console.log(`搜索: "${query}"`);
  console.log(`输出: ${outputDir}\n`);
  
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 搜索图片
  let images = await searchGoogleImages(query, limit);
  
  // 如果 Google 失败，尝试 Unsplash
  if (images.length === 0) {
    images = await searchUnsplash(query, limit);
  }
  
  if (images.length === 0) {
    console.log('\n❌ 未找到任何图片');
    return;
  }
  
  // 下载图片
  console.log(`\n📥 下载 ${images.length} 张图片...\n`);
  const downloaded = [];
  
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const filename = `test-${i + 1}.jpg`;
    const outputPath = path.join(outputDir, filename);
    
    try {
      console.log(`[${i + 1}/${images.length}] ${filename}`);
      console.log(`    来源: ${img.source}`);
      console.log(`    URL: ${img.url.substring(0, 80)}...`);
      
      await downloadImage(img.url, outputPath);
      
      const stats = fs.statSync(outputPath);
      console.log(`    ✓ 成功 (${(stats.size / 1024).toFixed(1)} KB)\n`);
      
      downloaded.push({ filename, path: outputPath, size: stats.size, source: img.source });
    } catch (error) {
      console.log(`    ✗ 失败: ${error.message}\n`);
    }
  }
  
  // 结果摘要
  console.log('═══════════════════════════════════════════');
  console.log('📊 结果摘要');
  console.log('═══════════════════════════════════════════');
  console.log(`成功下载: ${downloaded.length}/${images.length}`);
  downloaded.forEach(d => {
    console.log(`  ✓ ${d.filename} - ${(d.size / 1024).toFixed(1)} KB [${d.source}]`);
  });
  
  if (downloaded.length > 0) {
    console.log(`\n📁 图片位置: ${outputDir}/`);
    // 列出文件供用户查看
    const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.jpg'));
    console.log(`   文件: ${files.join(', ')}`);
  }
}

main().catch(console.error);
