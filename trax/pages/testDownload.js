import React from 'react'
import Head from 'next/head'
import GetSignedS3URL from '../components/GetSignedS3URL'

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

const testdownload = (tracks) => {
  
  const url = GetSignedS3URL({
    bucket: "backingtrackstorage",
    key: "19cb213c-d6fa-47cb-bb02-8387041028ce.mp3",
    expires: 60,
  })

  return (
    <div>
      <Head>
      <title>AWS presigned URL Download Test Page</title>
      </Head>

      <body>
        <h1>Test Download Page</h1>
        <p>The unique generated presigned URL is {url}</p>
        <a href={url} download> Click here to download! </a>
      </body>
      
    </div>
  )
}

export default testdownload
