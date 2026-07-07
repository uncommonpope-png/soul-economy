---
name: soulguns-testing
description: 1. Vitest — Test Runner Architecture
domain: computer-science
language: python
stars: "0"
topics: ["soulguns", "architecture", "typescript", "design-patterns"]
version: 0.1.0
author: profit-prime
input_schema:
  type: object
  properties: {}
  required: []
output_schema:
  type: object
  properties: {}
  required: []
----|-------|----------|-----------------|
| microsoft/playwright | 70k★ | TypeScript | E2E testing, web-first assertions, fixtures, trace viewer |
| vitest-dev/vitest | 68k★ | TypeScript | Vite-native test runner, Jest-compatible, type testing |
| cypress-io/cypress | 48k★ | JavaScript | In-browser E2E, time-travel debugging, component testing |
| testing-library/react-testing-library | 19k★ | TypeScript | Component testing philosophy, user-centric queries |
| testing-library/dom-testing-library | — | TypeScript | DOM query engine, async utilities |
| testing-library/jest-dom | — | TypeScript | Custom DOM matchers |

---

## 1. Vitest — Test Runner Architecture

### 1.1 Config System

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,                    // describe/it/expect without imports
    environment: 'jsdom',             // 'node' | 'jsdom' | 'happy-dom' | 'edge-runtime'
    setupFiles: ['./src/test/setup.ts'],
    globalSetup: ['./src/test/global-setup.ts'],
    pool: 'forks',                    // 'forks' | 'threads' | 'vmThreads' | 'vmForks'
    fileParallelism: true,
    maxWorkers: 4,
    maxConcurrency: 5,
    sequence: {
      hooks: 'stack',                 // 'stack' | 'list' | 'parallel'
      shuffle: false,
      concurrent: false,
    },
    coverage: {
      provider: 'v8',                 // 'v8' | 'istanbul'
      reporter: ['text', 'html', 'json'],
      thresholds: { lines: 80, functions: 80, branches: 75 },
    },
  },
})
```

**Key defaults:** pool=`'forks'`, environment=`'node'`, timeout=5000ms, globals=`false`.

### 1.2 Mocking System

```typescript
// Module-level mock (hoisted before imports)
vi.mock('./database', () => ({
  default: { connect: vi.fn(), query: vi.fn() },
}))

// Partial mock
vi.mock('./database', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, query: vi.fn() }
})

// Non-hoisted mock (inside a test)
vi.doMock('./config', () => ({ API_URL: 'http://mock' }))
// Auto-unmock via Disposable:
using _mock = vi.doMock('./module', () => ({ get: vi.fn() }))

// Spy on object method
const spy = vi.spyOn(obj, 'method').mockReturnValue(42)

// Mock globals
vi.stubGlobal('IntersectionObserver', vi.fn())
vi.stubEnv('NODE_ENV', 'test')
vi.unstubAllGlobals()
vi.unstubAllEnvs()

// Type-safe mocked module
vi.mocked(userService.getUser).mockReturnValue({ id: 1 })
```

### 1.3 Test Lifecycle

```typescript
describe('suite', () => {
  beforeAll(async () => { /* once per suite */ })
  afterAll(async () => { /* cleanup suite */ })
  beforeEach(async () => { /* before each test */ })
  afterEach(async () => { /* after each test */ })

  // Per-test failure/finish callbacks (must be inside test)
  it('handles failure', () => {
    onTestFailed(({ errors }) => { /* screenshot, log state */ })
    onTestFinished(() => { /* always runs */ })
  })

  // Wrapper pattern
  aroundAll(async (runSuite) => { await tracer.withSpan('suite', runSuite) })
  aroundEach(async (runTest) => { await db.transaction(runTest) })
})
```

### 1.4 Parameterized & Concurrent Tests

```typescript
it.each([1, 2, 3])('value: %i', (value) => { expect(value).toBeGreaterThan(0) })

it.each`
  a    | b    | expected
  ${1} | ${1} | ${2}
`('add($a, $b) = $expected', ({ a, b, expected }) => { expect(a + b).toBe(expected) })

it.concurrent('parallel A', async () => { /* runs in parallel */ })
describe.concurrent('suite', () => { /* all tests in suite run concurrently */ })
it.skipIf(condition)('skip when', () => {})
it.fails('expected to fail', () => { expect(1).toBe(2) })
```

### 1.5 Type Testing

```typescript
import { expectTypeOf, assertType } from 'vitest'

