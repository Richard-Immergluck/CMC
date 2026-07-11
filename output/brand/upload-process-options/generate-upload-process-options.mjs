import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const outputDir = new URL('.', import.meta.url)

const palette = {
  paper: '#f8f3e9',
  paperDeep: '#ead9bb',
  parchment: '#efd5ad',
  parchmentDark: '#d6a75c',
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

const svgFrame = ({ title, subtitle, body }) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="760" height="520" viewBox="0 0 760 520" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <filter id="paperNoise" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="18" />
      <feColorMatrix type="saturate" values="0" />
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.12" />
      </feComponentTransfer>
    </filter>
    <filter id="inkNoise" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="4" seed="7" />
      <feColorMatrix type="saturate" values="0.35" />
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0.08 0.25" />
      </feComponentTransfer>
    </filter>
    <linearGradient id="parchmentGradient" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.parchment}" />
      <stop offset="0.55" stop-color="#f5ddba" />
      <stop offset="1" stop-color="${palette.parchmentDark}" />
    </linearGradient>
    <linearGradient id="tealGradient" x1="0" x2="1">
      <stop offset="0" stop-color="${palette.tealDark}" />
      <stop offset="1" stop-color="${palette.teal}" />
    </linearGradient>
    <style>
      .bg { fill: ${palette.paper}; }
      .texture { filter: url(#paperNoise); opacity: 0.55; }
      .label { fill: ${palette.red}; font: 800 15px Arial, sans-serif; letter-spacing: 5px; }
      .serif { fill: ${palette.ink}; font-family: Georgia, 'Times New Roman', serif; }
      .sans { font-family: Arial, sans-serif; }
      .small { fill: ${palette.muted}; font: 600 14px Arial, sans-serif; }
      .tiny { fill: ${palette.muted}; font: 700 11px Arial, sans-serif; letter-spacing: 2px; text-transform: uppercase; }
      .line { stroke: ${palette.line}; stroke-width: 1.25; opacity: 0.6; }
      .fine { stroke: ${palette.line}; stroke-width: 0.75; opacity: 0.38; }
      .gold-line { stroke: ${palette.gold}; stroke-width: 2.5; }
      .red-line { stroke: ${palette.red}; stroke-width: 2; }
      .teal-fill { fill: url(#tealGradient); }
      .gold-fill { fill: ${palette.gold}; }
      .red-fill { fill: ${palette.red}; }
      .grey-fill { fill: ${palette.grey}; }
      .paper-stroke { stroke: rgba(24,32,37,0.16); stroke-width: 1; fill: rgba(255,253,248,0.55); }
    </style>
  </defs>
  <rect class="bg" width="760" height="520" />
  <rect class="texture" width="760" height="520" />
  <rect x="20" y="20" width="720" height="480" fill="none" stroke="rgba(24,32,37,0.16)" />
  <text x="42" y="58" class="label">${escapeXml(title)}</text>
  <text x="42" y="84" class="small">${escapeXml(subtitle)}</text>
  ${body}
</svg>`

const staffLines = (x1, x2, y, gap = 12, className = 'line') => Array.from({ length: 5 }, (_, index) => (
  `<line x1="${x1}" x2="${x2}" y1="${y + index * gap}" y2="${y + index * gap}" class="${className}" />`
)).join('\n')

const optionOne = svgFrame({
  title: '01 ARCHIVE SLIP PROCESS',
  subtitle: 'A track enters the catalogue record.',
  body: `
    <rect x="82" y="122" width="420" height="312" class="paper-stroke" />
    <rect x="112" y="104" width="60" height="350" fill="url(#parchmentGradient)" opacity="0.92" />
    <rect x="112" y="104" width="60" height="350" filter="url(#paperNoise)" />
    ${staffLines(190, 478, 150, 10, 'fine')}
    <line x1="198" y1="212" x2="468" y2="212" class="fine" />
    <line x1="198" y1="292" x2="468" y2="292" class="fine" />
    <line x1="198" y1="372" x2="468" y2="372" class="fine" />
    <text x="210" y="197" class="tiny">01 SUBMIT</text>
    <text x="210" y="226" class="serif" style="font-size:28px">Upload received</text>
    <text x="210" y="252" class="small">Private file stored for review.</text>
    <text x="210" y="277" class="tiny">02 REVIEW</text>
    <text x="210" y="306" class="serif" style="font-size:28px">Checked by CMC</text>
    <text x="210" y="332" class="small">Audio, notes and rights verified.</text>
    <text x="210" y="357" class="tiny">03 PUBLISH</text>
    <text x="210" y="386" class="serif" style="font-size:28px">Catalogue ready</text>
    <text x="210" y="412" class="small">Buyers can preview, request and comment.</text>
    <circle cx="142" cy="205" r="8" class="gold-fill" />
    <circle cx="142" cy="285" r="8" class="red-fill" />
    <circle cx="142" cy="365" r="8" fill="${palette.teal}" />
    <aside>
      <rect x="548" y="156" width="116" height="190" fill="rgba(11,98,107,0.08)" stroke="rgba(11,98,107,0.25)" />
      <text x="572" y="205" class="serif" style="font-size:46px; fill:${palette.teal}">CMC</text>
      <text x="572" y="240" class="tiny">UPLOAD</text>
      <line x1="572" x2="640" y1="258" y2="258" class="gold-line" />
      <text x="572" y="292" class="small">record no.</text>
      <text x="572" y="318" class="label" style="letter-spacing:3px">03 / 12</text>
    </aside>
  `
})

const optionTwo = svgFrame({
  title: '02 STAFF-LINE JOURNEY',
  subtitle: 'A musical path from submission to publication.',
  body: `
    <rect x="64" y="132" width="632" height="230" fill="rgba(255,253,248,0.36)" stroke="rgba(24,32,37,0.12)" />
    ${staffLines(88, 672, 200, 14, 'line')}
    <rect x="310" y="144" width="54" height="258" fill="url(#parchmentGradient)" opacity="0.82" />
    <rect x="310" y="144" width="54" height="258" filter="url(#paperNoise)" />
    <path d="M122 270 C 234 226, 318 322, 432 270 S 574 225, 638 270" fill="none" stroke="${palette.gold}" stroke-width="3" />
    <circle cx="122" cy="270" r="20" fill="${palette.gold}" />
    <circle cx="380" cy="270" r="20" fill="${palette.red}" />
    <circle cx="638" cy="270" r="20" fill="${palette.teal}" />
    <circle cx="122" cy="270" r="8" fill="${palette.paper}" />
    <circle cx="380" cy="270" r="8" fill="${palette.paper}" />
    <circle cx="638" cy="270" r="8" fill="${palette.paper}" />
    <text x="84" y="342" class="tiny">SUBMITTED</text>
    <text x="327" y="342" class="tiny">CHECKED</text>
    <text x="588" y="342" class="tiny">PUBLISHED</text>
    <text x="96" y="388" class="serif" style="font-size:24px">File arrives</text>
    <text x="314" y="388" class="serif" style="font-size:24px">Review mark</text>
    <text x="570" y="388" class="serif" style="font-size:24px">Live row</text>
    <line x1="84" x2="676" y1="430" y2="430" class="fine" />
    <circle cx="380" cy="430" r="5" class="gold-fill" />
  `
})

const optionThree = svgFrame({
  title: '03 MODERATION STAMP',
  subtitle: 'A tactile review mark before public catalogue release.',
  body: `
    <rect x="92" y="122" width="238" height="286" rx="2" fill="${palette.paperDeep}" opacity="0.75" />
    <rect x="92" y="122" width="238" height="286" filter="url(#paperNoise)" />
    ${staffLines(118, 298, 290, 12, 'line')}
    <rect x="350" y="154" width="226" height="214" class="teal-fill" opacity="0.96" />
    <rect x="350" y="154" width="226" height="214" filter="url(#inkNoise)" />
    <path d="M316 170 C 396 142, 486 142, 604 174" fill="none" stroke="${palette.red}" stroke-width="2.5" />
    <circle cx="460" cy="252" r="70" fill="none" stroke="${palette.red}" stroke-width="3" opacity="0.8" />
    <circle cx="460" cy="252" r="53" fill="none" stroke="${palette.red}" stroke-width="1.5" opacity="0.65" />
    <text x="402" y="246" class="label" style="fill:${palette.red}; letter-spacing:4px">REVIEW</text>
    <text x="410" y="278" class="tiny" style="fill:${palette.red}">PENDING</text>
    <rect x="510" y="320" width="86" height="32" fill="${palette.gold}" />
    <text x="528" y="342" class="tiny" style="fill:${palette.paper}">APPROVE</text>
    <text x="106" y="446" class="serif" style="font-size:30px">Upload</text>
    <text x="262" y="446" class="serif" style="font-size:30px">Review</text>
    <text x="438" y="446" class="serif" style="font-size:30px">Catalogue</text>
    <line x1="196" x2="244" y1="435" y2="435" class="gold-line" />
    <line x1="372" x2="420" y1="435" y2="435" class="gold-line" />
  `
})

const optionFour = svgFrame({
  title: '04 CATALOGUE GRID MINIATURE',
  subtitle: 'A submitted track becomes a searchable catalogue row.',
  body: `
    <rect x="78" y="128" width="604" height="284" fill="rgba(255,253,248,0.48)" stroke="rgba(24,32,37,0.14)" />
    <rect x="78" y="128" width="46" height="284" fill="url(#parchmentGradient)" opacity="0.75" />
    <g class="tiny">
      <text x="146" y="164">TITLE</text>
      <text x="316" y="164">COMPOSER</text>
      <text x="454" y="164">STATE</text>
      <text x="578" y="164">LIVE</text>
    </g>
    ${[190, 238, 286, 334, 382].map(y => `<line x1="146" x2="658" y1="${y}" y2="${y}" class="fine" />`).join('\n')}
    <text x="94" y="214" class="small">01</text>
    <text x="146" y="214" class="serif" style="font-size:22px">New piano track</text>
    <text x="316" y="214" class="small">Clara R.</text>
    <circle cx="464" cy="208" r="6" class="gold-fill" /><circle cx="486" cy="208" r="6" class="grey-fill" /><circle cx="508" cy="208" r="6" class="grey-fill" />
    <rect x="574" y="194" width="52" height="22" fill="rgba(187,129,26,0.16)" stroke="rgba(187,129,26,0.4)" />
    <text x="584" y="210" class="tiny" style="font-size:9px; letter-spacing:1px">DRAFT</text>
    <text x="94" y="262" class="small">02</text>
    <text x="146" y="262" class="serif" style="font-size:22px">Review copy</text>
    <text x="316" y="262" class="small">CMC</text>
    <circle cx="464" cy="256" r="6" class="gold-fill" /><circle cx="486" cy="256" r="6" class="red-fill" /><circle cx="508" cy="256" r="6" class="grey-fill" />
    <rect x="574" y="242" width="64" height="22" fill="rgba(148,56,61,0.12)" stroke="rgba(148,56,61,0.38)" />
    <text x="584" y="258" class="tiny" style="font-size:9px; letter-spacing:1px">REVIEW</text>
    <text x="94" y="310" class="small">03</text>
    <text x="146" y="310" class="serif" style="font-size:22px">Published track</text>
    <text x="316" y="310" class="small">Catalogue</text>
    <circle cx="464" cy="304" r="6" class="gold-fill" /><circle cx="486" cy="304" r="6" class="red-fill" /><circle cx="508" cy="304" r="6" fill="${palette.teal}" />
    <rect x="574" y="290" width="50" height="22" fill="rgba(11,98,107,0.14)" stroke="rgba(11,98,107,0.42)" />
    <text x="584" y="306" class="tiny" style="font-size:9px; letter-spacing:1px">LIVE</text>
    <rect x="140" y="338" width="516" height="42" fill="rgba(11,98,107,0.08)" stroke="rgba(11,98,107,0.22)" />
    <text x="158" y="365" class="small">Published tracks can be found, purchased, requested and discussed.</text>
  `
})

const options = [
  ['upload-process-option-01-archive-slip', optionOne],
  ['upload-process-option-02-staff-line-journey', optionTwo],
  ['upload-process-option-03-moderation-stamp', optionThree],
  ['upload-process-option-04-catalogue-grid', optionFour]
]

await fs.mkdir(outputDir, { recursive: true })

const pngPaths = []

for (const [name, svg] of options) {
  const svgPath = path.join(outputDir.pathname, `${name}.svg`)
  const pngPath = path.join(outputDir.pathname, `${name}.png`)

  await fs.writeFile(svgPath, svg)
  await sharp(Buffer.from(svg)).png().toFile(pngPath)
  pngPaths.push(pngPath)
}

const contactSheetWidth = 1600
const contactSheetHeight = 1120
const resized = await Promise.all(pngPaths.map(async filePath => ({
  input: await sharp(filePath).resize(760, 520).png().toBuffer()
})))

await sharp({
  create: {
    width: contactSheetWidth,
    height: contactSheetHeight,
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
  .toFile(path.join(outputDir.pathname, 'upload-process-options-contact-sheet.png'))

console.log(`Generated ${options.length} upload process SVG/PNG options in ${outputDir.pathname}`)
