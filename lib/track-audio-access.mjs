export const getSampleAudioKey = track => {
  if (!track?.previewFileName) {
    return null
  }

  return track.previewFileName
}

export const canUseFullTrackPlayback = track => Boolean(
  track?.viewerState?.isOwned || track?.viewerState?.isUploadedByViewer
)
