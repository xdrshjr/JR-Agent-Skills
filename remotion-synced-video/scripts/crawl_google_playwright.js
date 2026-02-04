
const { chromium } = require('playwright');

async function crawl() {
  const query = process.argv[2];
  const limit = parseInt(process.argv[3]) || 5;
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(query), {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // 提取图片 URL
    const images = await page.evaluate(() => {
      const urls = [];
      // 从 imgurl 链接提取
      document.querySelectorAll('a[href*="imgurl="]').forEach(a => {
        const match = a.href.match(/imgurl=([^&]+)/);
        if (match) {
          const url = decodeURIComponent(match[1]);
          if (url.startsWith('http') && !url.includes('gstatic')) {
            urls.push(url);
          }
        }
      });
      return urls;
    });
    
    console.log(JSON.stringify(images.slice(0, limit)));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

crawl();
