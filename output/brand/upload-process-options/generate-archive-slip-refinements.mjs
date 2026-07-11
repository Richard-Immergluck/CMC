import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const outputDir = new URL('.', import.meta.url)

const palette = {
  paper: '#f8f3e9',
  card: '#fffbf3',
  parchment: '#efd5ad',
  parchmentDeep: '#d4a057',
  ink: '#182025',
  muted: '#665f52',
  line: '#5f6c69',
  teal: '#0b626b',
  tealDark: '#073f42',
  gold: '#bb811a',
  red: '#94383d',
  grey: '#a4aaa5'
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
      <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" seed="23" />
      <feColorMatrix type="saturate" values="0.2" />
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.14" />
      </feComponentTransfer>
    </filter>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#2a2012" flood-opacity="0.12" />
    </filter>
    <linearGradient id="parchment" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.parchment}" />
      <stop offset="0.5" stop-color="#f5dfbd" />
      <stop offset="1" stop-color="${palette.parchmentDeep}" />
    </linearGradient>
    <linearGradient id="teal" x1="0" x2="1">
      <stop offset="0" stop-color="${palette.tealDark}" />
      <stop offset="1" stop-color="${palette.teal}" />
    </linearGradient>
    <style>
      .bg { fill: ${palette.paper}; }
      .grain { filter: url(#paperNoise); opacity: 0.65; }
      .label { fill: ${palette.red}; font: 800 13px Arial, sans-serif; letter-spacing: 4px; }
      .tiny { fill: ${palette.muted}; font: 760 10px Arial, sans-serif; letter-spacing: 2px; }
      .small { fill: ${palette.muted}; font: 650 13px Arial, sans-serif; }
      .serif { fill: ${palette.ink}; font-family: Georgia, 'Times New Roman', serif; }
      .fine { stroke: ${palette.line}; stroke-width: 0.8; opacity: 0.22; }
      .sep { stroke: ${palette.gold}; stroke-width: 2.5; }
      .card { fill: rgba(255,251,243,0.62); stroke: rgba(24,32,37,0.14); stroke-width: 1; }
    </style>
  </defs>
  <rect class="bg" width="760" height="520" />
  <rect class="grain" width="760" height="520" />
  <rect x="32" y="36" width="696" height="448" fill="none" stroke="rgba(24,32,37,0.14)" />
  ${body}
</svg>`

const approvalRosette = ({ cx, cy, fill, stroke = palette.paper, label }) => `
  <g transform="translate(${cx} ${cy})">
    <path d="M0 -17 L5 -9 L14 -11 L11 -2 L18 4 L8 7 L8 17 L0 12 L-8 17 L-8 7 L-18 4 L-11 -2 L-14 -11 L-5 -9 Z" fill="${fill}" />
    <circle r="8" fill="${stroke}" opacity="0.96" />
    <text y="3.8" text-anchor="middle" style="fill:${fill}; font:800 8px Arial, sans-serif;">${label}</text>
  </g>`

const registerMark = ({ cx, cy, fill }) => `
  <g transform="translate(${cx} ${cy})" stroke="${fill}" fill="none" stroke-width="2">
    <circle r="13" />
    <line x1="-21" x2="-8" y1="0" y2="0" />
    <line x1="8" x2="21" y1="0" y2="0" />
    <line x1="0" x2="0" y1="-21" y2="-8" />
    <line x1="0" x2="0" y1="8" y2="21" />
    <circle r="3" fill="${fill}" stroke="none" />
  </g>`

const squarePunch = ({ cx, cy, fill }) => `
  <g transform="translate(${cx} ${cy}) rotate(45)">
    <rect x="-12" y="-12" width="24" height="24" fill="${fill}" />
    <rect x="-5" y="-5" width="10" height="10" fill="${palette.paper}" opacity="0.94" />
  </g>`

const miniSeal = ({ cx, cy, fill, label }) => `
  <g transform="translate(${cx} ${cy})">
    <circle r="16" fill="none" stroke="${fill}" stroke-width="2" />
    <circle r="10" fill="${fill}" opacity="0.16" />
    <text y="4" text-anchor="middle" style="fill:${fill}; font:800 8px Arial, sans-serif; letter-spacing:1px;">${label}</text>
  </g>`

const baseCard = ({ markSet, title, variantBody }) => frame({
  title,
  body: `
    <text x="64" y="78" class="label">${escapeXml(title)}</text>
    <text x="64" y="104" class="small">A reduced approval record for upload review.</text>
    <rect x="150" y="130" width="430" height="286" class="card" filter="url(#softShadow)" />
    <rect x="112" y="104" width="68" height="344" fill="url(#parchment)" />
    <rect x="112" y="104" width="68" height="344" class="grain" />
    <line x1="210" x2="532" y1="210" y2="210" class="fine" />
    <line x1="210" x2="532" y1="296" y2="296" class="fine" />
    <line x1="210" x2="532" y1="382" y2="382" class="fine" />
    ${markSet}
    ${variantBody}
  `
})

const variantOne = baseCard({
  title: 'A  ARCHIVE SLIP / STAMPED',
  markSet: `
    ${approvalRosette({ cx: 146, cy: 188, fill: palette.gold, label: '01' })}
    ${approvalRosette({ cx: 146, cy: 274, fill: palette.red, label: '02' })}
    ${approvalRosette({ cx: 146, cy: 360, fill: palette.teal, label: '03' })}
  `,
  variantBody: `
    <text x="220" y="190" class="tiny">UPLOAD</text>
    <text x="220" y="230" class="tiny">REVIEW</text>
    <text x="220" y="276" class="tiny">APPROVAL</text>
    <text x="220" y="316" class="tiny">CATALOGUE</text>
    <text x="220" y="365" class="serif" style="font-size:34px">Submitted for review.</text>
    <line x1="220" x2="504" y1="392" y2="392" class="sep" />
    <text x="220" y="426" class="small">Private until approved.</text>
  `
})

const variantTwo = baseCard({
  title: 'B  ARCHIVE SLIP / REGISTER',
  markSet: `
    ${registerMark({ cx: 146, cy: 188, fill: palette.gold })}
    ${registerMark({ cx: 146, cy: 274, fill: palette.red })}
    ${registerMark({ cx: 146, cy: 360, fill: palette.teal })}
  `,
  variantBody: `
    <text x="220" y="182" class="serif" style="font-size:28px">01 Upload</text>
    <text x="220" y="268" class="serif" style="font-size:28px">02 Review</text>
    <text x="220" y="354" class="serif" style="font-size:28px">03 Publish</text>
    <line x1="412" x2="506" y1="173" y2="173" class="sep" />
    <line x1="412" x2="506" y1="259" y2="259" class="sep" />
    <line x1="412" x2="506" y1="345" y2="345" class="sep" />
    <text x="220" y="430" class="small">Your track stays private during review.</text>
  `
})

const variantThree = baseCard({
  title: 'C  ARCHIVE SLIP / CATALOGUE PUNCH',
  markSet: `
    ${squarePunch({ cx: 146, cy: 188, fill: palette.gold })}
    ${squarePunch({ cx: 146, cy: 274, fill: palette.red })}
    ${squarePunch({ cx: 146, cy: 360, fill: palette.teal })}
  `,
  variantBody: `
    <text x="220" y="178" class="tiny">RECEIVED</text>
    <text x="220" y="222" class="serif" style="font-size:34px">Review copy</text>
    <line x1="220" x2="506" y1="246" y2="246" class="sep" />
    <text x="220" y="286" class="tiny">CHECKED</text>
    <text x="220" y="330" class="serif" style="font-size:34px">Not public yet</text>
    <line x1="220" x2="506" y1="354" y2="354" class="sep" />
    <text x="220" y="410" class="small">Approval turns it into a catalogue row.</text>
  `
})

const variantFour = baseCard({
  title: 'D  ARCHIVE SLIP / APPROVAL SEALS',
  markSet: `
    ${miniSeal({ cx: 146, cy: 188, fill: palette.gold, label: 'IN' })}
    ${miniSeal({ cx: 146, cy: 274, fill: palette.red, label: 'RV' })}
    ${miniSeal({ cx: 146, cy: 360, fill: palette.teal, label: 'OK' })}
  `,
  variantBody: `
    <text x="220" y="200" class="serif" style="font-size:30px">Submitted</text>
    <text x="220" y="286" class="serif" style="font-size:30px">Reviewed</text>
    <text x="220" y="372" class="serif" style="font-size:30px">Published</text>
    <path d="M402 178 C 450 194, 482 184, 524 202" fill="none" stroke="${palette.gold}" stroke-width="2.4" />
    <path d="M402 264 C 450 280, 482 270, 524 288" fill="none" stroke="${palette.red}" stroke-width="2.4" />
    <path d="M402 350 C 450 366, 482 356, 524 374" fill="none" stroke="${palette.teal}" stroke-width="2.4" />
    <text x="220" y="430" class="small">A simple record of the approval path.</text>
  `
})

const variants = [
  ['archive-slip-refinement-a-stamped', variantOne],
  ['archive-slip-refinement-b-register', variantTwo],
  ['archive-slip-refinement-c-punch', variantThree],
  ['archive-slip-refinement-d-seals', variantFour]
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
  .toFile(path.join(outputDir.pathname, 'archive-slip-refinements-contact-sheet.png'))

console.log(`Generated ${variants.length} archive slip refinements in ${outputDir.pathname}`)
