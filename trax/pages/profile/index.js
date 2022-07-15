import { getSession } from 'next-auth/react'
import React from 'react'

export const getServerSideProps = async (context) => {
try {
  const session = await getSession({ req: context.req })
  if(session){
    const tracks = await prisma.track.findMany({
      select: {
        id: true,
        fileName: true,
        title: true,
        composer: true,
        previewStart: true,
        previewEnd: true,
        price: true,
        formattedPrice: true,
        userId: true
      }
    })
  
    const currentUser = await prisma.user.findUnique({
      where: {
        email: session.user.email
      }
    })
  
    return {
      props: {
        tracks,
        currentUser
      }
    }
  } else {
    return {
      redirect: '/login',
      permanent: false
    }
  }
} catch (error) {
  
}
}

function UserProfilePage(currentUser) {
  console.log(currentUser)

  return (
    <div>profile page boom!</div>
  )
}

export default UserProfilePage