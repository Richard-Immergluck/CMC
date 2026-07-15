const createSlug = value => value
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const workDefinitions = [
  {
    key: 'schubert-winterreise',
    title: 'Winterreise, D. 911',
    composer: 'Franz Schubert',
    catalogueType: 'SONG_CYCLE',
    pricePence: 2999,
    tracks: [
      'Gute Nacht',
      'Die Wetterfahne',
      'Gefrorne Tranen',
      'Erstarrung',
      'Der Lindenbaum',
      'Wasserflut',
      'Auf dem Flusse',
      'Ruckblick',
      'Irrlicht',
      'Rast',
      'Fruhlingstraum',
      'Einsamkeit',
      'Die Post',
      'Der greise Kopf',
      'Die Krahe',
      'Letzte Hoffnung',
      'Im Dorfe',
      'Der sturmische Morgen',
      'Tauschung',
      'Der Wegweiser',
      'Das Wirtshaus',
      'Mut',
      'Die Nebensonnen',
      'Der Leiermann'
    ]
  },
  {
    key: 'schubert-mullerin',
    title: 'Die schone Mullerin, D. 795',
    composer: 'Franz Schubert',
    catalogueType: 'SONG_CYCLE',
    pricePence: 2499,
    tracks: [
      'Das Wandern',
      'Wohin',
      'Halt',
      'Danksagung an den Bach',
      'Am Feierabend',
      'Der Neugierige',
      'Ungeduld',
      'Morgengruss',
      'Des Mullers Blumen',
      'Tranenregen',
      'Mein',
      'Pause',
      'Mit dem grunen Lautenbande',
      'Der Jager',
      'Eifersucht und Stolz',
      'Die liebe Farbe',
      'Die bose Farbe',
      'Trockne Blumen',
      'Der Muller und der Bach',
      'Des Baches Wiegenlied'
    ]
  },
  {
    key: 'schumann-dichterliebe',
    title: 'Dichterliebe, Op. 48',
    composer: 'Robert Schumann',
    catalogueType: 'SONG_CYCLE',
    pricePence: 1999,
    tracks: [
      'Im wunderschonen Monat Mai',
      'Aus meinen Tranen spriessen',
      'Die Rose, die Lilie, die Taube, die Sonne',
      'Wenn ich in deine Augen seh',
      'Ich will meine Seele tauchen',
      'Im Rhein, im heiligen Strome',
      'Ich grolle nicht',
      'Und wussten es die Blumen',
      'Das ist ein Floten und Geigen',
      'Hor ich das Liedchen klingen',
      'Ein Jungling liebt ein Madchen',
      'Am leuchtenden Sommermorgen',
      'Ich hab im Traum geweinet',
      'Allnachtlich im Traume',
      'Aus alten Marchen winkt es',
      'Die alten, bosen Lieder'
    ]
  },
  {
    key: 'schumann-frauenliebe',
    title: 'Frauenliebe und -leben, Op. 42',
    composer: 'Robert Schumann',
    catalogueType: 'SONG_CYCLE',
    pricePence: 1499,
    tracks: [
      'Seit ich ihn gesehen',
      'Er, der Herrlichste von allen',
      'Ich kanns nicht fassen, nicht glauben',
      'Du Ring an meinem Finger',
      'Helft mir, ihr Schwestern',
      'Suser Freund, du blickest',
      'An meinem Herzen, an meiner Brust',
      'Nun hast du mir den ersten Schmerz getan'
    ]
  },
  {
    key: 'rvw-songs-of-travel',
    title: 'Songs of Travel',
    composer: 'Ralph Vaughan Williams',
    catalogueType: 'SONG_CYCLE',
    pricePence: 1799,
    tracks: [
      'The Vagabond',
      'Let Beauty Awake',
      'The Roadside Fire',
      'Youth and Love',
      'In Dreams',
      'The Infinite Shining Heavens',
      'Whither Must I Wander',
      'Bright Is the Ring of Words',
      'I Have Trod the Upward and the Downward Slope'
    ]
  },
  {
    key: 'butterworth-shropshire-lad',
    title: 'Six Songs from A Shropshire Lad',
    composer: 'George Butterworth',
    catalogueType: 'SONG_CYCLE',
    pricePence: 1299,
    tracks: [
      'Loveliest of Trees',
      'When I Was One-and-Twenty',
      'Look Not in My Eyes',
      'Think No More, Lad',
      'The Lads in Their Hundreds',
      'Is My Team Ploughing'
    ]
  },
  {
    key: 'faure-bonne-chanson',
    title: 'La bonne chanson, Op. 61',
    composer: 'Gabriel Faure',
    catalogueType: 'SONG_CYCLE',
    pricePence: 1799,
    tracks: [
      'Une sainte en son aureole',
      'Puisque l aube grandit',
      'La lune blanche luit dans les bois',
      'J allais par des chemins perfides',
      'J ai presque peur, en verite',
      'Avant que tu ne t en ailles',
      'Donc, ce sera par un clair jour d ete',
      'N est-ce pas',
      'L hiver a cesse'
    ]
  },
  {
    key: 'debussy-ariettes',
    title: 'Ariettes oubliees',
    composer: 'Claude Debussy',
    catalogueType: 'SONG_CYCLE',
    pricePence: 1299,
    tracks: [
      'C est l extase langoureuse',
      'Il pleure dans mon coeur',
      'L ombre des arbres',
      'Chevaux de bois',
      'Green',
      'Spleen'
    ]
  },
  {
    key: 'ravel-greek-songs',
    title: 'Cinq melodies populaires grecques',
    composer: 'Maurice Ravel',
    catalogueType: 'SONG_CYCLE',
    pricePence: 999,
    tracks: [
      'Chanson de la mariee',
      'La-bas, vers l eglise',
      'Quel galant m est comparable',
      'Chanson des cueilleuses de lentisques',
      'Tout gai'
    ]
  },
  {
    key: 'mahler-fahrenden',
    title: 'Lieder eines fahrenden Gesellen',
    composer: 'Gustav Mahler',
    catalogueType: 'SONG_CYCLE',
    pricePence: 999,
    tracks: [
      'Wenn mein Schatz Hochzeit macht',
      'Ging heut Morgen ubers Feld',
      'Ich hab ein gluhend Messer',
      'Die zwei blauen Augen'
    ]
  },
  {
    key: 'mahler-ruckert',
    title: 'Ruckert-Lieder',
    composer: 'Gustav Mahler',
    catalogueType: 'SONG_CYCLE',
    pricePence: 999,
    tracks: [
      'Blicke mir nicht in die Lieder',
      'Ich atmet einen linden Duft',
      'Ich bin der Welt abhanden gekommen',
      'Um Mitternacht',
      'Liebst du um Schonheit'
    ]
  },
  {
    key: 'britten-on-this-island',
    title: 'On This Island, Op. 11',
    composer: 'Benjamin Britten',
    catalogueType: 'SONG_CYCLE',
    pricePence: 999,
    tracks: [
      'Let the florid music praise',
      'Now the leaves are falling fast',
      'Seascape',
      'Nocturne',
      'As it is, plenty'
    ]
  }
]

