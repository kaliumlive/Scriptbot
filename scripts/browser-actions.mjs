import fs from 'node:fs'
import puppeteer from 'puppeteer-core'

const baseUrl = process.argv[2] || 'http://localhost:3000'

const candidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
]

const executablePath = candidates.find((browserPath) => fs.existsSync(browserPath))
if (!executablePath) {
  throw new Error('No local browser executable found')
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  defaultViewport: { width: 1440, height: 960 },
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

const page = await browser.newPage()
const consoleMessages = []
const pageErrors = []
const requestSummaries = []
const dialogs = []
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

page.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }))
page.on('pageerror', (err) => pageErrors.push(err.message))
page.on('dialog', async (dialog) => {
  dialogs.push({ type: dialog.type(), message: dialog.message() })
  await dialog.dismiss()
})
page.on('response', async (res) => {
  const url = res.url()
  if (url.includes('/api/')) {
    requestSummaries.push({
      url,
      status: res.status(),
    })
  }
})

await page.evaluateOnNewDocument(() => {
  const originalFetch = window.fetch.bind(window)
  window.__scriptbotRequests = []
  window.fetch = async (...args) => {
    const [input, init] = args
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input)
    window.__scriptbotRequests.push({
      url,
      method: init?.method || (input instanceof Request ? input.method : 'GET'),
    })
    return originalFetch(...args)
  }
})

async function clickByTestId(testId) {
  const selector = `[data-testid="${testId}"]`
  await page.waitForSelector(selector, { timeout: 10000 })
  const element = await page.$(selector)
  if (!element) {
    return false
  }
  const box = await element.boundingBox()
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  } else {
    await element.click()
  }
  return true
}

async function getBrowserRequests() {
  return page.evaluate(() => window.__scriptbotRequests || [])
}

async function runDashboardPipeline() {
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForSelector('body', { timeout: 10000 })
  await sleep(1500)
  const clicked = await clickByTestId('run-pipeline-button')
  if (!clicked) return { name: 'dashboard-pipeline', ok: false, detail: 'Run pipeline button not found' }
  await sleep(4000)
  const bodyText = await page.evaluate(() => document.body.innerText)
  const browserRequests = await page.evaluate(() => window.__scriptbotRequests || [])
  return {
    name: 'dashboard-pipeline',
    ok: browserRequests.some((req) => req.url === '/api/run-agent' && req.method === 'POST'),
    requests: browserRequests,
    detail: bodyText.slice(0, 600),
  }
}

async function runAnalyticsSync() {
  await page.goto(`${baseUrl}/analytics`, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForSelector('body', { timeout: 10000 })
  await sleep(1500)
  const clicked = await clickByTestId('analytics-sync-button')
  if (!clicked) return { name: 'analytics-sync', ok: false, detail: 'Sync Platforms button not found' }
  await sleep(1500)
  let browserRequests = await getBrowserRequests()
  if (!browserRequests.some((req) => req.url === '/api/run-agent' && req.method === 'POST')) {
    await page.$eval('[data-testid="analytics-sync-button"]', (node) => {
      node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
  }
  await sleep(5000)
  const bodyText = await page.evaluate(() => document.body.innerText)
  browserRequests = await getBrowserRequests()
  return {
    name: 'analytics-sync',
    ok: browserRequests.some((req) => req.url === '/api/run-agent' && req.method === 'POST'),
    requests: browserRequests,
    detail: bodyText.slice(0, 600),
  }
}

async function runIdeateSubmit() {
  await page.goto(`${baseUrl}/ideate`, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForSelector('[data-testid="ideate-topic-input"]', { timeout: 10000 })
  await sleep(1500)
  await page.click('[data-testid="ideate-topic-input"]')
  await page.type('[data-testid="ideate-topic-input"]', 'How can a beginner creator build a stronger personal brand with simple home-shot videos?', { delay: 10 })
  const clicked = await clickByTestId('ideate-submit-button')
  if (!clicked) return { name: 'ideate-submit', ok: false, detail: 'Flesh it out button not found' }
  await sleep(6000)
  const bodyText = await page.evaluate(() => document.body.innerText)
  const browserRequests = await page.evaluate(() => window.__scriptbotRequests || [])
  return {
    name: 'ideate-submit',
    ok: browserRequests.some((req) => req.url === '/api/agents/flesh-out' && req.method === 'POST'),
    requests: browserRequests,
    detail: bodyText.slice(0, 800),
  }
}

const checks = [
  await runDashboardPipeline(),
  await runAnalyticsSync(),
  await runIdeateSubmit(),
]

await browser.close()

console.log(JSON.stringify({
  checks,
  requestSummaries,
  consoleMessages,
  pageErrors,
  dialogs,
}, null, 2))
