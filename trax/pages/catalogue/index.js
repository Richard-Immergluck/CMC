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
      composer: true
    }
  })

  return {
    props: {
      tracks
    }
  }
}

const Catalogue = ({ tracks }) => {

  const start = 15
  const stop = 30

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
            </a>
          </Link>
          <PlaySample track={track} start={start} stop={stop} />
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
