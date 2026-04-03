import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const baseUrl = process.argv[2] || 'http://localhost:3000'
const outDir = path.join(process.env.TEMP || process.cwd(), 'scriptbot-browser-smoke')
await fsp.mkdir(outDir, { recursive: true })

const candidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
]

const executablePath = candidates.find((browserPath) => fs.existsSync(browserPath))
if (!executablePath) {
  throw new Error('No local browser executable found')
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  defaultViewport: { width: 1440, height: 960 },
  args: ['--no-sandbox', '--disable-dev-shm-usage']
})

const page = await browser.newPage()
const consoleMessages = []
const pageErrors = []
const requestFailures = []

page.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }))
page.on('pageerror', (err) => pageErrors.push(err.message))
page.on('requestfailed', (req) => {
  requestFailures.push({
    url: req.url(),
    method: req.method(),
    errorText: req.failure()?.errorText ?? 'unknown',
  })
})

const routes = ['/', '/dashboard', '/pipeline', '/repurpose', '/analytics', '/brands', '/settings/connections']
const results = []

for (const route of routes) {
  const url = `${baseUrl}${route}`
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForSelector('body', { timeout: 10000 })
  const fileName = route === '/' ? 'root.png' : route.replaceAll('/', '_').replace(/^_/, '') + '.png'
  await page.screenshot({ path: path.join(outDir, fileName), fullPage: true })
  const title = await page.title()
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500))
  const nextError = await page.evaluate(() => {
    const dialog = document.querySelector('[data-nextjs-dialog]')
    return dialog ? dialog.textContent : null
  })

  results.push({
    route,
    status: response?.status(),
    finalUrl: page.url(),
    title,
    nextError,
    bodyText
  })
}

await browser.close()

const report = { results, consoleMessages, pageErrors, requestFailures }
await fsp.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
