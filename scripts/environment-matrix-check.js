const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8')
const matrix = fs.readFileSync(path.join(root, 'ENVIRONMENT_MATRIX.md'), 'utf8')

const envVars = Array.from(envExample.matchAll(/^([A-Z0-9_]+)=/gm), match => match[1])

const fail = message => {
  console.error(`Environment matrix check failed: ${message}`)
  process.exitCode = 1
}

for (const envVar of envVars) {
  if (!matrix.includes(`\`${envVar}\``)) {
    fail(`ENVIRONMENT_MATRIX.md is missing ${envVar}`)
  }
}

for (const requiredPhrase of [
  'CMBC Development',
  'CMBC Production',
  'classical-music-catalogue-richardimmerglucks-projects.vercel.app',
  'classical-music-catalogue.vercel.app',
  'Do not point Preview at `CMBC Production`',
  'Do not point Production at `CMBC Development`'
]) {
  if (!matrix.includes(requiredPhrase)) {
    fail(`ENVIRONMENT_MATRIX.md is missing required guidance: ${requiredPhrase}`)
  }
}

if (process.exitCode) {
  process.exit()
}

console.log('Environment matrix checks passed')
