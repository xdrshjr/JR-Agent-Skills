const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const excalidrawFile = process.argv[2] || 'ai-development.excalidraw';
const outputFile = process.argv[3] || 'ai-development.png';

// Read and parse excalidraw data
const data = JSON.parse(fs.readFileSync(excalidrawFile, 'utf8'));

// Create HTML with canvas rendering
const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; }
    body { background: white; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script>
    const data = ${JSON.stringify(data)};
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    data.elements.forEach(el => {
      const w = el.width || 100;
      const h = el.height || 50;
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + w);
      maxY = Math.max(maxY, el.y + h);
    });
    
    // Add padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Set canvas size with scale for better quality
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(scale, scale);
    ctx.translate(-minX, -minY);
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(minX, minY, width, height);
    
    // Sort elements by index for proper z-order
    const elements = [...data.elements].sort((a, b) => (a.index || '').localeCompare(b.index || ''));
    
    elements.forEach(el => {
      ctx.strokeStyle = el.strokeColor || '#1e1e1e';
      ctx.fillStyle = el.backgroundColor === 'transparent' ? 'white' : (el.backgroundColor || 'white');
      ctx.lineWidth = el.strokeWidth || 2;
      
      if (el.type === 'rectangle') {
        ctx.beginPath();
        ctx.rect(el.x, el.y, el.width, el.height);
        ctx.fill();
        ctx.stroke();
      } else if (el.type === 'ellipse') {
        ctx.beginPath();
        ctx.ellipse(el.x + el.width/2, el.y + el.height/2, el.width/2, el.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (el.type === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(el.x + el.width/2, el.y);
        ctx.lineTo(el.x + el.width, el.y + el.height/2);
        ctx.lineTo(el.x + el.width/2, el.y + el.height);
        ctx.lineTo(el.x, el.y + el.height/2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (el.type === 'text') {
        ctx.fillStyle = el.strokeColor || '#1e1e1e';
        ctx.font = (el.fontSize || 20) + 'px sans-serif';
        ctx.textAlign = el.textAlign || 'left';
        ctx.textBaseline = 'middle';
        const lines = el.text.split('\\n');
        const lineHeight = (el.fontSize || 20) * 1.25;
        lines.forEach((line, i) => {
          ctx.fillText(line, el.x, el.y + i * lineHeight + lineHeight/2);
        });
      } else if (el.type === 'arrow') {
        const startX = el.x;
        const startY = el.y;
        const endX = el.x + (el.width || 0);
        const endY = el.y + (el.height || 0);
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Arrow head
        const angle = Math.atan2(endY - startY, endX - startX);
        const headLen = 15;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI/6), endY - headLen * Math.sin(angle - Math.PI/6));
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI/6), endY - headLen * Math.sin(angle + Math.PI/6));
        ctx.stroke();
      } else if (el.type === 'line') {
        const points = el.points || [[0, 0], [el.width || 100, el.height || 0]];
        ctx.beginPath();
        ctx.moveTo(el.x + points[0][0], el.y + points[0][1]);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(el.x + points[i][0], el.y + points[i][1]);
        }
        ctx.stroke();
      }
    });
    
    // Signal ready
    document.body.setAttribute('data-ready', 'true');
  </script>
</body>
</html>`;

fs.writeFileSync('render.html', html);

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 2000, height: 2000 });
  
  const htmlPath = path.join(__dirname, 'render.html');
  const fileUrl = 'file://' + htmlPath;
  
  console.log('Loading render page...');
  await page.goto(fileUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Wait for ready
  console.log('Waiting for render...');
  await page.waitForFunction(() => {
    return document.body.getAttribute('data-ready') === 'true';
  }, { timeout: 30000 });
  
  await sleep(500);
  
  // Get canvas dimensions
  const dims = await page.evaluate(() => {
    const canvas = document.getElementById('canvas');
    return { width: canvas.width / 2, height: canvas.height / 2 };
  });
  
  console.log('Canvas size:', dims);
  
  // Take screenshot
  console.log('Taking screenshot...');
  await page.screenshot({ 
    path: outputFile,
    clip: { x: 0, y: 0, width: dims.width, height: dims.height }
  });
  console.log(`Saved to ${outputFile}`);
  
  await browser.close();
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