expectTypeOf(1).toBeNumber()
expectTypeOf({ a: 1 }).toEqualTypeOf<{ a: number }>()
expectTypeOf((x: number) => x).parameters.toEqualTypeOf<[number]>()
expectTypeOf((x: number) => 'str').returns.toBeString()

assertType<Config>(config)  // compile-time only, no runtime code
```

**Config:** `typecheck: { enabled: true, checker: 'tsc' }` with `*.test-d.ts` files.

### 1.6 Workspace / Monorepo

```typescript
// vitest.workspace.ts
import { defineWorkspace } from 'vitest/config'
export default defineWorkspace([
  'packages/*',
  { test: { name: 'unit', include: ['packages/*/tests/unit/**'], environment: 'node' } },
  { test: { name: 'browser', include: ['packages/*/tests/browser/**'], environment: 'jsdom' } },
])

// Per-package config
import { defineProject } from 'vitest/config'
export default defineProject({ test: { name: 'ui', environment: 'jsdom' } })
```

---

## 2. Testing Library — Component Testing Philosophy

### 2.1 Core Principle

> "The more your tests resemble the way your software is used, the more confidence they can give you." — Kent C. Dodds

- Deal with DOM nodes, not component instances
- Never call `.state()`, `.props()`, or `.instance()`
- Refactoring without behavior change should not break tests
- Accessibility-first queries encourage accessible markup

### 2.2 Query Priority (highest to lowest)

```typescript
// 1. getByRole — user-facing, accessibility-driven
screen.getByRole('button', { name: /submit/i })
screen.getByRole('textbox', { name: /username/i })
screen.getByRole('heading', { name: /welcome/i })

// 2. getByLabelText — form fields with associated labels
screen.getByLabelText(/username/i)

// 3. getByPlaceholderText — inputs with placeholder
screen.getByPlaceholderText(/search/i)

// 4. getByText — non-interactive elements
screen.getByText(/hello world/i)

// 5. getByDisplayValue — pre-filled form values
screen.getByDisplayValue(/john/i)

// 6. getByAltText — images with alt text
screen.getByAltText(/logo/i)

// 7. getByTitle — title attribute (not screenreader-friendly)

// 8. getByTestId — last resort (not user-facing)
screen.getByTestId('submit-button')
```

### 2.3 Query Variants

```typescript
// getBy* — throws if 0 or >1 matches
// queryBy* — null if 0 matches, throws if >1
// findBy* — async retry (default 1000ms), throws if 0 or >1
// getAllBy*, queryAllBy*, findAllBy* — array variants

screen.getByText('must exist')       // throws if not found
screen.queryByText('maybe exists')   // null if not found, no throw
await screen.findByText('appears')   // async retry
screen.queryAllByRole('alert')       // [] if none, no throw
```

### 2.4 userEvent vs fireEvent

```typescript
import userEvent from '@testing-library/user-event'

// PREFFERED: userEvent — realistic browser interaction
const user = userEvent.setup()
await user.click(element)          // full click sequence (mouseOver, mouseDown, mouseUp, click)
await user.type(input, 'hello')    // focus, keyDown, keyPress, input, keyUp per char
await user.keyboard('{Enter}')
await user.clear(input)
await user.tab()                   // tab to next focusable element
await user.selectOptions(select, ['a', 'b'])
await user.hover(element)

// ONLY when userEvent doesn't support: fireEvent (low-level)
fireEvent.change(input, { target: { files: [new File(['c'], 'test.png')] } })
```

**userEvent checks visibility, disabled state, manages focus/selection. fireEvent does not.**

### 2.5 Custom Render Pattern

```typescript
// test-utils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from 'my-ui-lib'
import { MemoryRouter } from 'react-router-dom'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider theme="light">
      <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
    </ThemeProvider>
  )
}

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// In tests:
import { render, screen } from '../test-utils'
```

### 2.6 Async Utilities

```typescript
// waitFor — retries callback until it stops throwing
await waitFor(() => {
  expect(screen.getByText(/loaded/i)).toBeInTheDocument()
}, { timeout: 5000, interval: 100 })

// waitForElementToBeRemoved — efficient via MutationObserver
await waitForElementToBeRemoved(() => screen.queryByText(/loading/i))