const operaGroups = [
  {
    key: 'mozart-figaro',
    workTitle: 'Le nozze di Figaro, K. 492',
    composer: 'W. A. Mozart',
    tracks: [
      'Non piu andrai',
      'Voi che sapete',
      'Porgi amor',
      'Dove sono',
      'Deh vieni, non tardar',
      'Venite, inginocchiatevi',
      'Sull aria',
      'Aprite un po quegli occhi'
    ]
  },
  {
    key: 'mozart-don-giovanni',
    workTitle: 'Don Giovanni, K. 527',
    composer: 'W. A. Mozart',
    tracks: [
      'Madamina, il catalogo e questo',
      'La ci darem la mano',
      'Batti, batti, o bel Masetto',
      'Dalla sua pace',
      'Il mio tesoro',
      'Mi tradi quell alma ingrata',
      'Fin ch han dal vino'
    ]
  },
  {
    key: 'mozart-cosi',
    workTitle: 'Cosi fan tutte, K. 588',
    composer: 'W. A. Mozart',
    tracks: [
      'Come scoglio',
      'Per pieta, ben mio',
      'Un aura amorosa',
      'Smanie implacabili',
      'Soave sia il vento',
      'In uomini, in soldati',
      'E amore un ladroncello'
    ]
  },
  {
    key: 'mozart-zauberflote',
    workTitle: 'Die Zauberflote, K. 620',
    composer: 'W. A. Mozart',
    tracks: [
      'Dies Bildnis ist bezaubernd schon',
      'Der Holle Rache',
      'Ach, ich fuhl s',
      'O Isis und Osiris',
      'Ein Madchen oder Weibchen'
    ]
  },
  {
    key: 'bizet-carmen',
    workTitle: 'Carmen',
    composer: 'Georges Bizet',
    tracks: [
      'Habanera',
      'Seguidilla',
      'Toreador Song',
      'La fleur que tu m avais jetee',
      'Je dis que rien ne m epouvante',
      'Les tringles des sistres tintaient',
      'Pres des remparts de Seville'
    ]
  },
  {
    key: 'puccini-boheme',
    workTitle: 'La boheme',
    composer: 'Giacomo Puccini',
    tracks: [
      'Che gelida manina',
      'Si, mi chiamano Mimi',
      'Quando m en vo',
      'O soave fanciulla',
      'Donde lieta usci',
      'Vecchia zimarra'
    ]
  },
  {
    key: 'verdi-traviata',
    workTitle: 'La traviata',
    composer: 'Giuseppe Verdi',
    tracks: [
      'Libiamo ne lieti calici',
      'E strano',
      'Sempre libera',
      'De miei bollenti spiriti',
      'Addio del passato'
    ]
  },
  {
    key: 'verdi-rigoletto',
    workTitle: 'Rigoletto',
    composer: 'Giuseppe Verdi',
    tracks: [
      'Questa o quella',
      'Caro nome',
      'La donna e mobile',
      'Cortigiani, vil razza dannata'
    ]
  }
]

