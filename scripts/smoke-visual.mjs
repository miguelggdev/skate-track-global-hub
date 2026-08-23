// Verificación visual de solo lectura contra la app real desplegada.
// No crea ni modifica ningún dato — solo navega y observa.
import { chromium } from 'playwright';

const URL = process.argv[2] || 'https://track.arkanatech.tech';
const consoleErrors = [];
const failedRequests = [];

const browser = await chromium.launch();
const page = await browser.newPage();

page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('requestfailed', (req) => {
  failedRequests.push(`${req.method()} ${req.url()} -> ${req.failure()?.errorText}`);
});
page.on('response', (res) => {
  if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`);
});

console.log(`Navegando a ${URL} ...`);
const response = await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
console.log(`Status HTTP: ${response?.status()}`);

await page.waitForTimeout(1500);

const title = await page.title();
console.log(`<title>: ${title}`);

const bodyText = await page.locator('body').innerText().catch(() => '');
console.log(`Texto visible (primeros 300 chars): ${bodyText.slice(0, 300).replace(/\n+/g, ' ')}`);

const screenshotPath = process.argv[3] || 'smoke-visual.png';
await page.screenshot({ path: screenshotPath, fullPage: true });
console.log(`Captura guardada en: ${screenshotPath}`);

console.log(`\nErrores de consola (${consoleErrors.length}):`);
consoleErrors.slice(0, 15).forEach((e) => console.log('  -', e));

console.log(`\nPeticiones fallidas / status >=400 (${failedRequests.length}):`);
failedRequests.slice(0, 15).forEach((e) => console.log('  -', e));

await browser.close();