// findBy* is shorthand for waitFor + getBy
const element = await screen.findByText(/loaded/i)
```

### 2.7 jest-dom Matchers

```typescript
import '@testing-library/jest-dom/vitest'

expect(el).toBeInTheDocument()
expect(el).toBeVisible()
expect(el).toBeDisabled()
expect(el).toBeEnabled()
expect(el).toBeEmptyDOMElement()
expect(el).toBeChecked()
expect(el).toBeRequired()
expect(el).toBeInvalid()
expect(el).toBeValid()
expect(el).toHaveFocus()
expect(el).toHaveTextContent(/hello/i)
expect(el).toHaveAttribute('href', '/home')
expect(el).toHaveClass('btn', 'primary')
expect(el).toHaveStyle('display: none')
expect(el).toHaveValue('test')
expect(el).toHaveAccessibleName('Submit')
expect(element).toContainElement(child)
expect(form).toHaveFormValues({ name: 'John' })
```

### 2.8 MSW Integration

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw'
export const handlers = [
  http.get('/api/user', () => HttpResponse.json({ id: 1, name: 'John' })),
]

// setup file
import { setupServer } from 'msw/node'
const server = setupServer(...handlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// In test — override handler
server.use(http.get('/api/user', () => HttpResponse.json(null, { status: 500 })))
```

---

## 3. Playwright — E2E Testing

### 3.1 Configuration

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixels: 10 } },
})
```

### 3.2 Locator Strategy

```typescript
// PREFFERED: role locators (user-facing, accessibility-driven)
await page.getByRole('button', { name: 'Sign in' }).click()
await page.getByRole('heading', { name: 'Sign up' }).toBeVisible()
await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com')
await page.getByRole('checkbox', { name: 'Subscribe' }).check()
await page.getByRole('link', { name: /learn more/i }).click()

// Form fields
await page.getByLabel('Password').fill('secret')
await page.getByPlaceholder('name@example.com').fill('user@example.com')

// Non-interactive
await page.getByText('Welcome, John').toBeVisible()
await page.getByText(/welcome, [A-Za-z]+$/i).toBeVisible()

// LAST RESORT
await page.getByTestId('directions').click()

// Filtering / chaining
await page.getByRole('listitem').filter({ hasText: 'Product 2' }).getByRole('button').click()
await page.getByRole('button').and(page.getByTitle('Subscribe'))
const button = page.getByRole('button', { name: 'New' }).or(page.getByText('Confirm'))
```

**Custom test ID attribute:** `testIdAttribute: 'data-pw'` in config.

### 3.3 Web-First Assertions (Auto-Retry)

```typescript
// Visibility & state
await expect(locator).toBeVisible()
await expect(locator).toBeHidden()
await expect(locator).toBeEnabled()
await expect(locator).toBeDisabled()
await expect(locator).toBeChecked()
await expect(locator).toBeFocused()
await expect(locator).toBeAttached()
await expect(locator).toBeInViewport()

// Text content
await expect(locator).toHaveText('Submitted')
await expect(locator).toHaveText(/partial/)
await expect(locator).toContainText('partial')

// Page-level
await expect(page).toHaveTitle(/Playwright/)
await expect(page).toHaveURL('**/checkout')
await expect(page).toHaveScreenshot()

// Other
await expect(response).toBeOK()
await expect(input).toHaveValue('user@example.com')
await expect(locator).toHaveAttribute('href', '/home')
await expect(locator).toHaveClass(/active/)
await expect(locator).toHaveCSS('display', 'flex')

// Soft assertions (don't terminate test)
await expect.soft(page.getByTestId('status')).toHaveText('Success')
await expect.configure({ soft: true })(locator).toHaveText('Done')

// Polling custom code
await expect.poll(async () => {
  const res = await page.request.get('https://api.example.com')
  return res.status()
}, { timeout: 10000 }).toBe(200)

// Retry code blocks
await expect(async () => {
  const res = await page.request.get('...')
  expect(res.status()).toBe(200)
}).toPass({ timeout: 30000 })
```

### 3.4 Fixtures

```typescript
import { test as base } from '@playwright/test'

// Custom fixture
type MyFixtures = { todoPage: TodoPage }
export const test = base.extend<MyFixtures>({
  todoPage: async ({ page }, use) => {
    const todoPage = new TodoPage(page)
    await todoPage.goto()
    await todoPage.addToDo('item1')
    await use(todoPage)           // test receives todoPage
    await todoPage.removeAll()    // teardown
  },
})

