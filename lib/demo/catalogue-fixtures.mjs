const composers = [
  'Bach',
  'Mozart',
  'Beethoven',
  'Schubert',
  'Mendelssohn',
  'Chopin',
  'Brahms',
  'Tchaikovsky',
  'Debussy',
  'Ravel'
]

const forms = [
  'Warmup Study',
  'Phrase Study',
  'Cadence Study',
  'Aria Reduction',
  'Sonata Excerpt',
  'Sight-Reading Drill',
  'Concerto Cue',
  'Recital Tempo Track'
]

const keys = [
  'C major',
  'D minor',
  'E-flat major',
  'F major',
  'G minor',
  'A major',
  'B-flat major',
  'C-sharp minor'
]

const instrumentations = [
  'Piano guide tone',
  'String reduction',
  'Woodwind cue',
  'Practice orchestra',
  'Piano and click reference',
  'Chamber reduction'
]

const createSlug = value => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

export const demoCatalogueTracks = Array.from({ length: 50 }, (_, index) => {
  const composer = composers[index % composers.length]
  const form = forms[index % forms.length]
  const key = keys[index % keys.length]
  const instrumentation = instrumentations[index % instrumentations.length]
  const opusNumber = 12 + index
  const pricePence = 249 + (index % 6) * 75
  const title = `${composer} ${form} Op. ${opusNumber}`
  const slug = createSlug(title)

  return {
    slug,
    title,
    composer: `${composer} Style Synthetic Fixture`,
    frequency: 196 + (index % 12) * 22,
    seconds: 10 + (index % 4),
    key,
    instrumentation,
    durationSeconds: 90 + (index % 9) * 15,
    pricePence,
    formattedPrice: `GBP ${(pricePence / 100).toFixed(2)}`,
    additionalInfo:
      'Synthetic CC0 catalogue fixture generated for development, smoke testing, search, and scrolling checks.'
  }
})

export const demoCatalogueFixtureMap = demoCatalogueTracks.reduce((fixtures, track) => {
  fixtures[`${track.slug}.wav`] = {
    frequency: track.frequency,
    seconds: track.seconds
  }

  return fixtures
}, {})
