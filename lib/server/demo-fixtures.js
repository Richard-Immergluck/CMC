import { demoCatalogueFixtureMap } from '../demo/catalogue-fixtures.mjs'
import { pocCatalogueFixtureMap } from '../demo/poc-catalogue-fixtures.mjs'

const writeAscii = (buffer, offset, value) => buffer.write(value, offset, 'ascii')

const createToneWav = ({ frequency, seconds }) => {
  const sampleRate = 44100
  const channels = 1
  const bytesPerSample = 2
  const sampleCount = sampleRate * seconds
  const dataSize = sampleCount * channels * bytesPerSample
  const buffer = Buffer.alloc(44 + dataSize)

  writeAscii(buffer, 0, 'RIFF')
  buffer.writeUInt32LE(36 + dataSize, 4)
  writeAscii(buffer, 8, 'WAVE')
  writeAscii(buffer, 12, 'fmt ')
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(channels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28)
  buffer.writeUInt16LE(channels * bytesPerSample, 32)
  buffer.writeUInt16LE(8 * bytesPerSample, 34)
  writeAscii(buffer, 36, 'data')
  buffer.writeUInt32LE(dataSize, 40)

  for (let i = 0; i < sampleCount; i += 1) {
    const envelope = Math.min(1, i / 2000, (sampleCount - i) / 2000)
    const sample = Math.sin((2 * Math.PI * frequency * i) / sampleRate)
    buffer.writeInt16LE(Math.round(sample * envelope * 12000), 44 + i * 2)
  }

  return buffer
}

const demoFixtures = {
  ...demoCatalogueFixtureMap,
  ...pocCatalogueFixtureMap,
  'bach-style-warmup.wav': {
    frequency: 220,
    seconds: 12
  },
  'catalogue-navigation.wav': {
    frequency: 294,
    seconds: 12
  },
  'mozart-style-phrase.wav': {
    frequency: 330,
    seconds: 12
  },
  'romantic-cadence-study.wav': {
    frequency: 440,
    seconds: 12
  }
}

export const syntheticFixturesEnabled = () => process.env.CMC_ENABLE_SYNTHETIC_FIXTURES === 'true'

export const getDemoFixtureName = key => {
  const fixturePrefix = ['demo-fixtures/', 'e2e-fixtures/'].find(prefix => key?.startsWith(prefix))

  if (!fixturePrefix) {
    return null
  }

  const fixtureName = key.slice(fixturePrefix.length)
  return demoFixtures[fixtureName] ? fixtureName : null
}

export const getDemoFixtureBuffer = fixtureName => {
  const fixture = demoFixtures[fixtureName]

  if (!fixture) {
    return null
  }

  return createToneWav(fixture)
}
