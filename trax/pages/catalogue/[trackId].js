import prisma from '/components/prisma'

// Create dynamic routes
export const getStaticPaths = async () => {
  const data = await prisma.track.findMany()

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

// Retrieve the individual track from DB
export const getStaticProps = async context => {
  const { params } = context

  console.log(params)

  const track = await prisma.track.findUnique({
    where: {
      id: Number(params.trackId)
    },
    select: {
      id: true,
      fileName: true,
      title: true,
      composer: true
    }
  })

  return {
    props: {
      track: track
    }
  }
}

// Render the JSX
const SingleTrack = ({ track }) => {
  const downloadFile = () => {
    
  }

  return (
    <>
      <h2>Track details for {track.title}</h2>
      <p>File name is {track.fileName}</p>
      <p>Title is {track.title}</p>
      <p>Composer is {track.composer}</p>
      <button onClick={downloadFile()}>Download</button>
    </>
  )
}

export default SingleTrack
