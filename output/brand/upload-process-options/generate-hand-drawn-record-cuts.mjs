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
  gold: '#bb811a',
  red: '#94383d',
  border: 'rgba(24,32,37,0.15)'
}

const escapeXml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

const jitteredStaff = ({ color, seed = 0, dots = [], slant = 0, flourish = false }) => {
  const lines = Array.from({ length: 5 }, (_, index) => {
    const y = -18 + index * 9
    const lift = ((seed + index) % 3 - 1) * 0.8
    const dip = ((seed + index * 2) % 5 - 2) * 0.55
    const end = ((seed + index * 3) % 4 - 1.5) * 1.8
    return `<path d="M-34 ${y + lift} C-18 ${y + dip}, 4 ${y - lift}, ${34 + end} ${y + dip}" stroke="${color}" stroke-width="${index % 2 === 0 ? 1.25 : 0.95}" opacity="${0.52 + index * 0.055}" />`
  }).join('')

  const dotNodes = dots.map(({ cx, cy, r = 2.6, opacity = 0.9 }) => `
    <g transform="translate(${cx} ${cy})">
      <circle cx="0" cy="0" r="${r}" fill="${color}" stroke="none" opacity="${opacity}" />
      <path d="M${-r * 0.75} ${-r * 0.12} C${-r * 0.1} ${-r * 0.8}, ${r * 0.75} ${-r * 0.15}, ${r * 0.2} ${r * 0.56}" stroke="${color}" stroke-width="0.7" fill="none" opacity="0.35" />
    </g>
  `).join('')

  const vertical = `<path d="M${slant} -31 C${slant - 1.4} -10, ${slant + 1.4} 8, ${slant - 0.3} 29" stroke="${color}" stroke-width="1.05" opacity="0.34" />`
  const flourishPath = flourish
    ? `<path d="M-29 24 C-12 15, 10 17, 27 8" stroke="${color}" stroke-width="1.15" opacity="0.42" />`
    : ''

  return `<g stroke="none" fill="none">${lines}${vertical}${flourishPath}${dotNodes}</g>`
}

