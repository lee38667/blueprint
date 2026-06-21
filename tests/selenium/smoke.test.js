/**
 * Blueprint — Selenium smoke test
 * -------------------------------------------------------------
 * Drives a real Chrome browser against the running app to confirm
 * the public routes render and the core auth UI is interactive.
 *
 * Driver binaries are resolved automatically by **Selenium Manager**
 * (bundled with selenium-webdriver) — no manual chromedriver install.
 *
 * Usage:
 *   1. Start the app:   npm run dev   (or: npm run build && npm start)
 *   2. Run the smoke:   npm run test:smoke
 *
 * Config (env vars):
 *   BASE_URL    base URL of the running app   (default http://localhost:3000)
 *   HEADLESS    "false" to watch the browser  (default headless/new)
 *   BROWSER     "chrome" | "firefox" | "edge" (default chrome)
 */

const { Builder, By, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const firefox = require('selenium-webdriver/firefox')
const edge = require('selenium-webdriver/edge')

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const HEADLESS = process.env.HEADLESS !== 'false'
const BROWSER = (process.env.BROWSER || 'chrome').toLowerCase()
const TIMEOUT = 15000

/** Minimal assertion + colored reporting, no test framework needed. */
const results = []
function record(name, ok, detail) {
  results.push({ name, ok, detail })
  const tag = ok ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'
  console.log(`  [${tag}] ${name}${detail ? ` — ${detail}` : ''}`)
}

function buildDriver() {
  const builder = new Builder()
  if (BROWSER === 'chrome') {
    const options = new chrome.Options()
    if (HEADLESS) options.addArguments('--headless=new')
    options.addArguments('--no-sandbox', '--disable-gpu', '--window-size=1280,900')
    return builder.forBrowser('chrome').setChromeOptions(options).build()
  }
  if (BROWSER === 'firefox') {
    const options = new firefox.Options()
    if (HEADLESS) options.addArguments('-headless')
    return builder.forBrowser('firefox').setFirefoxOptions(options).build()
  }
  if (BROWSER === 'edge') {
    const options = new edge.Options()
    if (HEADLESS) options.addArguments('--headless=new')
    return builder.forBrowser('MicrosoftEdge').setEdgeOptions(options).build()
  }
  throw new Error(`Unsupported BROWSER="${BROWSER}" (use chrome | firefox | edge)`)
}

async function run() {
  console.log(`\nBlueprint Selenium smoke test`)
  console.log(`  base URL : ${BASE_URL}`)
  console.log(`  browser  : ${BROWSER} (${HEADLESS ? 'headless' : 'headed'})\n`)

  let driver
  try {
    driver = await buildDriver()
  } catch (err) {
    console.error('\n\x1b[31mCould not start the browser/driver.\x1b[0m')
    console.error('Selenium Manager auto-resolves drivers, but a matching browser must be installed.')
    console.error(err.message)
    process.exit(2)
  }

  try {
    // 1. Login page loads and shows the document title.
    await driver.get(`${BASE_URL}/login`)
    await driver.wait(until.titleContains('Blueprint'), TIMEOUT).catch(() => {})
    const title = await driver.getTitle()
    record('login page responds with Blueprint title', /blueprint/i.test(title), `title="${title}"`)

    // 2. Email + password inputs are present (auth form rendered).
    const emailInput = await driver.wait(
      until.elementLocated(By.css('input[type="email"], input[placeholder*="@"]')),
      TIMEOUT,
    )
    record('login email field is present', !!emailInput)

    const passwordInput = await driver.findElements(By.css('input[type="password"]'))
    record('login password field is present', passwordInput.length > 0)

    // 3. The email field is actually interactive (typing works).
    await emailInput.sendKeys('smoke-test@example.com')
    const typed = await emailInput.getAttribute('value')
    record('email field accepts input', typed === 'smoke-test@example.com', `value="${typed}"`)

    // 4. Register page also renders its form.
    await driver.get(`${BASE_URL}/register`)
    const regEmail = await driver.wait(
      until.elementLocated(By.css('input[type="email"], input[placeholder*="@"]')),
      TIMEOUT,
    )
    record('register page renders an email field', !!regEmail)

    // 5. A protected route redirects an unauthenticated visitor to /login.
    await driver.get(`${BASE_URL}/dashboard`)
    await driver.wait(async () => (await driver.getCurrentUrl()).includes('/login'), TIMEOUT).catch(() => {})
    const afterUrl = await driver.getCurrentUrl()
    record('protected /dashboard redirects to /login when signed out', afterUrl.includes('/login'), afterUrl)
  } catch (err) {
    record('unexpected error during run', false, err.message)
  } finally {
    if (driver) await driver.quit()
  }

  const passed = results.filter((r) => r.ok).length
  const failed = results.length - passed
  console.log(`\n${passed}/${results.length} checks passed${failed ? `, ${failed} failed` : ''}.\n`)
  process.exit(failed ? 1 : 0)
}

run()