// Worker-scoped fixture (shared across all tests in worker)
export const test = base.extend<{}, { account: Account }>({
  account: [async ({ browser }, use, workerInfo) => {
    const user = 'user' + workerInfo.workerIndex
    await use({ username: user, password: 'secret' })
  }, { scope: 'worker' }],
})

// Auto fixture (runs for every test even if not requested)
export const test = base.extend<{ saveLogs: void }>({
  saveLogs: [async ({}, use, testInfo) => {
    const logs: string[] = []
    debug.log = (...args) => logs.push(args.join(''))
    await use()
    if (testInfo.status !== testInfo.expectedStatus) {
      await fs.writeFile(testInfo.outputPath('logs.txt'), logs.join('\n'))
    }
  }, { auto: true }],
})

// Option fixtures (configurable per project)
type MyOptions = { defaultItem: string }
export const test = base.extend<MyOptions & MyFixtures>({
  defaultItem: ['Something nice', { option: true }],
  todoPage: async ({ page, defaultItem }, use) => {
    const todoPage = new TodoPage(page)
    await todoPage.goto()
    await todoPage.addToDo(defaultItem)
    await use(todoPage)
  },
})

// Merging fixtures from multiple modules
export const test = mergeTests(dbTest, a11yTest)

export { expect } from '@playwright/test'
```

### 3.5 Authentication

```typescript
// Setup project: tests/auth.setup.ts
import { test as setup } from '@playwright/test'
const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  await page.goto('https://github.com/login')
  await page.getByLabel('Username or email address').fill('username')
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('https://github.com/')
  await page.context().storageState({ path: authFile })
})

// playwright.config.ts
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
    dependencies: ['setup'],
  },
]
```

### 3.6 Network Mocking

```typescript
// Fulfill with mock data
await page.route('**/api/fetch_data', route => {
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ msg: 'mocked' }) })
})

// Modify real response
await page.route('**/api/users', async route => {
  const response = await route.fetch()
  let body = await response.text()
  body = body.replace('Original', 'Modified')
  route.fulfill({ response, body, headers: { ...response.headers(), 'x-modified': 'true' } })
})

// Block resources
await page.route(/(png|jpeg)$/, route => route.abort())

// Wait for specific response
const responsePromise = page.waitForResponse('**/api/fetch_data')
await page.getByText('Update').click()
const response = await responsePromise
```

### 3.7 API Testing

```typescript
test('api test', async ({ request }) => {
  const res = await request.post('https://api.github.com/repos/user/repo/issues', {
    data: { title: '[Bug] report 1', body: 'Bug description' },
  })
  expect(res.ok()).toBeTruthy()
  expect(await res.json()).toMatchObject({ title: '[Bug] report 1' })
})

// Standalone context
const ctx = await request.newContext({
  baseURL: 'https://api.github.com',
  extraHTTPHeaders: { 'Authorization': `token ${process.env.API_TOKEN}` },
})
const res = await ctx.get('/repos/user/repo')
await ctx.dispose()
```

### 3.8 Visual Regression

```typescript
await expect(page).toHaveScreenshot()
await expect(page.locator('.hero__title')).toHaveScreenshot()
await expect(page).toHaveScreenshot({ maxDiffPixels: 100, threshold: 0.2, animations: 'disabled' })
```

### 3.9 Component Testing

```typescript
import { test, expect } from '@playwright/experimental-ct-react'

test('event should work', async ({ mount }) => {
  let clicked = false
  const component = await mount(<Button title="Submit" onClick={() => { clicked = true }} />)
  await expect(component).toContainText('Submit')
  await component.click()
  expect(clicked).toBeTruthy()
})
```

### 3.10 CI & Sharding

```yaml
- run: npx playwright test --shard=${{ matrix.shard }}
- run: npx playwright merge-reports --reporter html ./blob-report
```

```typescript
// CI-optimized config
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: !!process.env.CI,
  use: { trace: process.env.CI ? 'on-first-retry' : 'on' },
})
```

---

## 4. Cypress — In-Browser E2E

### 4.1 Architecture

- **In-process:** runs inside the browser alongside the app
- **Command queue:** commands enqueued serially, run after test function exits
- **No async/await:** chain-based API preserves retry-ability
- **Queries auto-retry, actions execute once**
- **No command racing** — all execution is serial

```typescript
it('creates a post', () => {
  cy.visit('/posts/new')
  cy.get('input.post-title').type('My First Post')
    .should('have.value', 'My First Post')
})
// Test function exits → Cypress dequeues commands in order
```

### 4.2 Command Chaining

```typescript
cy.get('[data-testid="submit"]')     // query (auto-retry)
  .find('.icon')                     // traverse
  .should('be.visible')              // assertion (retries with chain)
  .click()                           // action (executes once)

