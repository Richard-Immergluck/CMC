import React from 'react'
import Link from 'next/link'
import Track from '../../components/track'

function Catalogue({ tracks }) {
  return (
    <>
      <h1>Catalogue Landing Page</h1>
      {tracks.map(track => {
        return (
          <div key={track.id}>
            <Link href={`catalogue/${track.id}`} passHref>
              <Track track={track} />
            </Link>
            <hr />
          </div>
        )
      })}
      <Link href={'/'}>
        <a>Back to Home Page</a>
      </Link>
    </>
  )
}

export default Catalogue

export async function getStaticProps() {
  const response = await fetch('http://localhost:3000/api/tracks/list')
  const data = await response.json()

  return {
    props: {
      tracks: data
    }
  }
}
