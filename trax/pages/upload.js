import UploadTracks from '../components/UploadTrack'

export async function getServerSideProps() {
  const res = await fetch(`http://localhost:3000/api/tracks`)
  const data = await res.json()

  if (!data) {
    return {
      notFound: true
    }
  }
  return {
    props: {
      tracks: data
    }
  }
}

function upload({tracks}) {
  
  console.log(tracks)

  return (
    <>
      <UploadTracks />
      <p>Below is a list of the tracks already uploaded</p>
      <ul>
        {tracks.map(track => (
          <li key={track.id}>
            {track.title} by {track.composer}
          </li>
        ))}
      </ul>
    </>
  )
}

export default upload
