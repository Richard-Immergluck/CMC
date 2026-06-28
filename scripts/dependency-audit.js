const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const packageJson = require(path.join(root, 'package.json'))

const sourceDirs = ['app', 'components', 'lib', 'pages', 'scripts']
const importPattern =
  /(?:import\s+(?:[^'"]+\s+from\s+)?['"]([^'".][^'"]*)['"]|require\(\s*['"]([^'".][^'"]*)['"]\s*\))/g

const ignoredBuiltins = new Set(['fs', 'path'])
const intentionalRuntimeDependencies = new Set([
  // NextAuth's email provider loads nodemailer as an optional package.
  'nodemailer'
])

const packageNameFor = specifier => {
  if (specifier.startsWith('/')) {
    return null
  }

  if (specifier.startsWith('@')) {
    return specifier.split('/').slice(0, 2).join('/')
  }

  return specifier.split('/')[0]
}

const walk = dir => {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      return walk(fullPath)
    }

    return fullPath
  })
}

const sourceFiles = sourceDirs.flatMap(dir => {
  const fullPath = path.join(root, dir)

  return fs.existsSync(fullPath) ? walk(fullPath) : []
})
const usedPackages = new Set()

for (const file of sourceFiles) {
  if (!file.endsWith('.js') && !file.endsWith('.mjs')) {
    continue
  }

  const contents = fs.readFileSync(file, 'utf8')
  let match

  while ((match = importPattern.exec(contents))) {
    const specifier = match[1] || match[2]

    if (!specifier) {
      continue
    }

    const packageName = packageNameFor(specifier)

    if (packageName && !ignoredBuiltins.has(packageName)) {
      usedPackages.add(packageName)
    }
  }
}

for (const packageName of intentionalRuntimeDependencies) {
  usedPackages.add(packageName)
}

const declaredPackages = new Set([
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.devDependencies || {})
])

const missing = [...usedPackages].filter(packageName => !declaredPackages.has(packageName))
const unused = [...Object.keys(packageJson.dependencies || {})].filter(
  packageName => !usedPackages.has(packageName)
)

const report = {
  usedPackages: [...usedPackages].sort(),
  missing: missing.sort(),
  unusedDependencies: unused.sort()
}

console.log(JSON.stringify(report, null, 2))

if (missing.length > 0) {
  process.exitCode = 1
}
