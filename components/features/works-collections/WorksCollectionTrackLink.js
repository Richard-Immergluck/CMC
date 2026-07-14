'use client'

import Link from 'next/link'

const catalogueReturnTrackIdStorageKey = 'cmc.catalogue.returnTrackId'
const catalogueReturnUrlStorageKey = 'cmc.catalogue.returnUrl'

const isModifiedClick = event => (
  event.button !== 0 ||
  event.metaKey ||
  event.altKey ||
  event.ctrlKey ||
  event.shiftKey
)

const WorksCollectionTrackLink = ({
  children,
  collectionId,
  href,
  onClick,
  trackId,
  ...props
}) => {
  const catalogueHref = href || `/catalogue/${trackId}`
  const returnUrl = `/works-collections/${collectionId}#work-track-${trackId}`

  const rememberWorkReturn = event => {
    onClick?.(event)

    if (
      event.defaultPrevented ||
      isModifiedClick(event) ||
      typeof window === 'undefined'
    ) {
      return
    }

    sessionStorage.setItem(catalogueReturnTrackIdStorageKey, String(trackId))
    sessionStorage.setItem(catalogueReturnUrlStorageKey, returnUrl)
    window.history.replaceState(window.history.state, '', returnUrl)
  }

  return (
    <Link href={catalogueHref} onClick={rememberWorkReturn} {...props}>
      {children}
    </Link>
  )
}

export default WorksCollectionTrackLink
