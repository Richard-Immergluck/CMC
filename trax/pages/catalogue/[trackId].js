function Track({ track }) {
  return (
    <>
      <h2>
        Post {track.title} - {track.composer}
      </h2>
    </>
  )
}

export default Track

export async function getStaticPaths() {
  const response = await fetch('http://localhost:3000/api/tracks/list')
  const data = await response.json()

  const paths = data.map(track => {
    return {
      params: {
        trackId: `${track.id}`
      }
    }
  })
  return {
    paths,
    fallback: 'blocking'
  }
}

export async function getStaticProps(context) {
  const { params } = context
  const response = await fetch(
    `http://localhost:3000/api/tracks/list/${params.trackId}`
  )

  const data = await response.json()

  console.log(`Generating page for /catalogue/${params.trackId}`)
  
  return {
    props: {
      track: data
    },
    revalidate: 30
  }
}
