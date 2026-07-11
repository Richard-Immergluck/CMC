import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const outputDir = new URL('.', import.meta.url)

const palette = {
  paper: '#f8f3e9',
  parchment: '#efd5ad',
  parchmentDeep: '#d19a43',
  ink: '#182025',
  muted: '#665f52',
  line: '#596765',
  teal: '#0b626b',
  tealDark: '#063d42',
  gold: '#bb811a',
  red: '#94383d'
}

const escapeXml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

const frame = ({ body, title }) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="760" height="520" viewBox="0 0 760 520" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <filter id="paperNoise" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" seed="31" />
      <feColorMatrix type="saturate" values="0.15" />
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.16" />
      </feComponentTransfer>
    </filter>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#2a2012" flood-opacity="0.11" />
    </filter>
    <filter id="inkTexture" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.42" numOctaves="4" seed="9" />
      <feColorMatrix type="saturate" values="0.3" />
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0.04 0.2" />
      </feComponentTransfer>
    </filter>
    <linearGradient id="parchment" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.parchment}" />
      <stop offset="0.55" stop-color="#f4deb9" />
      <stop offset="1" stop-color="${palette.parchmentDeep}" />
    </linearGradient>
    <style>
      .bg { fill: ${palette.paper}; }
      .grain { filter: url(#paperNoise); opacity: 0.68; }
      .outer { fill: none; stroke: rgba(24,32,37,0.14); stroke-width: 1; }
      .card { fill: rgba(255,251,243,0.58); stroke: rgba(24,32,37,0.14); stroke-width: 1; }
      .label { fill: ${palette.red}; font: 800 13px Arial, sans-serif; letter-spacing: 4px; }
      .small { fill: ${palette.muted}; font: 650 13px Arial, sans-serif; }
      .tiny { fill: ${palette.muted}; font: 760 10px Arial, sans-serif; letter-spacing: 2px; }
      .serif { fill: ${palette.ink}; font-family: Georgia, 'Times New Roman', serif; }
      .fine { stroke: ${palette.line}; stroke-width: 0.8; opacity: 0.24; }
      .staff { stroke: ${palette.line}; stroke-width: 1.1; opacity: 0.58; }
      .gold { stroke: ${palette.gold}; fill: none; }
      .red { stroke: ${palette.red}; fill: none; }
      .teal { stroke: ${palette.teal}; fill: none; }
    </style>
  </defs>
  <rect class="bg" width="760" height="520" />
  <rect class="grain" width="760" height="520" />
  <rect x="32" y="36" width="696" height="448" class="outer" />
  ${body}
</svg>`

const staffFragment = ({ x, y, stroke = palette.line, opacity = 0.7 }) => `
  <g stroke="${stroke}" opacity="${opacity}">
    ${Array.from({ length: 5 }, (_, index) => `<line x1="${x}" x2="${x + 46}" y1="${y + index * 6}" y2="${y + index * 6}" stroke-width="1.1" />`).join('')}
  </g>`

const catalogueGridMark = ({ x, y, color }) => `
  <g transform="translate(${x} ${y})" stroke="${color}" fill="none" stroke-width="1.5">
    <path d="M-22 -14 H22 M-22 0 H22 M-22 14 H22" opacity="0.85" />
    <path d="M-10 -24 V24 M10 -24 V24" opacity="0.65" />
    <circle cx="-16" cy="-7" r="1.8" fill="${color}" stroke="none" />
    <circle cx="0" cy="7" r="1.8" fill="${color}" stroke="none" />
    <circle cx="16" cy="-7" r="1.8" fill="${color}" stroke="none" />
  </g>`

const archiveScoreMark = ({ x, y, color }) => `
  <g transform="translate(${x} ${y})">
    ${staffFragment({ x: -25, y: -14, stroke: color, opacity: 0.75 })}
    <rect x="-4" y="-30" width="11" height="58" fill="${palette.parchment}" opacity="0.7" />
    <line x1="16" x2="30" y1="0" y2="0" stroke="${color}" stroke-width="1.5" />
    <circle cx="34" cy="0" r="2.5" fill="${color}" />
  </g>`

const reviewSweepMark = ({ x, y, color }) => `
  <g transform="translate(${x} ${y})" stroke="${color}" fill="none">
    <path d="M-24 -4 C-10 -18, 11 -18, 27 -2" stroke-width="2" />
    <path d="M-22 10 C-4 -2, 9 2, 24 14" stroke-width="1.4" opacity="0.72" />
    <line x1="-31" x2="31" y1="23" y2="23" stroke-width="1.2" opacity="0.6" />
  </g>`

const liveCatalogueMark = ({ x, y, color }) => `
  <g transform="translate(${x} ${y})">
    <rect x="-24" y="-20" width="48" height="40" fill="${color}" opacity="0.14" />
    <rect x="-24" y="-20" width="48" height="40" filter="url(#inkTexture)" />
    <path d="M-30 -3 H-8 M8 -3 H30 M-30 9 H30" stroke="${color}" stroke-width="1.5" opacity="0.78" />
    <rect x="-6" y="-11" width="12" height="28" fill="${color}" opacity="0.9" />
  </g>`

const baseCard = ({ title, marks, content }) => frame({
  title,
  body: `
    <text x="64" y="78" class="label">${escapeXml(title)}</text>
    <text x="64" y="104" class="small">Upload, review, publish. Private until approved.</text>
    <rect x="150" y="130" width="430" height="286" class="card" filter="url(#softShadow)" />
    <rect x="112" y="104" width="68" height="344" fill="url(#parchment)" />
    <rect x="112" y="104" width="68" height="344" class="grain" />
    <line x1="220" x2="528" y1="240" y2="240" class="fine" />
    <line x1="220" x2="528" y1="326" y2="326" class="fine" />
    ${marks}
    ${content}
  `
})

const optionA = baseCard({
  title: 'A  ARCHIVE STAFF MARKS',
  marks: `
    ${archiveScoreMark({ x: 146, y: 188, color: palette.gold })}
    ${reviewSweepMark({ x: 146, y: 274, color: palette.red })}
    ${liveCatalogueMark({ x: 146, y: 360, color: palette.teal })}
  `,
  content: `
    <text x="230" y="198" class="serif" style="font-size:32px">Upload</text>
    <text x="230" y="284" class="serif" style="font-size:32px">Review</text>
    <text x="230" y="370" class="serif" style="font-size:32px">Publish</text>
    <line x1="388" x2="510" y1="188" y2="188" stroke="${palette.gold}" stroke-width="2.3" />
    <line x1="388" x2="510" y1="274" y2="274" stroke="${palette.red}" stroke-width="2.3" />
    <line x1="388" x2="510" y1="360" y2="360" stroke="${palette.teal}" stroke-width="2.3" />
    <text x="230" y="430" class="small">The track enters CMC as a private review record.</text>
  `
})

const optionB = baseCard({
  title: 'B  CATALOGUE RECORD CUTS',
  marks: `
    ${catalogueGridMark({ x: 146, y: 188, color: palette.gold })}
    ${catalogueGridMark({ x: 146, y: 274, color: palette.red })}
    ${catalogueGridMark({ x: 146, y: 360, color: palette.teal })}
  `,
  content: `
    <text x="230" y="198" class="tiny">01</text>
    <text x="270" y="198" class="serif" style="font-size:31px">Upload</text>
    <text x="230" y="284" class="tiny">02</text>
    <text x="270" y="284" class="serif" style="font-size:31px">Review</text>
    <text x="230" y="370" class="tiny">03</text>
    <text x="270" y="370" class="serif" style="font-size:31px">Publish</text>
    <rect x="456" y="174" width="54" height="20" fill="${palette.gold}" opacity="0.16" />
    <rect x="456" y="260" width="54" height="20" fill="${palette.red}" opacity="0.14" />
    <rect x="456" y="346" width="54" height="20" fill="${palette.teal}" opacity="0.14" />
    <text x="230" y="430" class="small">A new catalogue row only appears after approval.</text>
  `
})

const optionC = baseCard({
  title: 'C  FOLIO EXCHANGE',
  marks: `
    <g transform="translate(146 188)">
      <path d="M-25 -26 H16 V26 H-25 Z" fill="${palette.gold}" opacity="0.22" />
      <path d="M-25 -26 H16 V26 H-25 Z" stroke="${palette.gold}" fill="none" stroke-width="1.5" />
      <path d="M-8 -16 V16" stroke="${palette.gold}" stroke-width="2" />
    </g>
    <g transform="translate(146 274)">
      <path d="M-26 -22 H22 V22 H-26 Z" fill="${palette.red}" opacity="0.14" />
      <path d="M-26 -22 H22 V22 H-26 Z" stroke="${palette.red}" fill="none" stroke-width="1.5" />
      <path d="M-20 0 C-6 -16, 7 -16, 22 0 C8 15, -6 15, -20 0Z" stroke="${palette.red}" fill="none" stroke-width="1.6" />
    </g>
    <g transform="translate(146 360)">
      <path d="M-24 -24 H24 V24 H-24 Z" fill="${palette.teal}" opacity="0.14" />
      <path d="M-18 -10 H18 M-18 2 H18 M-18 14 H18" stroke="${palette.teal}" stroke-width="1.5" />
      <rect x="-5" y="-18" width="10" height="36" fill="${palette.teal}" />
    </g>
  `,
  content: `
    <text x="230" y="198" class="serif" style="font-size:34px">Upload</text>
    <text x="230" y="284" class="serif" style="font-size:34px">Review</text>
    <text x="230" y="370" class="serif" style="font-size:34px">Publish</text>
    <path d="M388 184 C430 196, 468 176, 514 190" stroke="${palette.gold}" stroke-width="2.2" fill="none" />
    <path d="M388 270 C430 282, 468 262, 514 276" stroke="${palette.red}" stroke-width="2.2" fill="none" />
    <path d="M388 356 C430 368, 468 348, 514 362" stroke="${palette.teal}" stroke-width="2.2" fill="none" />
    <text x="230" y="430" class="small">A paper fragment becomes a discoverable record.</text>
  `
})

const optionD = baseCard({
  title: 'D  MINIMAL REVIEW LEDGER',
  marks: `
    <g transform="translate(146 188)">
      ${staffFragment({ x: -28, y: -13, stroke: palette.gold, opacity: 0.75 })}
      <circle cx="30" cy="0" r="3" fill="${palette.gold}" />
    </g>
    <g transform="translate(146 274)">
      <path d="M-26 0 H-4 M6 0 H27" stroke="${palette.red}" stroke-width="1.6" />
      <path d="M-12 -17 C5 -6, 10 6, 20 18" stroke="${palette.red}" stroke-width="2" fill="none" />
    </g>
    <g transform="translate(146 360)">
      <rect x="-24" y="-18" width="48" height="36" fill="${palette.teal}" opacity="0.1" />
      <path d="M-28 -8 H28 M-28 8 H28" stroke="${palette.teal}" stroke-width="1.5" />
      <circle cx="0" cy="0" r="4" fill="${palette.teal}" />
    </g>
  `,
  content: `
    <text x="230" y="198" class="serif" style="font-size:34px">Upload</text>
    <text x="230" y="284" class="serif" style="font-size:34px">Review</text>
    <text x="230" y="370" class="serif" style="font-size:34px">Publish</text>
    <text x="456" y="198" class="tiny">PRIVATE</text>
    <text x="456" y="284" class="tiny">CHECKED</text>
    <text x="456" y="370" class="tiny">LIVE</text>
    <line x1="230" x2="514" y1="410" y2="410" stroke="${palette.gold}" stroke-width="2.4" />
    <text x="230" y="438" class="small">Three states, one catalogue record.</text>
  `
})

const variants = [
  ['archive-slip-artistic-a-staff-marks', optionA],
  ['archive-slip-artistic-b-catalogue-cuts', optionB],
  ['archive-slip-artistic-c-folio-exchange', optionC],
  ['archive-slip-artistic-d-review-ledger', optionD]
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

const resized = await Promise.all(pngPaths.map(async filePath => ({
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
    { input: resized[0].input, left: 30, top: 30 },
    { input: resized[1].input, left: 810, top: 30 },
    { input: resized[2].input, left: 30, top: 570 },
    { input: resized[3].input, left: 810, top: 570 }
  ])
  .png()
  .toFile(path.join(outputDir.pathname, 'archive-slip-artistic-refinements-contact-sheet.png'))

console.log(`Generated ${variants.length} artistic archive slip refinements in ${outputDir.pathname}`)