const makeSvg = ({ title, marks }) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="760" height="520" viewBox="0 0 760 520" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <filter id="paperNoise" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" seed="52" />
      <feColorMatrix type="saturate" values="0.14" />
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.14" />
      </feComponentTransfer>
    </filter>
    <filter id="inkBleed" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.28" numOctaves="3" seed="12" />
      <feDisplacementMap in="SourceGraphic" scale="0.45" />
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
      .number { fill: ${palette.muted}; font: 800 11px Arial, sans-serif; letter-spacing: 2.2px; }
      .rule { stroke: ${palette.line}; stroke-width: 0.9; opacity: 0.2; }
      .mark { filter: url(#inkBleed); }
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
  ${marks}
</svg>`

const markGroup = ({ y, color, body, opacity = 1 }) => `
  <g class="mark" transform="translate(155 ${y})" opacity="${opacity}">
    ${body}
  </g>`

const variants = [
  [
    'hand-drawn-record-cuts-a-annotated-staff',
    makeSvg({
      title: 'Annotated staff',
      marks: `
        ${markGroup({ y: 145, color: palette.gold, body: jitteredStaff({ color: palette.gold, seed: 1, slant: -1, dots: [{ cx: -23, cy: -8, r: 2.8 }, { cx: 2, cy: 0, r: 2.1, opacity: 0.64 }, { cx: 23, cy: 10, r: 2.1, opacity: 0.58 }] }) })}
        ${markGroup({ y: 253, color: palette.red, body: jitteredStaff({ color: palette.red, seed: 4, slant: 1, dots: [{ cx: -23, cy: -7, r: 2.1, opacity: 0.64 }, { cx: 0, cy: 1, r: 3.9 }, { cx: 24, cy: 10, r: 2.1, opacity: 0.58 }] }) })}
        ${markGroup({ y: 361, color: palette.teal, body: jitteredStaff({ color: palette.teal, seed: 7, slant: 1, dots: [{ cx: -23, cy: -7, r: 2.1, opacity: 0.64 }, { cx: 0, cy: 1, r: 2.1, opacity: 0.64 }, { cx: 24, cy: 10, r: 3.9 }] }) })}
      `
    })
  ],
  [
    'hand-drawn-record-cuts-b-score-fragments',
    makeSvg({
      title: 'Score fragments',
      marks: `
        ${markGroup({ y: 145, color: palette.gold, body: jitteredStaff({ color: palette.gold, seed: 2, slant: -6, flourish: true, dots: [{ cx: -20, cy: -10, r: 2.7 }, { cx: 8, cy: -1, r: 2.3 }, { cx: 26, cy: 8, r: 1.9, opacity: 0.55 }] }) })}
        ${markGroup({ y: 253, color: palette.red, body: jitteredStaff({ color: palette.red, seed: 5, slant: -2, flourish: true, dots: [{ cx: -25, cy: 9, r: 1.9, opacity: 0.55 }, { cx: 4, cy: 1, r: 2.7 }, { cx: 25, cy: -10, r: 2.3 }] }) })}
        ${markGroup({ y: 361, color: palette.teal, body: jitteredStaff({ color: palette.teal, seed: 8, slant: 5, flourish: true, dots: [{ cx: -22, cy: 10, r: 2 }, { cx: -1, cy: 0, r: 2.3 }, { cx: 21, cy: -10, r: 2.9 }] }) })}
      `
    })
  ],
  [
    'hand-drawn-record-cuts-c-catalogue-points',
    makeSvg({
      title: 'Catalogue points',
      marks: `
        ${markGroup({ y: 145, color: palette.gold, body: jitteredStaff({ color: palette.gold, seed: 3, slant: -8, dots: [{ cx: -29, cy: -11, r: 2.6 }, { cx: -7, cy: -1, r: 2.5 }, { cx: 17, cy: 8, r: 2.5 }] }) + `<path d="M-38 -25 C-37 -3, -38 12, -35 27" stroke="${palette.gold}" stroke-width="1.2" opacity="0.42" />` })}
        ${markGroup({ y: 253, color: palette.red, body: jitteredStaff({ color: palette.red, seed: 6, slant: 0, dots: [{ cx: -25, cy: -9, r: 2.4 }, { cx: -1, cy: 0, r: 2.7 }, { cx: 25, cy: 8, r: 2.4 }] }) + `<path d="M-38 -25 C-37 -3, -38 12, -35 27" stroke="${palette.red}" stroke-width="1.2" opacity="0.42" />` })}
        ${markGroup({ y: 361, color: palette.teal, body: jitteredStaff({ color: palette.teal, seed: 9, slant: 8, dots: [{ cx: -17, cy: -10, r: 2.4 }, { cx: 7, cy: -1, r: 2.7 }, { cx: 29, cy: 8, r: 2.4 }] }) + `<path d="M-38 -25 C-37 -3, -38 12, -35 27" stroke="${palette.teal}" stroke-width="1.2" opacity="0.42" />` })}
      `
    })
  ],
  [
    'hand-drawn-record-cuts-d-pressed-notations',
    makeSvg({
      title: 'Pressed notations',
      marks: `
        ${markGroup({ y: 145, color: palette.gold, opacity: 0.94, body: jitteredStaff({ color: palette.gold, seed: 10, slant: -1, dots: [{ cx: -22, cy: -8, r: 3.1 }, { cx: 4, cy: 0, r: 2.4 }, { cx: 27, cy: 9, r: 1.8, opacity: 0.58 }] }) + `<circle cx="-21" cy="-8" r="6.2" stroke="${palette.gold}" stroke-width="0.9" opacity="0.18" />` })}
        ${markGroup({ y: 253, color: palette.red, opacity: 0.94, body: jitteredStaff({ color: palette.red, seed: 11, slant: 1, dots: [{ cx: -25, cy: -8, r: 2.1, opacity: 0.58 }, { cx: 0, cy: 0, r: 3.2 }, { cx: 24, cy: 9, r: 2.1, opacity: 0.58 }] }) + `<circle cx="0" cy="0" r="6.5" stroke="${palette.red}" stroke-width="0.9" opacity="0.18" />` })}
        ${markGroup({ y: 361, color: palette.teal, opacity: 0.94, body: jitteredStaff({ color: palette.teal, seed: 12, slant: 1, dots: [{ cx: -24, cy: -8, r: 1.8, opacity: 0.58 }, { cx: 2, cy: 0, r: 2.4 }, { cx: 25, cy: 9, r: 3.1 }] }) + `<circle cx="25" cy="9" r="6.2" stroke="${palette.teal}" stroke-width="0.9" opacity="0.18" />` })}
      `
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
  .toFile(path.join(outputDir.pathname, 'hand-drawn-record-cuts-contact-sheet.png'))

console.log(`Generated ${variants.length} hand-drawn record cut refinements in ${outputDir.pathname}`)