const anthologyTracks = [
  ['Tommaso Giordani', 'Caro mio ben'],
  ['Christoph Willibald Gluck', 'O del mio dolce ardor'],
  ['Giovanni Battista Pergolesi', 'Se tu m ami'],
  ['Giulio Caccini', 'Amarilli mia bella'],
  ['Alessandro Scarlatti', 'Gia il sole dal Gange'],
  ['George Frideric Handel', 'Ombra mai fu'],
  ['George Frideric Handel', 'Lascia ch io pianga'],
  ['John Dowland', 'Come again, sweet love'],
  ['Henry Purcell', 'Music for a while'],
  ['Henry Purcell', 'Sweeter than roses']
]

const individualSongs = [
  ['Gabriel Faure', 'Apres un reve'],
  ['Henri Duparc', 'Chanson triste'],
  ['Reynaldo Hahn', 'A Chloris'],
  ['Ernest Chausson', 'Le colibri'],
  ['Richard Strauss', 'Morgen'],
  ['Hugo Wolf', 'Verborgenheit'],
  ['Franz Schubert', 'Die Forelle'],
  ['Franz Schubert', 'An die Musik'],
  ['Roger Quilter', 'Now sleeps the crimson petal'],
  ['John Ireland', 'Sea Fever'],
  ['Ivor Gurney', 'Sleep'],
  ['Frank Bridge', 'Love went a-riding']
]

const studyTracks = [
  ['Nicola Vaccai', 'Practical Method: Manca sollecita'],
  ['Nicola Vaccai', 'Practical Method: Semplicetta tortorella'],
  ['Nicola Vaccai', 'Practical Method: Lascia il lido'],
  ['Nicola Vaccai', 'Practical Method: Avvezzo a vivere'],
  ['Giuseppe Concone', '50 Lessons, Op. 9: No. 1'],
  ['Giuseppe Concone', '50 Lessons, Op. 9: No. 2'],
  ['Mathilde Marchesi', 'Vocalises, Op. 15: No. 1'],
  ['Mathilde Marchesi', 'Vocalises, Op. 15: No. 2'],
  ['W. A. Mozart', 'Voi che sapete - slow practice accompaniment'],
  ['Ralph Vaughan Williams', 'The Vagabond - lower key practice track'],
  ['Franz Schubert', 'Der Lindenbaum - slower study version'],
  ['Gabriel Faure', 'Apres un reve - cello transcription practice track']
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
  'Piano accompaniment',
  'Piano reduction with vocal cues',
  'Orchestral reduction for piano',
  'Piano and rehearsal click',
  'Piano with discreet entry cues',
  'Chamber reduction',
  'Practice orchestra reduction',
  'Piano guide with spoken count-in'
]

