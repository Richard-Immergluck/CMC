import UploadTrackS3 from '../components/UploadTrackS3'

export async function getServerSideProps() {
  
  // Bring in the File ID
  const res = await fetch(`http://localhost:3000/api/tracks`, {
    method: 'GET'
  })
  const data = await res.json()

  if (!data) {
    return {
      notFound: true
    }
  }

  const trackListObjects = await prisma.track.findMany()

  // Removing the datetime key and value pair in each object
  const trackList = trackListObjects.map(({ uploadedAt, ...rest }) => {
    return rest
  })

  return {
    props: {
      newFileId: data[0].id,
      trackList
    }
  }
}

function s3Upload(props) {
  
  return (
    <div>
      <UploadTrackS3 {...props.newFileId} />
      <p>Below is a list of the currently uploaded files from the DB</p>
      {props.trackList.map(track => (
        <li key={track.id}>
          {track.title} by {track.composer}
        </li>
      ))}
    </div>
  )
}

export default s3Upload
