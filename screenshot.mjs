import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import { pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath  = path.join(__dirname, 'index.html');
const outPath   = 'C:\\Users\\22061\\Desktop\\紫夜魔谕_全页截图.png';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();

  // 1440px 宽，模拟桌面端
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  await page.goto(pathToFileURL(htmlPath).href, {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  // 等待字体/动画加载
  await new Promise(r => setTimeout(r, 3000));

  await page.screenshot({
    path: outPath,
    fullPage: true,
    type: 'png',
  });

  await browser.close();
  console.log('✅ 截图已保存至:', outPath);
})();
