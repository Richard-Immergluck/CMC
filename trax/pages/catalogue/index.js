import React from 'react'
import Link from 'next/link'
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

  return (
    <div>
      <h1>Track Listing</h1>
      <hr />
      {tracks.map(track => (
        <Link href={`/catalogue/${track.id}`} key={track.id}>
          <a>
            <h3>{track.title}</h3>
            <p>By {track.composer}</p>
            <hr />
          </a>
        </Link>
      ))}
      <Link href={'/'}>
        <a>Back to Home Page</a>
      </Link>
    </div>
  )
}

export default Catalogue
