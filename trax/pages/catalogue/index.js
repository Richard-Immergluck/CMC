import React from 'react'
import Link from 'next/link'
import PlaySample from '../../components/PlaySample'
import prisma from '/components/prisma'

export const getStaticProps = async () => {
  const tracks = await prisma.track.findMany({
    select: {
      id: true,
      fileName: true,
      title: true,
      composer: true,
      previewStart: true,
      previewEnd: true,
      price: true,
      formattedPrice: true
    }
  })

  return {
    props: {
      tracks
    }
  }
}

const Catalogue = ({ tracks }) => {

  return (
    <div>
      <h1>Track Listing</h1>
      <hr />
      {tracks.map(track => (
        <div key={track.id}>
          <Link href={`/catalogue/${track.id}`}>
            <a>
              <h3>{track.title}</h3>
              <p>By {track.composer}</p>
              <p>{track.formattedPrice}</p>
            </a>
          </Link>
          <PlaySample track={track} start={track.previewStart} stop={track.previewEnd} />
          <hr />
        </div>
      ))}

      <Link href={'/'}>
        <a>Back to Home Page</a>
      </Link>
    </div>
  )
}

export default Catalogue
