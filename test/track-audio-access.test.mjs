import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { canUseFullTrackPlayback, getSampleAudioKey } from '../lib/track-audio-access.mjs'

test('sample audio key only uses an explicit preview asset', () => {
  assert.equal(getSampleAudioKey({ fileName: 'uploads/full-track.mp3' }), null)
  assert.equal(
    getSampleAudioKey({
      fileName: 'uploads/full-track.mp3',
      previewFileName: 'previews/track-sample.mp3'
    }),
    'previews/track-sample.mp3'
  )
})

test('full detail playback is limited to owned or uploaded tracks', () => {
  assert.equal(canUseFullTrackPlayback({ viewerState: { isOwned: true } }), true)
  assert.equal(canUseFullTrackPlayback({ viewerState: { isUploadedByViewer: true } }), true)
  assert.equal(canUseFullTrackPlayback({ viewerState: { isOwned: false, isUploadedByViewer: false } }), false)
  assert.equal(canUseFullTrackPlayback({}), false)
})

test('sample signed-url route does not sign the original full track object', () => {
  const routeSource = readFileSync(
    new URL('../app/api/tracks/[trackId]/signed-url/route.js', import.meta.url),
    'utf8'
  )
  const sampleBranchStart = routeSource.indexOf("if (mode === 'sample')")
  const sampleBranchEnd = routeSource.indexOf('const currentUser = await requireRouteCurrentUser()')
  const sampleBranch = routeSource.slice(sampleBranchStart, sampleBranchEnd)

  assert.ok(sampleBranch.includes('getSampleAudioKey(track)'))
  assert.equal(sampleBranch.includes('key: track.fileName'), false)
})

test('track detail playback only requests full mode through the ownership helper', () => {
  const detailSource = readFileSync(
    new URL('../components/features/catalogue/CatalogueTrackDetailContent.js', import.meta.url),
    'utf8'
  )

  assert.ok(detailSource.includes('canUseFullTrackPlayback(track)'))
  assert.ok(detailSource.includes("const playbackMode = canPlayFullTrack ? 'full' : 'sample'"))
  assert.ok(detailSource.includes('mode={playbackMode}'))
})