cy.contains('Submit')                // by text
cy.contains('.card', 'Read more')    // scoped to .card

cy.get('.list').find('li').first().should('have.class', 'active')
cy.get('.my-selector').as('myElement')
cy.get('@myElement').click()         // re-queries each time
```

### 4.3 Assertions

```typescript
cy.get('button').should('be.visible')
cy.get('button').should('be.enabled')
cy.get('button').should('be.focused')
cy.get('.modal').should('not.exist')
cy.get('h1').should('have.text', 'Welcome')
cy.get('.alert').should('contain', 'Error')
cy.get('li').should('have.length', 5)
cy.get('input').should('have.class', 'form-control')
cy.get('input').should('have.value', 'user@example.com')
cy.get('a').should('have.attr', 'href', '/profile')
cy.get('img').should('have.attr', 'src').and('include', 'logo')
cy.get('.completed').should('have.css', 'text-decoration', 'line-through')

// Chaining assertions
cy.get('button').should('be.visible').and('have.class', 'primary').and('contain', 'Submit')

// Callback retry
cy.get('[data-testid="number"]').should(($div) => {
  expect(parseFloat($div.text())).to.be.gte(1).and.be.lte(10)
})
```

### 4.4 Custom Commands

```typescript
// Parent command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('input[name=email]').type(email)
  cy.get('input[name=password]').type(password)
  cy.get('button[type=submit]').click()
})

// Child command
Cypress.Commands.add('console', { prevSubject: 'element' }, (subject, method = 'log') => {
  console[method]('Subject:', subject)
  return subject
})

// Dual command (optional subject)
Cypress.Commands.add('dismiss', { prevSubject: 'optional' }, (subject) => {
  if (subject) cy.wrap(subject).click('.close-btn')
  else cy.get('.dialog .close-btn').click()
})

// TypeScript declaration
declare global {
  namespace Cypress {
    interface Chainable { login(email: string, password: string): Chainable<void> }
  }
}
```

### 4.5 cy.intercept() — Network Control

```typescript
// Spying
cy.intercept('GET', '/api/users').as('getUsers')
cy.visit('/users')
cy.wait('@getUsers').its('response.statusCode').should('eq', 200)

// Stubbing
cy.intercept('GET', '/api/users', { fixture: 'users.json' })
cy.intercept('POST', '/api/update', 'success')
cy.intercept('GET', '/api/users', { statusCode: 200, body: [{ id: 1 }], delay: 100 })

// Dynamic handler
cy.intercept('POST', '/api/login', (req) => {
  expect(req.body).to.include('email')
  req.headers['x-custom'] = 'added-by-interceptor'
  req.reply({ statusCode: 200, body: { token: 'fake' } })
})

// Modify real response
cy.intercept('GET', '/api/projects', (req) => {
  req.continue((res) => {
    res.body.projects = res.body.projects.slice(0, 5)
    res.send()
  })
})

// Network error
cy.intercept('GET', '/api/fragile', { forceNetworkError: true })

// Multiple intercepts
cy.get('@getItems.all')  // array of all matches
cy.get('@getItems.1')    // 1-indexed
```

### 4.6 Cypress Studio

- Record interactions via real browser clicks
- AI suggests assertions based on DOM changes
- Selector priority: `data-cy` > `data-test` > `data-testid` > `data-qa` > `name` > `id` > `class`
- E2E only, no cross-origin/iframe support

### 4.7 App Actions Pattern (replaces Page Objects)

Cypress team **does not recommend** Page Objects. Instead:

```typescript
// ❌ Not recommended: Page Objects
class LoginPage { /* breaks retry-ability, adds abstraction */ }

// ✅ Recommended: App Actions via custom commands
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login')
  cy.get('input[name=email]').type(email)
  cy.get('input[name=password]').type(password)
  cy.get('button[type=submit]').click()
})

