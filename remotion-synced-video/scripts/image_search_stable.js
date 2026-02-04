#!/usr/bin/env node
/**
 * 多源图片搜索 - 稳定版
 * 使用 DuckDuckGo + Unsplash
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 下载图片
function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('timeout')), 30000);
    const client = url.startsWith('https') ? https : require('http');
    
    client.get(url, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://duckduckgo.com/'
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
      file.on('error', reject);
    }).on('error', (err) => { clearTimeout(timeout); reject(err); });
  });
}

// 搜索 DuckDuckGo Images
async function searchDuckDuckGo(query, limit = 5) {
  console.log(`🔍 [DuckDuckGo] 搜索: "${query}"`);
  
  try {
    // DuckDuckGo 图片搜索 HTML 页面
    const encodedQuery = encodeURIComponent(query);
    const url = `https://duckduckgo.com/?q=${encodedQuery}&iax=images&ia=images`;
    
    return new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const results = [];
          
          // 方法1: 从 JSON 数据中提取
          try {
            // DuckDuckGo 会返回包含图片数据的 JS 变量
            const jsonMatch = data.match(/DDG\.pageLayout\.load\('d', (\[.+?\])\);/s);
            if (jsonMatch) {
              const images = JSON.parse(jsonMatch[1]);
              for (const img of images.slice(0, limit)) {
                if (img.image) {
                  results.push({
                    url: img.image,
                    source: 'duckduckgo',
                    width: img.width,
                    height: img.height,
                    title: img.title
                  });
                }
              }
            }
          } catch (e) {
            // 忽略解析错误
          }
          
          // 方法2: 正则提取图片 URL
          if (results.length === 0) {
            const imgRegex = /"(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi;
            let match;
            while ((match = imgRegex.exec(data)) !== null && results.length < limit) {
              const url = match[1];
              if (!results.find(r => r.url === url)) {
                results.push({ url, source: 'duckduckgo-regex' });
              }
            }
          }
          
          console.log(`  ✓ 找到 ${results.length} 张图片`);
          resolve(results);
        });
      }).on('error', (err) => {
        console.error(`  ✗ 请求失败: ${err.message}`);
        resolve([]);
      });
    });
    
  } catch (error) {
    console.error(`  ✗ 搜索失败: ${error.message}`);
    return [];
  }
}

// 搜索 Unsplash
async function searchUnsplash(query, limit = 3) {
  console.log(`🔍 [Unsplash] 搜索: "${query}"`);
  
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    console.log('  ⚠️ 未设置 UNSPLASH_ACCESS_KEY，跳过');
    return [];
  }
  
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=landscape`;
    
    return new Promise((resolve, reject) => {
      https.get(url, {
        headers: { 'Authorization': `Client-ID ${key}` }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const results = (json.results || []).map(p => ({
              url: p.urls?.regular || p.urls?.small,
              source: 'unsplash',
              width: p.width,
              height: p.height,
              description: p.description || p.alt_description
            })).filter(r => r.url);
            console.log(`  ✓ 找到 ${results.length} 张图片`);
            resolve(results);
          } catch (e) {
            resolve([]);
          }
        });
      }).on('error', () => resolve([]));
    });
  } catch (e) {
    return [];
  }
}

// 主函数
async function main() {
  const query = process.argv[2] || 'futuristic AI technology';
  const outputDir = process.argv[3] || '/tmp/image-test';
  const limit = parseInt(process.argv[4], 10) || 3;
  
  console.log('═══════════════════════════════════════════');
  console.log('🖼️  多源图片搜索测试 (DuckDuckGo + Unsplash)');
  console.log('═══════════════════════════════════════════\n');
  console.log(`搜索词: "${query}"`);
  console.log(`输出目录: ${outputDir}\n`);
  
  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 并行搜索多个源
  const [ddgResults, unsplashResults] = await Promise.all([
    searchDuckDuckGo(query, limit),
    searchUnsplash(query, limit)
  ]);
  
  // 合并结果（去重）
  const allImages = [];
  const seenUrls = new Set();
  
  for (const img of ddgResults) {
    if (!seenUrls.has(img.url)) {
      allImages.push(img);
      seenUrls.add(img.url);
    }
  }
  
  for (const img of unsplashResults) {
    if (!seenUrls.has(img.url)) {
      allImages.push(img);
      seenUrls.add(img.url);
    }
  }
  
  if (allImages.length === 0) {
    console.log('\n❌ 未找到任何图片');
    return;
  }
  
  console.log(`\n📥 开始下载 ${Math.min(allImages.length, limit)} 张图片...\n`);
  
  const downloaded = [];
  for (let i = 0; i < Math.min(allImages.length, limit); i++) {
    const img = allImages[i];
    const ext = path.extname(new URL(img.url).pathname) || '.jpg';
    const filename = `img-${String(i + 1).padStart(2, '0')}${ext}`;
    const outputPath = path.join(outputDir, filename);
    
    try {
      console.log(`[${i + 1}/${limit}] 下载: ${filename}`);
      console.log(`    来源: ${img.source}`);
      console.log(`    URL: ${img.url.substring(0, 70)}...`);
      
      await downloadImage(img.url, outputPath);
      
      const stats = fs.statSync(outputPath);
      if (stats.size < 1024) {
        console.log(`    ⚠️ 文件太小，删除`);
        fs.unlinkSync(outputPath);
        continue;
      }
      
      console.log(`    ✓ 成功 (${(stats.size / 1024).toFixed(1)} KB)\n`);
      downloaded.push({
        filename,
        path: outputPath,
        size: `${(stats.size / 1024).toFixed(1)} KB`,
        source: img.source,
        resolution: img.width && img.height ? `${img.width}x${img.height}` : 'unknown'
      });
    } catch (error) {
      console.log(`    ✗ 失败: ${error.message}\n`);
    }
  }
  
  // 结果摘要
  console.log('═══════════════════════════════════════════');
  console.log('📊 结果摘要');
  console.log('═══════════════════════════════════════════');
  console.log(`成功下载: ${downloaded.length} 张图片`);
  
  downloaded.forEach(d => {
    console.log(`\n  ✓ ${d.filename}`);
    console.log(`    大小: ${d.size}`);
    console.log(`    来源: ${d.source}`);
    console.log(`    分辨率: ${d.resolution}`);
  });
  
  if (downloaded.length > 0) {
    console.log(`\n📁 图片位置: ${outputDir}/`);
    
    // 保存结果报告
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(downloaded, null, 2));
    console.log(`💾 报告已保存: ${reportPath}`);
  }
}

main().catch(console.error);
