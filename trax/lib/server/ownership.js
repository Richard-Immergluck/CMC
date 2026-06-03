import prisma from './prisma'

export const getCurrentUser = async session => {
  if (!session?.user?.email) {
    return null
  }

  return prisma.user.findUnique({
    where: {
      email: session.user.email
    }
  })
}

export const canAccessFullTrack = async ({ userId, trackId }) => {
  const track = await prisma.track.findUnique({
    where: {
      id: Number(trackId)
    }
  })

  if (!track) {
    return {
      allowed: false,
      track: null
    }
  }

  if (track.userId === userId) {
    return {
      allowed: true,
      track
    }
  }

  const ownership = await prisma.trackOwner.findFirst({
    where: {
      userId,
      trackId: track.id
    }
  })

  return {
    allowed: Boolean(ownership),
    track
  }
}
