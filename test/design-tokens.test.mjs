import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const readSource = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')

const semanticVariables = [
  '--cmc-theme-page-background',
  '--cmc-theme-heading',
  '--cmc-theme-table-header-background',
  '--cmc-theme-table-header-border',
  '--cmc-theme-table-header-text',
  '--cmc-theme-table-border',
  '--cmc-theme-section-background'
]

const componentVariables = [
  '--cmc-component-control-height-sm',
  '--cmc-component-control-height-md',
  '--cmc-component-control-height-lg',
  '--cmc-component-control-radius',
  '--cmc-component-control-border',
  '--cmc-component-control-background',
  '--cmc-component-control-text',
  '--cmc-component-button-primary-background',
  '--cmc-component-button-primary-border',
  '--cmc-component-button-primary-text',
  '--cmc-component-button-secondary-background',
  '--cmc-component-button-secondary-border',
  '--cmc-component-button-secondary-text',
  '--cmc-component-button-danger-background',
  '--cmc-component-panel-background',
  '--cmc-component-panel-border',
  '--cmc-component-panel-accent-border',
  '--cmc-component-table-row-hover-background',
  '--cmc-component-table-row-border'
]

const extractCssBlock = (source, selector) => {
  const selectorStart = source.indexOf(selector)
  assert.notEqual(selectorStart, -1, `Missing CSS selector ${selector}`)

  const blockStart = source.indexOf('{', selectorStart)
  const blockEnd = source.indexOf('}', blockStart)

  assert.notEqual(blockStart, -1, `Missing opening block for ${selector}`)
  assert.notEqual(blockEnd, -1, `Missing closing block for ${selector}`)

  return source.slice(blockStart, blockEnd)
}

test('theme semantic variables are defined for default and dark palettes', () => {
  const tokensCss = readSource('styles/tokens.css')
  const rootBlock = extractCssBlock(tokensCss, ':root')
  const darkBlock = extractCssBlock(tokensCss, "[data-cmc-theme='dark']")

  for (const variable of semanticVariables) {
    assert.match(rootBlock, new RegExp(`${variable}:`), `${variable} must be defined in :root`)
    assert.match(darkBlock, new RegExp(`${variable}:`), `${variable} must be overridden by the dark theme`)
  }
})

test('javascript design tokens expose every semantic theme variable', () => {
  const tokenSource = readSource('lib/design/tokens.js')

  for (const variable of semanticVariables) {
    assert.match(tokenSource, new RegExp(`var\\(${variable}\\)`), `${variable} must be mirrored in lib/design/tokens.js`)
  }
})

test('component variables are tokenized and mirrored for JavaScript consumers', () => {
  const tokensCss = readSource('styles/tokens.css')
  const rootBlock = extractCssBlock(tokensCss, ':root')
  const tokenSource = readSource('lib/design/tokens.js')

  for (const variable of componentVariables) {
    assert.match(rootBlock, new RegExp(`${variable}:`), `${variable} must be defined in :root`)
    assert.match(tokenSource, new RegExp(`var\\(${variable}\\)`), `${variable} must be mirrored in lib/design/tokens.js`)
  }
})

test('theme helper exposes stable light and dark theme attributes', () => {
  const themeSource = readSource('lib/design/theme.js')

  assert.match(themeSource, /light:\s*{[\s\S]*attribute:\s*'light'/)
  assert.match(themeSource, /dark:\s*{[\s\S]*attribute:\s*'dark'/)
  assert.match(themeSource, /getThemeAttribute/)
})
