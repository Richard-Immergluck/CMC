const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

const previewHost = 'classical-music-catalogue-richardimmerglucks-projects.vercel.app'
const productionHost = 'classical-music-catalogue.vercel.app'

const expectedByFile = {
  'ENVIRONMENT_MATRIX.md': {
    previewHost,
    productionHost,
    previewDatabase: 'CMBC Development',
    productionDatabase: 'CMBC Production',
    previewBranch: '`dev`',
    productionBranch: '`master`'
  },
  'RELEASE_GATES.md': {
    previewHost,
    productionHost,
    previewCallback: `https://${previewHost}/api/auth/callback/google`,
    productionCallback: `https://${productionHost}/api/auth/callback/google`,
    previewSmokeCommand: `SMOKE_BASE_URL=https://${previewHost} yarn smoke`,
    randomPreviewHardStop: 'A random Vercel Preview deployment URL is shared for OAuth HITL testing'
  }
}

const docs = {
  'ENVIRONMENT_MATRIX.md': fs.readFileSync(path.join(root, 'ENVIRONMENT_MATRIX.md'), 'utf8'),
  'RELEASE_GATES.md': fs.readFileSync(path.join(root, 'RELEASE_GATES.md'), 'utf8')
}

const fail = message => {
  console.error(`Deployment alias policy check failed: ${message}`)
  process.exitCode = 1
}

for (const [file, expectations] of Object.entries(expectedByFile)) {
  const contents = docs[file]

  for (const [name, value] of Object.entries(expectations)) {
    if (!contents.includes(value)) {
      fail(`${file} is missing ${name}: ${value}`)
    }
  }
}

const matrix = docs['ENVIRONMENT_MATRIX.md']
const releaseGates = docs['RELEASE_GATES.md']

if (!matrix.includes('| `dev` | Preview | `CMBC Development` |')) {
  fail('ENVIRONMENT_MATRIX.md must map dev to Preview and CMBC Development')
}

if (!matrix.includes('| `master` | Production | `CMBC Production` |')) {
  fail('ENVIRONMENT_MATRIX.md must map master to Production and CMBC Production')
}

if (process.exitCode) {
  process.exit()
}

console.log('Deployment alias policy checks passed')
