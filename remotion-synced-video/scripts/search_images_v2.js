#!/usr/bin/env node
/**
 * 多源图片搜索脚本
 * 优先级：浏览器爬取 → Bing Images → Google Images → Unsplash (可选)
 * 
 * 使用方法：
 *   node search_images.js "搜索关键词" --output ./images --limit 5
 *   node search_images.js --config scenes.json --output ./images
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const https = require('https');
const http = require('http');

// 配置
const MIN_WIDTH = 1920;  // 高清图片最小宽度
const MIN_HEIGHT = 1080; // 高清图片最小高度

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    queries: [],
    output: './images',
    limit: 5,
    strategy: 'web-first', // web-first, browser-only, bing-only, google-only, unsplash-only
    useUnsplash: true,
    sceneId: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--limit' || arg === '-l') {
      options.limit = parseInt(args[++i], 10);
    } else if (arg === '--strategy' || arg === '-s') {
      options.strategy = args[++i];
    } else if (arg === '--no-unsplash') {
      options.useUnsplash = false;
    } else if (arg === '--config' || arg === '-c') {
      options.configFile = args[++i];
    } else if (arg === '--scene') {
      options.sceneId = args[++i];
    } else if (!arg.startsWith('-')) {
      options.queries.push(arg);
    }
  }

  return options;
}

// 确保输出目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 下载图片
async function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const timeout = setTimeout(() => {
      reject(new Error('Download timeout'));
    }, 30000);

    client.get(url, { headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Referer': 'https://www.google.com/'
    }}, (res) => {
      clearTimeout(timeout);
      
      if (res.statusCode === 301 || res.statusCode === 302) {
        // 跟随重定向
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
    }).on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// 使用 agent-browser 爬取 Google Images
async function searchWithBrowser(query, limit = 5) {
  console.log(`🔍 [浏览器] 搜索: "${query}"`);
  const results = [];
  
  try {
    // 使用 URL 编码的搜索词
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodedQuery}&tbs=isz:l`; // isz:l = 大尺寸

    // 1. 打开页面
    console.log(`  → 打开: ${searchUrl}`);
    execSync(`agent-browser open "${searchUrl}"`, { stdio: 'pipe', timeout: 30000 });
    
    // 2. 等待图片加载
    console.log('  → 等待图片加载...');
    execSync('agent-browser wait 3000', { stdio: 'pipe' });
    
    // 3. 获取页面源码并提取图片 URL
    // 使用 JavaScript 提取图片 URL
    const extractScript = `
      Array.from(document.querySelectorAll('img[data-src], img[src]')).map(img => ({
        src: img.dataset?.src || img.src,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      })).filter(img => img.src && !img.src.startsWith('data:') && img.src.includes('googleusercontent'))
    `;
    
    const output = execSync(`agent-browser eval '${extractScript}'`, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 30000 
    });
    
    // 4. 关闭浏览器
    execSync('agent-browser close', { stdio: 'pipe' });

    // 5. 解析结果
    let images = [];
    try {
      images = JSON.parse(output);
    } catch (e) {
      // 如果 JSON 解析失败，尝试正则提取
      const urlPattern = new RegExp('https://[^\\s\'"<>]+googleusercontent[^\\s\'"<>]+', 'g');
      const urlMatches = output.match(urlPattern);
      if (urlMatches) {
        images = urlMatches.map(url => ({ src: url, width: 0, height: 0 }));
      }
    }

    // 6. 筛选高清图片
    for (const img of images.slice(0, limit * 2)) {
      if (img.src && !img.src.includes('gstatic.com')) {
        results.push({
          url: img.src,
          source: 'browser-google',
          width: img.width || 0,
          height: img.height || 0
        });
        if (results.length >= limit) break;
      }
    }

    console.log(`  ✓ 找到 ${results.length} 张图片`);
    return results;

  } catch (error) {
    console.error(`  ✗ 浏览器搜索失败: ${error.message}`);
    // 确保关闭浏览器
    try { execSync('agent-browser close', { stdio: 'pipe' }); } catch (e) {}
    return [];
  }
}

// 使用 Bing Images API (无需 key 的方式)
async function searchWithBing(query, limit = 5) {
  console.log(`🔍 [Bing] 搜索: "${query}"`);
  const results = [];

  try {
    // Bing 图片搜索 URL
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.bing.com/images/search?q=${encodedQuery}&qft=+filterui:photo-photo+filterui:imagesize-large`;

    // 使用 agent-browser 爬取
    execSync(`agent-browser open "${searchUrl}"`, { stdio: 'pipe', timeout: 30000 });
    execSync('agent-browser wait 3000', { stdio: 'pipe' });

    // 提取图片
    const extractScript = `
      Array.from(document.querySelectorAll('.mimg, .noPic, img[src*="bing.net/th"]')).map(img => ({
        src: img.src || img.dataset.src,
        width: img.naturalWidth || 0,
        height: img.naturalHeight || 0
      })).filter(img => img.src && img.src.startsWith('http'))
    `;

    const output = execSync(`agent-browser eval '${extractScript}'`, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 30000 
    });

    execSync('agent-browser close', { stdio: 'pipe' });

    let images = [];
    try {
      images = JSON.parse(output);
    } catch (e) {
      const urlMatches = output.match(/https:\/\/[^\s\'"<>]+/g);
      if (urlMatches) {
        images = urlMatches.map(url => ({ src: url, width: 0, height: 0 }));
      }
    }

    for (const img of images.slice(0, limit * 2)) {
      if (img.src && img.src.startsWith('http')) {
        results.push({
          url: img.src,
          source: 'bing',
          width: img.width || 0,
          height: img.height || 0
        });
        if (results.length >= limit) break;
      }
    }

    console.log(`  ✓ 找到 ${results.length} 张图片`);
    return results;

  } catch (error) {
    console.error(`  ✗ Bing 搜索失败: ${error.message}`);
    try { execSync('agent-browser close', { stdio: 'pipe' }); } catch (e) {}
    return [];
  }
}

// 使用 Unsplash API
async function searchWithUnsplash(query, limit = 5) {
  console.log(`🔍 [Unsplash] 搜索: "${query}"`);
  const results = [];
  
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.error('  ✗ 未设置 UNSPLASH_ACCESS_KEY 环境变量');
    return [];
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const apiUrl = `https://api.unsplash.com/search/photos?query=${encodedQuery}&per_page=${limit * 2}&orientation=landscape`;

    return new Promise((resolve, reject) => {
      https.get(apiUrl, {
        headers: {
          'Authorization': `Client-ID ${accessKey}`,
          'Accept-Version': 'v1'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.results) {
              for (const photo of json.results) {
                // 优先使用高分辨率
                const url = photo.urls?.raw || photo.urls?.full || photo.urls?.regular;
                if (url) {
                  results.push({
                    url: url,
                    source: 'unsplash',
                    width: photo.width,
                    height: photo.height,
                    description: photo.description || photo.alt_description
                  });
                }
                if (results.length >= limit) break;
              }
            }
            console.log(`  ✓ 找到 ${results.length} 张图片`);
            resolve(results);
          } catch (e) {
            console.error(`  ✗ 解析失败: ${e.message}`);
            resolve([]);
          }
        });
      }).on('error', (err) => {
        console.error(`  ✗ 请求失败: ${err.message}`);
        resolve([]);
      });
    });

  } catch (error) {
    console.error(`  ✗ Unsplash 搜索失败: ${error.message}`);
    return [];
  }
}

// 主搜索函数 - 按优先级搜索
async function searchImages(query, options) {
  const { strategy, limit, useUnsplash } = options;
  let results = [];

  // 策略 1: 浏览器爬取 (Google Images)
  if (strategy === 'web-first' || strategy === 'browser-only') {
    results = await searchWithBrowser(query, limit);
    if (results.length >= limit) return results;
  }

  // 策略 2: Bing Images
  if ((strategy === 'web-first' || strategy === 'bing-only') && results.length < limit) {
    const bingResults = await searchWithBing(query, limit - results.length);
    results = mergeUnique(results, bingResults);
    if (results.length >= limit) return results;
  }

  // 策略 3: 再次尝试浏览器（使用不同的搜索词）
  if (strategy === 'web-first' && results.length < limit) {
    const altQuery = query + ' high resolution';
    const moreResults = await searchWithBrowser(altQuery, limit - results.length);
    results = mergeUnique(results, moreResults);
  }

  // 策略 4: Unsplash (备选)
  if (useUnsplash && results.length < limit) {
    const unsplashResults = await searchWithUnsplash(query, limit - results.length);
    results = mergeUnique(results, unsplashResults);
  }

  return results.slice(0, limit);
}

// 合并去重
function mergeUnique(existing, newItems) {
  const existingUrls = new Set(existing.map(r => r.url));
  for (const item of newItems) {
    if (!existingUrls.has(item.url)) {
      existing.push(item);
      existingUrls.add(item.url);
    }
  }
  return existing;
}

// 下载图片到本地
async function downloadImages(images, outputDir, sceneId) {
  ensureDir(outputDir);
  const downloaded = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const ext = path.extname(new URL(img.url).pathname) || '.jpg';
    const filename = sceneId ? `${sceneId}-${i + 1}${ext}` : `img-${i + 1}${ext}`;
    const outputPath = path.join(outputDir, filename);

    try {
      console.log(`  📥 下载: ${filename}`);
      await downloadImage(img.url, outputPath);
      
      // 检查文件大小
      const stats = fs.statSync(outputPath);
      if (stats.size < 10240) { // 小于 10KB 可能是错误页面
        console.log(`  ⚠️ 文件太小，可能下载失败: ${filename}`);
        fs.unlinkSync(outputPath);
        continue;
      }

      downloaded.push({
        filename,
        path: outputPath,
        size: `${(stats.size / 1024).toFixed(1)} KB`,
        source: img.source,
        originalUrl: img.url
      });
      console.log(`  ✓ 已保存: ${filename} (${(stats.size / 1024).toFixed(1)} KB)`);
    } catch (error) {
      console.error(`  ✗ 下载失败: ${filename} - ${error.message}`);
    }
  }

  return downloaded;
}

// 从 scenes.json 读取搜索配置
function loadScenesConfig(configPath) {
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`读取配置文件失败: ${error.message}`);
    return null;
  }
}

// 主函数
async function main() {
  const options = parseArgs();
  
  console.log('═══════════════════════════════════════════');
  console.log('🖼️  多源图片搜索工具');
  console.log('═══════════════════════════════════════════\n');

  // 加载配置文件或直接使用关键词
  let searchTasks = [];
  
  if (options.configFile) {
    const scenes = loadScenesConfig(options.configFile);
    if (!scenes) {
      process.exit(1);
    }
    
    for (const scene of scenes) {
      const queries = scene.imageSearch?.queries || [scene.searchQuery || scene.title];
      searchTasks.push({
        sceneId: scene.id,
        queries: queries,
        strategy: scene.imageSearch?.strategy || 'web-first',
        useUnsplash: scene.imageSearch?.fallback !== false
      });
    }
  } else if (options.queries.length > 0) {
    searchTasks.push({
      sceneId: options.sceneId || 'default',
      queries: options.queries,
      strategy: options.strategy,
      useUnsplash: options.useUnsplash
    });
  } else {
    console.log('使用方法:');
    console.log('  node search_images.js "搜索关键词" -o ./images -l 5');
    console.log('  node search_images.js -c scenes.json -o ./images');
    console.log('\n选项:');
    console.log('  -o, --output <dir>    输出目录 (默认: ./images)');
    console.log('  -l, --limit <num>     每场景图片数 (默认: 5)');
    console.log('  -s, --strategy <str>  搜索策略: web-first, browser-only, bing-only, unsplash-only');
    console.log('  -c, --config <file>   从 scenes.json 读取配置');
    console.log('  --no-unsplash         不使用 Unsplash');
    process.exit(0);
  }

  // 执行搜索
  const allResults = [];
  
  for (const task of searchTasks) {
    console.log(`\n📌 场景: ${task.sceneId}`);
    console.log(`   查询: ${task.queries.join(', ')}`);
    
    // 使用第一个查询词进行搜索
    const primaryQuery = task.queries[0];
    const images = await searchImages(primaryQuery, {
      strategy: task.strategy,
      limit: options.limit,
      useUnsplash: task.useUnsplash
    });

    if (images.length > 0) {
      // 下载图片
      const downloaded = await downloadImages(images, options.output, task.sceneId);
      allResults.push({
        sceneId: task.sceneId,
        query: primaryQuery,
        images: downloaded
      });
    } else {
      console.log(`  ⚠️ 未找到任何图片`);
    }
  }

  // 输出结果摘要
  console.log('\n═══════════════════════════════════════════');
  console.log('📊 搜索完成摘要');
  console.log('═══════════════════════════════════════════');
  
  let totalImages = 0;
  for (const result of allResults) {
    console.log(`\n🎬 ${result.sceneId}:`);
    console.log(`   查询: "${result.query}"`);
    console.log(`   下载: ${result.images.length} 张图片`);
    for (const img of result.images) {
      console.log(`      - ${img.filename} (${img.size}) [${img.source}]`);
    }
    totalImages += result.images.length;
  }
  
  console.log(`\n总计: ${totalImages} 张图片已保存到 ${options.output}/`);
  console.log('═══════════════════════════════════════════\n');

  // 生成结果 JSON
  const resultJson = path.join(options.output, 'search-results.json');
  fs.writeFileSync(resultJson, JSON.stringify(allResults, null, 2));
  console.log(`💾 详细结果已保存: ${resultJson}`);
}

// 运行
main().catch(console.error);