const priceTiers = [399, 499, 599, 699, 799]

const buildTrack = ({
  composer,
  index,
  title,
  workKey = null,
  workTitle = null,
  catalogueType = 'SINGLE_TRACK',
  collectionFamily = null
}) => {
  const displayTitle = workTitle ? `${workTitle}: ${title}` : title
  const slug = createSlug(`${composer}-${displayTitle}`)
  const pricePence = catalogueType === 'LEARNING_PACK'
    ? 299 + (index % 3) * 100
    : priceTiers[index % priceTiers.length]

  return {
    slug,
    title: displayTitle,
    titleInWork: title,
    composer,
    workKey,
    workTitle,
    collectionFamily,
    catalogueType,
    frequency: 196 + (index % 24) * 13,
    seconds: 9 + (index % 6),
    key: keys[index % keys.length],
    instrumentation: instrumentations[index % instrumentations.length],
    durationSeconds: 125 + (index % 18) * 21,
    pricePence,
    formattedPrice: `£${(pricePence / 100).toFixed(2)}`,
    downloadCount: 4 + ((index * 9) % 86),
    additionalInfo: workTitle
      ? `Rehearsal accompaniment for ${title} from ${workTitle}. Created for practice, studio teaching, and repeatable audition preparation.`
      : `Rehearsal accompaniment for ${displayTitle}. Created for practice, studio teaching, and repeatable audition preparation.`
  }
}

const workTracks = workDefinitions.flatMap(work => work.tracks.map((trackTitle, index) => ({
  ...buildTrack({
    composer: work.composer,
    index: workTracksSeedOffset(work.key) + index,
    title: trackTitle,
    workKey: work.key,
    workTitle: work.title,
    catalogueType: work.catalogueType
  })
})))

function workTracksSeedOffset(key) {
  return workDefinitions
    .slice(0, workDefinitions.findIndex(work => work.key === key))
    .reduce((total, work) => total + work.tracks.length, 0)
}

const operaTracks = operaGroups.flatMap(group => group.tracks.map((trackTitle, index) => buildTrack({
  composer: group.composer,
  index: 117 + operaGroups
    .slice(0, operaGroups.findIndex(operaGroup => operaGroup.key === group.key))
    .reduce((total, operaGroup) => total + operaGroup.tracks.length, 0) + index,
  title: trackTitle,
  workKey: group.key,
  workTitle: group.workTitle,
  catalogueType: 'OPERA_EXCERPT'
})))

const anthologyCatalogueTracks = anthologyTracks.map(([composer, title], index) => buildTrack({
  composer,
  index: 166 + index,
  title,
  workKey: 'arie-antiche',
  workTitle: 'Arie Antiche',
  catalogueType: 'COLLECTION',
  collectionFamily: 'Italian anthology'
}))

const individualCatalogueTracks = individualSongs.map(([composer, title], index) => buildTrack({
  composer,
  index: 176 + index,
  title,
  catalogueType: 'SINGLE_TRACK'
}))

const learningCatalogueTracks = studyTracks.map(([composer, title], index) => buildTrack({
  composer,
  index: 188 + index,
  title,
  workKey: index < 8 ? 'vocal-study-library' : 'fulfilled-request-library',
  workTitle: index < 8 ? 'Vocal Study Library' : null,
  catalogueType: 'LEARNING_PACK',
  collectionFamily: index < 8 ? 'Warmup accompaniment' : 'Fulfilled request upload'
}))

export const pocCatalogueTracks = [
  ...workTracks,
  ...operaTracks,
  ...anthologyCatalogueTracks,
  ...individualCatalogueTracks,
  ...learningCatalogueTracks
]

