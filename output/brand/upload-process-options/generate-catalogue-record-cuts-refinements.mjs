import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const outputDir = new URL('.', import.meta.url)

const palette = {
  paper: '#f8f3e9',
  card: '#fffaf0',
  parchment: '#efd5ad',
  parchmentDeep: '#d19a43',
  ink: '#182025',
  muted: '#665f52',
  line: '#596765',
  teal: '#0b626b',
  gold: '#bb811a',
  red: '#94383d',
  border: 'rgba(24,32,37,0.15)'
}

const escapeXml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

const makeSvg = ({ title, markOne, markTwo, markThree }) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="760" height="520" viewBox="0 0 760 520" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <filter id="paperNoise" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" seed="42" />
      <feColorMatrix type="saturate" values="0.14" />
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.14" />
      </feComponentTransfer>
    </filter>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="11" stdDeviation="15" flood-color="#2a2012" flood-opacity="0.10" />
    </filter>
    <linearGradient id="parchment" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.parchment}" />
      <stop offset="0.58" stop-color="#f3d8ad" />
      <stop offset="1" stop-color="${palette.parchmentDeep}" />
    </linearGradient>
    <style>
      .bg { fill: ${palette.paper}; }
      .grain { filter: url(#paperNoise); opacity: 0.72; }
      .outer { fill: none; stroke: ${palette.border}; stroke-width: 1; }
      .card { fill: rgba(255,250,240,0.64); stroke: ${palette.border}; stroke-width: 1; }
      .serif { fill: ${palette.ink}; font-family: Georgia, 'Times New Roman', serif; font-size: 40px; }
      .label { fill: ${palette.red}; font: 800 13px Arial, sans-serif; letter-spacing: 4px; }
      .number { fill: ${palette.muted}; font: 800 11px Arial, sans-serif; letter-spacing: 2.2px; }
      .rule { stroke: ${palette.line}; stroke-width: 0.9; opacity: 0.22; }
    </style>
  </defs>
  <rect class="bg" width="760" height="520" />
  <rect class="grain" width="760" height="520" />
  <rect x="32" y="36" width="696" height="448" class="outer" />
  <rect x="166" y="100" width="440" height="320" class="card" filter="url(#softShadow)" />
  <rect x="118" y="74" width="74" height="372" fill="url(#parchment)" />
  <rect x="118" y="74" width="74" height="372" class="grain" />
  <text x="226" y="152" class="number">01</text>
  <text x="280" y="158" class="serif">Upload</text>
  <text x="226" y="260" class="number">02</text>
  <text x="280" y="266" class="serif">Review</text>
  <text x="226" y="368" class="number">03</text>
  <text x="280" y="374" class="serif">Publish</text>
  <line x1="222" x2="552" y1="202" y2="202" class="rule" />
  <line x1="222" x2="552" y1="310" y2="310" class="rule" />
  ${markOne}
  ${markTwo}
  ${markThree}
</svg>`

const dottedStaffMark = ({ x, y, color, activeIndex }) => `
  <g transform="translate(${x} ${y})" stroke="${color}" fill="none">
    ${Array.from({ length: 5 }, (_, index) => `<line x1="-34" x2="34" y1="${-18 + index * 9}" y2="${-18 + index * 9}" stroke-width="1.2" opacity="0.68" />`).join('')}
    ${[-21, 0, 21].map((cx, index) => `<circle cx="${cx}" cy="${-9 + index * 9}" r="${index === activeIndex ? 3.8 : 2.2}" fill="${color}" stroke="none" opacity="${index === activeIndex ? 1 : 0.62}" />`).join('')}
    <line x1="-1" x2="-1" y1="-29" y2="28" stroke-width="1.4" opacity="0.45" />
  </g>`

const catalogueCutMark = ({ x, y, color, tilt = 0 }) => `
  <g transform="translate(${x} ${y}) rotate(${tilt})" stroke="${color}" fill="none">
    ${Array.from({ length: 4 }, (_, index) => `<line x1="-35" x2="35" y1="${-18 + index * 12}" y2="${-18 + index * 12}" stroke-width="1.25" opacity="0.7" />`).join('')}
    <circle cx="-24" cy="-6" r="2.5" fill="${color}" stroke="none" />
    <circle cx="0" cy="-6" r="2.5" fill="${color}" stroke="none" opacity="0.72" />
    <circle cx="24" cy="-6" r="2.5" fill="${color}" stroke="none" opacity="0.52" />
    <path d="M-12 -28 V30 M12 -28 V30" stroke-width="1" opacity="0.36" />
  </g>`

const ledgerPulseMark = ({ x, y, color, gap = 10 }) => `
  <g transform="translate(${x} ${y})" stroke="${color}" fill="none">
    ${Array.from({ length: 5 }, (_, index) => `<line x1="-34" x2="34" y1="${-20 + index * gap}" y2="${-20 + index * gap}" stroke-width="1.15" opacity="0.62" />`).join('')}
    <path d="M-28 14 C-15 -4, -3 2, 10 -13 C18 -22, 26 -12, 32 -2" stroke-width="2" opacity="0.92" />
    <circle cx="-28" cy="14" r="2.3" fill="${color}" stroke="none" />
    <circle cx="10" cy="-13" r="2.3" fill="${color}" stroke="none" />
    <circle cx="32" cy="-2" r="2.3" fill="${color}" stroke="none" />
  </g>`

const bracketedDotsMark = ({ x, y, color, open = false }) => `
  <g transform="translate(${x} ${y})" stroke="${color}" fill="none">
    ${Array.from({ length: 5 }, (_, index) => `<line x1="-32" x2="32" y1="${-18 + index * 9}" y2="${-18 + index * 9}" stroke-width="1.1" opacity="0.58" />`).join('')}
    <path d="${open ? 'M-36 -23 V25 M36 -23 V25' : 'M-36 -23 V25 H36 V-23'}" stroke-width="1.45" opacity="0.6" />
    <circle cx="-18" cy="-9" r="2.4" fill="${color}" stroke="none" />
    <circle cx="0" cy="0" r="3.3" fill="${color}" stroke="none" />
    <circle cx="18" cy="9" r="2.4" fill="${color}" stroke="none" />
  </g>`

const variants = [
  [
    'catalogue-record-cuts-a-progressive-dots',
    makeSvg({
      title: 'A  PROGRESSIVE DOTS',
      markOne: dottedStaffMark({ x: 155, y: 145, color: palette.gold, activeIndex: 0 }),
      markTwo: dottedStaffMark({ x: 155, y: 253, color: palette.red, activeIndex: 1 }),
      markThree: dottedStaffMark({ x: 155, y: 361, color: palette.teal, activeIndex: 2 })
    })
  ],
  [
    'catalogue-record-cuts-b-ledger-cuts',
    makeSvg({
      title: 'B  LEDGER CUTS',
      markOne: catalogueCutMark({ x: 155, y: 145, color: palette.gold, tilt: -2 }),
      markTwo: catalogueCutMark({ x: 155, y: 253, color: palette.red, tilt: 0 }),
      markThree: catalogueCutMark({ x: 155, y: 361, color: palette.teal, tilt: 2 })
    })
  ],
  [
    'catalogue-record-cuts-c-wave-ledger',
    makeSvg({
      title: 'C  WAVE LEDGER',
      markOne: ledgerPulseMark({ x: 155, y: 145, color: palette.gold, gap: 8 }),
      markTwo: ledgerPulseMark({ x: 155, y: 253, color: palette.red, gap: 9 }),
      markThree: ledgerPulseMark({ x: 155, y: 361, color: palette.teal, gap: 10 })
    })
  ],
  [
    'catalogue-record-cuts-d-bracketed-records',
    makeSvg({
      title: 'D  BRACKETED RECORDS',
      markOne: bracketedDotsMark({ x: 155, y: 145, color: palette.gold, open: true }),
      markTwo: bracketedDotsMark({ x: 155, y: 253, color: palette.red, open: true }),
      markThree: bracketedDotsMark({ x: 155, y: 361, color: palette.teal, open: false })
    })
  ]
]

await fs.mkdir(outputDir, { recursive: true })

const pngPaths = []

for (const [name, svg] of variants) {
  const svgPath = path.join(outputDir.pathname, `${name}.svg`)
  const pngPath = path.join(outputDir.pathname, `${name}.png`)

  await fs.writeFile(svgPath, svg)
  await sharp(Buffer.from(svg)).png().toFile(pngPath)
  pngPaths.push(pngPath)
}

const tiles = await Promise.all(pngPaths.map(async filePath => ({
  input: await sharp(filePath).resize(760, 520).png().toBuffer()
})))

await sharp({
  create: {
    width: 1600,
    height: 1120,
    channels: 4,
    background: palette.paper
  }
})
  .composite([
    { input: tiles[0].input, left: 30, top: 30 },
    { input: tiles[1].input, left: 810, top: 30 },
    { input: tiles[2].input, left: 30, top: 570 },
    { input: tiles[3].input, left: 810, top: 570 }
  ])
  .png()
  .toFile(path.join(outputDir.pathname, 'catalogue-record-cuts-refinements-contact-sheet.png'))

console.log(`Generated ${variants.length} catalogue record cut refinements in ${outputDir.pathname}`)
