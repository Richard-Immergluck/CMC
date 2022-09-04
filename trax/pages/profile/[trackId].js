import React, { useState } from 'react'
import { getSession } from 'next-auth/react'
import prisma from '/components/prisma'
import Link from 'next/link'
import GETSignedS3URL from '../../components/GETSignedS3URL'
import dynamic from 'next/dynamic' // needed for 'Self is not defined' error
import { Container, Button } from 'react-bootstrap'
import _ from 'lodash'

// Create dynamic routes
export const getStaticPaths = async () => {
  // Get all the tracks from the DB
  const allTracks = await prisma.track.findMany()

  const paths = allTracks.map(track => {
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

  // Get the session from user
  const session = await getSession({ req: context.req })

  console.log('the session is', session)

  // // Get the user from the database
  // const currentUser = await prisma.user.findUnique({
  //   where: {
  //     email: session.user.email
  //   }
  // })

  // Grab the track from DB using the params
  const track = await prisma.track.findUnique({
    where: {
      id: Number(params.trackId)
    }
  })

  // Retrieve the comments from DB
  const comments = await prisma.comment.findMany({
    where: {
      track: {
        id: Number(params.trackId)
      }
    }
  })

  // Convert the date element of each comment to a locale date string
  comments.map(comment => {
    return (comment.createdAt = comment.createdAt.toLocaleDateString())
  })

  // Convert the date element of the track to a locale date string
  track.uploadedAt = track.uploadedAt.toLocaleDateString()

  // // Check if the track is owned by the current user
  // const isTrackOwner = await prisma.TrackOwner.findUnique({
  //   where: {
  //     trackId_userId: {
  //       trackId: Number(params.trackId),
  //       userId: currentUser.id
  //     }
  //   }
  // })

  // // Check if the track was uploaded by the current user
  // const isTrackUploader = await prisma.track.findUnique({
  //   where: {
  //     id: Number(params.trackId)
  //   },
  //   select: {
  //     userId: true
  //   }
  // })

  // if (isTrackOwner || isTrackUploader === currentUser.id) {
  return {
    props: {
      track,
      comments
    }
  }
}

const TrackOwnerPage = (track, comments) => {
  return (
    <Container>
      <h1>Track Owner Page</h1>
    </Container>
  )
}

export default TrackOwnerPage
