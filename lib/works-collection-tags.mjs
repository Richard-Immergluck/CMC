export const maxWorksCollectionTags = 3

export const worksCollectionTags = [
  {
    description: 'Opera rehearsal material, including complete works and role-led collections.',
    label: 'Opera',
    slug: 'opera'
  },
  {
    description: 'Collections centred on solo arias or substantial vocal numbers.',
    label: 'Arias',
    slug: 'arias'
  },
  {
    description: 'Recitative, dialogue-led and recitative-plus-aria rehearsal material.',
    label: 'Recitatives',
    slug: 'recitatives'
  },
  {
    description: 'German-language art song and related repertoire.',
    label: 'Lieder',
    slug: 'lieder'
  },
  {
    description: 'French art song and mélodie repertoire.',
    label: 'French mélodie',
    slug: 'french-melodie'
  },
  {
    description: 'English-language art song and song collections.',
    label: 'English song',
    slug: 'english-song'
  },
  {
    description: 'Oratorio, sacred drama and concert vocal repertoire.',
    label: 'Oratorio',
    slug: 'oratorio'
  },
  {
    description: 'Instrumental movements, reductions and ensemble rehearsal material.',
    label: 'Instrumental',
    slug: 'instrumental'
  },
  {
    description: 'Curated vocal anthologies containing repertoire by one or more composers.',
    label: 'Vocal anthologies',
    slug: 'vocal-anthologies'
  },
  {
    description: 'Technical exercises, vocalises, warmups and structured learning material.',
    label: 'Warmups & study',
    slug: 'warmups-study'
  }
]

export const worksCollectionTagSlugs = worksCollectionTags.map(tag => tag.slug)

export const worksCollectionTagLabels = Object.fromEntries(
  worksCollectionTags.map(tag => [tag.slug, tag.label])
)

export const worksCollectionBrowseCategories = [
  {
    label: 'Opera',
    slug: 'opera',
    tagSlug: 'opera'
  },
  {
    label: 'Arias',
    slug: 'arias',
    tagSlug: 'arias'
  },
  {
    catalogueType: 'SONG_CYCLE',
    label: 'Song cycles',
    slug: 'song-cycles'
  },
  {
    label: 'Lieder',
    slug: 'lieder',
    tagSlug: 'lieder'
  },
  {
    label: 'French mélodie',
    slug: 'french-melodie',
    tagSlug: 'french-melodie'
  },
  {
    label: 'English song',
    slug: 'english-song',
    tagSlug: 'english-song'
  },
  {
    label: 'Oratorio',
    slug: 'oratorio',
    tagSlug: 'oratorio'
  },
  {
    label: 'Instrumental',
    slug: 'instrumental',
    tagSlug: 'instrumental'
  },
  {
    label: 'Learning',
    slug: 'learning',
    tagSlug: 'warmups-study'
  }
]

export const getWorksCollectionBrowseCategory = slug => (
  worksCollectionBrowseCategories.find(category => category.slug === slug) || null
)