const liederWorkKeys = new Set([
  'schubert-winterreise',
  'schubert-mullerin',
  'schumann-dichterliebe',
  'schumann-frauenliebe',
  'mahler-fahrenden',
  'mahler-ruckert'
])

const frenchMelodieWorkKeys = new Set([
  'faure-bonne-chanson',
  'debussy-ariettes',
  'ravel-greek-songs'
])

const getSongCycleTagSlugs = workKey => {
  if (liederWorkKeys.has(workKey)) {
    return ['lieder']
  }

  if (frenchMelodieWorkKeys.has(workKey)) {
    return ['french-melodie']
  }

  return ['english-song']
}

const duplicateSlugs = pocCatalogueTracks
  .map(track => track.slug)
  .filter((slug, index, slugs) => slugs.indexOf(slug) !== index)

if (pocCatalogueTracks.length !== 200) {
  throw new Error(`PoC catalogue must contain exactly 200 tracks; found ${pocCatalogueTracks.length}`)
}

if (duplicateSlugs.length > 0) {
  throw new Error(`PoC catalogue contains duplicate slugs: ${duplicateSlugs.join(', ')}`)
}

export const pocReleaseDefinitions = [
  ...workDefinitions.map(work => ({
    key: work.key,
    title: work.title,
    composer: work.composer,
    catalogueType: work.catalogueType,
    saleFormat: 'BOTH',
    pricePence: work.pricePence,
    tagSlugs: getSongCycleTagSlugs(work.key),
    trackSlugs: pocCatalogueTracks
      .filter(track => track.workKey === work.key)
      .map(track => track.slug)
  })),
  ...operaGroups.flatMap(group => {
    const groupSlugs = pocCatalogueTracks
      .filter(track => track.workKey === group.key)
      .map(track => track.slug)

    return [
      {
        key: `${group.key}-complete-rehearsal-score`,
        title: `${group.workTitle} - rehearsal score excerpts`,
        composer: group.composer,
        catalogueType: 'COMPLETE_WORK',
        saleFormat: 'BOTH',
        pricePence: 1999,
        tagSlugs: ['opera', 'arias'],
        trackSlugs: groupSlugs
      },
      {
        key: `${group.key}-role-pack`,
        title: `${group.workTitle} - principal role pack`,
        composer: group.composer,
        catalogueType: 'OPERA_EXCERPT',
        saleFormat: 'BUNDLE',
        pricePence: 1199,
        tagSlugs: ['opera', 'arias'],
        trackSlugs: groupSlugs.slice(0, Math.min(4, groupSlugs.length))
      }
    ]
  }),
  {
    key: 'arie-antiche-volume-one',
    title: 'Arie Antiche - studio anthology',
    composer: 'Various composers',
    catalogueType: 'COLLECTION',
    saleFormat: 'BOTH',
    pricePence: 1499,
    tagSlugs: ['vocal-anthologies', 'arias'],
    trackSlugs: pocCatalogueTracks
      .filter(track => track.workKey === 'arie-antiche')
      .map(track => track.slug)
  },
  {
    key: 'vocal-study-library',
    title: 'Vocal Study Library - warmups and technical accompaniments',
    composer: 'Various composers',
    catalogueType: 'LEARNING_PACK',
    saleFormat: 'BUNDLE',
    pricePence: 999,
    tagSlugs: ['warmups-study'],
    trackSlugs: pocCatalogueTracks
      .filter(track => track.workKey === 'vocal-study-library')
      .map(track => track.slug)
  },
  {
    key: 'fulfilled-request-library',
    title: 'Recently fulfilled community requests',
    composer: 'Various composers',
    catalogueType: 'LEARNING_PACK',
    saleFormat: 'BOTH',
    pricePence: 999,
    tagSlugs: ['warmups-study'],
    trackSlugs: pocCatalogueTracks
      .filter(track => track.collectionFamily === 'Fulfilled request upload')
      .map(track => track.slug)
  }
]

export const pocCatalogueFixtureMap = pocCatalogueTracks.reduce((fixtures, track) => {
  fixtures[`${track.slug}.wav`] = {
    frequency: track.frequency,
    seconds: track.seconds
  }

  return fixtures
}, {})
