import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import HomePageContent from '../components/features/home/HomePageContent'
import { authOptions } from '../lib/server/auth'
import prisma from '../lib/server/prisma'
import { publicTrackWhere } from '../lib/server/tracks-core.mjs'

const numberFormatter = new Intl.NumberFormat('en-GB')

const formatCount = value => numberFormatter.format(value)

const countRequests = () => {
  if (!prisma.userAccessChangeRequest) {
    return Promise.resolve(0)
  }

  return prisma.userAccessChangeRequest.count()
}

const getHomeStats = async () => {
  const [trackCount, uploaderCount, requestCount, commentCount] = await Promise.all([
    prisma.track.count({
      where: publicTrackWhere
    }),
    prisma.user.count({
      where: {
        Track: {
          some: publicTrackWhere
        }
      }
    }),
    countRequests(),
    prisma.comment.count({
      where: {
        track: {
          is: publicTrackWhere
        }
      }
    })
  ])

  return [
    {
      value: formatCount(trackCount),
      label: 'Tracks',
      tone: 'gold'
    },
    {
      value: formatCount(uploaderCount),
      label: 'Uploaders',
      tone: 'teal'
    },
    {
      value: formatCount(requestCount),
      label: 'Requests',
      tone: 'gold'
    },
    {
      value: formatCount(commentCount),
      label: 'Comments',
      tone: 'red'
    }
  ]
}

const HomePage = async () => {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/catalogue')
  }

  const heroStats = await getHomeStats()

  return <HomePageContent heroStats={heroStats} />
}

export default HomePage
