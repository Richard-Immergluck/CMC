import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = process.cwd()

test('app router shell and first public routes are present', () => {
  const appLayout = fs.readFileSync(path.join(root, 'app/layout.js'), 'utf8')
  const appHomePage = fs.readFileSync(path.join(root, 'app/page.js'), 'utf8')
  const appSignInPage = fs.readFileSync(path.join(root, 'app/auth/signin/page.js'), 'utf8')
  const appUploadPage = fs.readFileSync(path.join(root, 'app/upload/page.js'), 'utf8')
  const pagesApp = fs.readFileSync(path.join(root, 'pages/_app.js'), 'utf8')
  const providers = fs.readFileSync(path.join(root, 'components/providers/AppProviders.js'), 'utf8')

  assert.match(appLayout, /AppProviders/)
  assert.match(appLayout, /metadata/)
  assert.match(appHomePage, /getServerSession/)
  assert.match(appHomePage, /redirect\('\/catalogue'\)/)
  assert.match(appSignInPage, /getServerSession/)
  assert.match(appSignInPage, /SignInPageContent/)
  assert.match(appUploadPage, /UploadForm/)
  assert.match(pagesApp, /AppProviders/)
  assert.match(providers, /SessionProvider/)
  assert.match(providers, /CartProvider/)
  assert.match(providers, /Navbar/)
})
