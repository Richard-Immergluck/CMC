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
  'Ravel',
  'Faure',
  'Elgar',
  'Clara Schumann',
  'Smyth',
  'Coleridge-Taylor',
  'Price',
  'Dvorak',
  'Saint-Saens',
  'Vaughan Williams',
  'Holst'
]

const forms = [
  'Warmup Study',
  'Phrase Study',
  'Cadence Study',
  'Aria Reduction',
  'Sonata Excerpt',
  'Sight-Reading Drill',
  'Concerto Cue',
  'Recital Tempo Track',
  'Audition Cut',
  'Practice Tempo Pass',
  'Chamber Cue Study',
  'Ensemble Balance Track',
  'Orchestral Reduction',
  'Vocal Line Support',
  'Exam Rehearsal Track',
  'Slow Practice Pass'
]

const keys = [
  'C major',
  'D minor',
  'E-flat major',
  'F major',
  'G minor',
  'A major',
  'B-flat major',
  'C-sharp minor',
  'E minor',
  'F-sharp minor',
  'A-flat major',
  'B minor'
]

const instrumentations = [
  'Piano guide tone',
  'String reduction',
  'Woodwind cue',
  'Practice orchestra',
  'Piano and click reference',
  'Chamber reduction',
  'Piano, violin, cello',
  'Piano, flute, oboe, clarinet',
  'Full orchestra reduction',
  'Voice and piano rehearsal',
  'Soloist with piano reduction',
  'Brass and timpani cue',
  'Piano trio reduction',
  'String quartet guide'
]

const createSlug = value => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

export const demoCatalogueTracks = Array.from({ length: 100 }, (_, index) => {
  const composer = composers[index % composers.length]
  const form = forms[index % forms.length]
  const key = keys[index % keys.length]
  const instrumentation = instrumentations[index % instrumentations.length]
  const opusNumber = 12 + index
  const priceTiers = [0, 199, 299, 299, 499, 499, 699]
  const pricePence = priceTiers[index % priceTiers.length]
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
    durationSeconds: 90 + (index % 16) * 18,
    pricePence,
    formattedPrice: `GBP ${(pricePence / 100).toFixed(2)}`,
    downloadCount: (index * 7) % 64,
    additionalInfo:
      'Synthetic CC0 catalogue fixture generated for development, smoke testing, search, comments, requests, and scrolling checks.'
  }
})

export const demoCatalogueFixtureMap = demoCatalogueTracks.reduce((fixtures, track) => {
  fixtures[`${track.slug}.wav`] = {
    frequency: track.frequency,
    seconds: track.seconds
  }

  return fixtures
}, {})
