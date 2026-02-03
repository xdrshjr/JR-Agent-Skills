const axios = require('axios');
const fs = require('fs');
const path = require('path');

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!UNSPLASH_ACCESS_KEY) {
  console.error('❌ 请设置 UNSPLASH_ACCESS_KEY 环境变量');
  console.error('获取方式: https://unsplash.com/developers');
  process.exit(1);
}

// 搜索 Unsplash 图片
async function searchUnsplash(query, perPage = 5) {
  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      },
      params: {
        query: query,
        per_page: perPage,
        orientation: 'landscape',
        content_filter: 'high'
      }
    });
    
    return response.data.results.map(photo => ({
      id: photo.id,
      url: photo.urls.regular,
      thumb: photo.urls.small,
      author: photo.user.name,
      authorUrl: photo.user.links.html,
      description: photo.description || photo.alt_description || query
    }));
  } catch (error) {
    console.error('搜索失败:', error.message);
    if (error.response) {
      console.error('API 响应:', error.response.data);
    }
    return [];
  }
}

// 下载图片
async function downloadImage(imageUrl, outputPath) {
  try {
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'stream',
      timeout: 30000
    });
    
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`  ✅ ${path.basename(outputPath)}`);
        resolve();
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('  ❌ 下载失败:', error.message);
    throw error;
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('用法: node search_images.js <场景JSON> <输出目录>');
    console.log('示例: node search_images.js scenes.json public/images');
    process.exit(1);
  }
  
  const scenesFile = args[0];
  const outputDir = args[1];
  
  if (!fs.existsSync(scenesFile)) {
    console.error(`❌ 场景文件不存在: ${scenesFile}`);
    process.exit(1);
  }
  
  // 读取场景配置
  const scenes = JSON.parse(fs.readFileSync(scenesFile, 'utf8'));
  
  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log(`\n🖼️  开始搜索 ${scenes.length} 个场景的图片...\n`);
  
  const results = [];
  const attribution = []; // 署名信息
  
  for (const scene of scenes) {
    const query = scene.searchQuery || scene.title;
    console.log(`🔍 [${scene.id}] "${query}"`);
    
    const images = await searchUnsplash(query, 3);
    
    if (images.length > 0) {
      const selected = images[0];
      const filename = `scene-${scene.id}-${selected.id}.jpg`;
      const outputPath = path.join(outputDir, filename);
      
      await downloadImage(selected.url, outputPath);
      
      results.push({
        sceneId: scene.id,
        imagePath: `images/${filename}`,
        author: selected.author,
        authorUrl: selected.authorUrl,
        query: query
      });
      
      attribution.push({
        scene: scene.id,
        photoBy: selected.author,
        url: selected.authorUrl
      });
    } else {
      console.log(`  ⚠️ 未找到图片`);
    }
  }
  
  // 保存映射文件
  fs.writeFileSync(
    path.join(path.dirname(outputDir), 'image-map.json'),
    JSON.stringify(results, null, 2)
  );
  
  // 保存署名信息
  fs.writeFileSync(
    path.join(path.dirname(outputDir), 'attribution.json'),
    JSON.stringify(attribution, null, 2)
  );
  
  console.log(`\n✨ 完成！已下载 ${results.length} 张图片`);
  console.log(`📁 图片映射: ${path.dirname(outputDir)}/image-map.json`);
  console.log(`📄 署名信息: ${path.dirname(outputDir)}/attribution.json`);
}

main().catch(console.error);