// Or per-spec helper functions
const createTodo = (text: string) => { cy.get('.new-todo').type(`${text}{enter}`) }
```

### 4.8 Component Testing

```typescript
import { mount } from 'cypress/react'

it('renders and handles click', () => {
  const onClick = cy.stub().as('clickHandler')
  mount(<Button onClick={onClick}>Click me</Button>)
  cy.get('button').should('contain', 'Click me').click()
  cy.get('@clickHandler').should('have.been.calledOnce')
})
```

### 4.9 Cypress vs Playwright

| Dimension | Cypress | Playwright |
|-----------|---------|------------|
| Execution | In-process | Out-of-process |
| API | Chain-based, no async/await | Promise-based, full async/await |
| Retry | Automatic on queries | Web-first assertions auto-wait |
| Multi-tab | Requires `cy.origin()` | Native support |
| Mobile | Viewport only | Device presets |
| Debugging | Time-travel command log + snapshots | Trace Viewer (post-run) |
| Languages | JS/TS | JS/TS, Python, Java, .NET |
| Visual testing | Via plugins | Built-in `toHaveScreenshot()` |

---

## 5. Cross-Cutting Patterns

### 5.1 Test File Structure

```
src/
  __tests__/           # Vitest convention
  components/
    Button/
      Button.tsx
      Button.test.tsx  # Co-located
      Button.cy.tsx    # Cypress component test
tests/
  e2e/                 # Playwright / Cypress E2E
    auth.setup.ts
    login.spec.ts
  utils/
    test-utils.tsx     # Custom render
    fixtures.ts        # Shared fixtures
    handlers.ts        # MSW handlers
```

### 5.2 Setup File Patterns

```typescript
// Vitest setup: src/test/setup.ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
afterEach(() => cleanup())

// Vitest global setup: src/test/global-setup.ts
export async function setup() { /* start server, seed DB */ }
export async function teardown() { /* cleanup */ }

// Playwright global setup: tests/global-setup.ts
export default async function() { /* one-time setup */ }
```

### 5.3 Environment Configuration

| Pattern | Vitest | Playwright | Cypress |
|---------|--------|------------|---------|
| Environment | `environment: 'jsdom'` | N/A (real browser) | N/A (real browser) |
| Dev server | N/A | `webServer` config | `baseUrl` + external |
| Timeout | `testTimeout: 5000` | `timeout: 30000` | `defaultCommandTimeout: 4000` |
| Retries | `retry: 2` | `retries: 2` | `retries: { runMode: 2 }` |
| Parallel | `fileParallelism: true` | `fullyParallel: true` | `--parallel` (Cloud) |
| Coverage | Built-in | `@playwright/test` + `nyc` | `@cypress/code-coverage` |

### 5.4 Testing Decision Matrix

| Scenario | Tool | Priority |
|----------|------|----------|
| Unit test pure functions | Vitest | Default |
| React component behavior | Testing Library + Vitest | Default |
| React component visual | Playwright CT or Storybook + Chromatic | Medium |
| E2E critical paths | Playwright | Default |
| Long E2E suite | Playwright (faster arch) | High |
| Time-travel debugging | Cypress | If debug UX matters |
| API integration | Vitest + MSW or Playwright `request` | Equal |
| Visual regression | Playwright `toHaveScreenshot` | Medium |
| Type-level tests | Vitest `expectTypeOf` | Low (but cheap) |
| In-browser component test | Playwright CT or Cypress CT | Medium |

---

## Key Decisions

- **Vitest** for unit + integration (fast, Jest-compatible, type testing, coverage)
- **Testing Library** for component tests (user-centric queries, accessibility-first)
- **Playwright** for E2E (fastest, best cross-browser, built-in visual diff, sharding)
- **Cypress** when time-travel debugging UX is critical (developer experience over speed)
- **userEvent over fireEvent** — realistic interaction simulation always
- **getByRole as default query** — tests accessibility + user perception simultaneously
- **Custom render** with wrapped providers for component tests (never repeat provider setup)
- **Fixtures** over page objects — Playwright's fixture system is composable, typed, scoped
- **App actions** over page objects in Cypress — custom commands are simpler and preserve retry-ability
- **MSW** for network mocking — intercepts at network level, no `fetch`/`axios` patching
- **Type tests** in `*.test-d.ts` with `expectTypeOf` — compile-time safety at low cost
- **Session reuse** via `storageState` (Playwright) or `cy.session()` — 10-100x faster auth in E2E
