import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = process.cwd()

test('app router shell is present without migrating route pages yet', () => {
  const appLayout = fs.readFileSync(path.join(root, 'app/layout.js'), 'utf8')
  const pagesApp = fs.readFileSync(path.join(root, 'pages/_app.js'), 'utf8')
  const providers = fs.readFileSync(path.join(root, 'components/providers/AppProviders.js'), 'utf8')

  assert.match(appLayout, /AppProviders/)
  assert.match(appLayout, /metadata/)
  assert.match(pagesApp, /AppProviders/)
  assert.match(providers, /SessionProvider/)
  assert.match(providers, /CartProvider/)
  assert.match(providers, /Navbar/)
})
