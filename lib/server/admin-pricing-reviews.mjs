import { formatPricePence, getPricingBand } from '../pricing-policy.mjs'
import prisma from './prisma.js'
import { catalogueReleaseStatuses } from './works-collections-core.mjs'

export const toTrackPricingReviewItem = track => ({
  id: track.id,
  title: track.title,
  composer: track.composer,
  catalogueType: track.catalogueType,
  saleFormat: track.saleFormat,
  pricePence: track.pricePence,
  formattedPrice: track.formattedPrice || formatPricePence(track.pricePence),
  pricingReviewStatus: track.pricingReviewStatus,
  pricingJustification: track.pricingJustification,
  suggestedBand: getPricingBand(track.catalogueType).label,
  uploadedAt: track.uploadedAt,
  uploader: track.uploadedBy
    ? {
        id: track.uploadedBy.id,
        name: track.uploadedBy.name,
        email: track.uploadedBy.email
      }
    : null
})

export const toRequestPricingReviewItem = proposal => ({
  id: proposal.id,
  requestId: proposal.requestId,
  pricePence: proposal.pricePence,
  formattedPrice: formatPricePence(proposal.pricePence),
  currency: proposal.currency,
  catalogueType: proposal.catalogueType,
  saleFormat: proposal.saleFormat,
  reviewStatus: proposal.reviewStatus,
  requesterDecision: proposal.requesterDecision,
  justification: proposal.justification,
  suggestedBand: getPricingBand(proposal.catalogueType).label,
  createdAt: proposal.createdAt,
  proposedBy: proposal.proposedBy
    ? {
        id: proposal.proposedBy.id,
        name: proposal.proposedBy.name,
        email: proposal.proposedBy.email
      }
    : null,
  request: proposal.request
    ? {
        id: proposal.request.id,
        title: proposal.request.title,
        status: proposal.request.status,
        requestedBy: proposal.request.requestedBy
          ? {
              id: proposal.request.requestedBy.id,
              name: proposal.request.requestedBy.name,
              email: proposal.request.requestedBy.email
            }
          : null,
        track: proposal.request.track
          ? {
              id: proposal.request.track.id,
              title: proposal.request.track.title,
              composer: proposal.request.track.composer
            }
          : null
      }
    : null
})

export const toReleasePricingReviewItem = release => ({
  id: release.id,
  title: release.title,
  composer: release.composer,
  catalogueType: release.catalogueType,
  saleFormat: release.saleFormat,
  pricePence: release.pricePence,
  formattedPrice: release.formattedPrice || formatPricePence(release.pricePence),
  pricingReviewStatus: release.pricingReviewStatus,
  pricingJustification: release.pricingJustification,
  status: release.status,
  suggestedBand: getPricingBand(release.catalogueType).label,
  tracks: (release.tracks || []).map(item => ({
    id: item.track?.id || item.trackId,
    composer: item.track?.composer || null,
    movementNo: item.movementNo,
    position: item.position,
    title: item.titleInWork || item.track?.title || 'Untitled track',
    trackId: item.track?.id || item.trackId
  })),
  trackCount: release.tracks?.length || 0,
  createdAt: release.createdAt,
  uploader: release.uploadedBy
    ? {
        id: release.uploadedBy.id,
        name: release.uploadedBy.name,
        email: release.uploadedBy.email
      }
    : null
})

export const getAdminPricingReviews = async () => {
  const [tracks, requestProposals, releases] = await Promise.all([
    prisma.track.findMany({
      where: {
        pricingReviewStatus: 'NEEDS_REVIEW'
      },
      include: {
        uploadedBy: true
      },
      orderBy: [
        {
          uploadedAt: 'asc'
        }
      ],
      take: 100
    }),
    prisma.requestPricingProposal.findMany({
      where: {
        reviewStatus: 'NEEDS_REVIEW'
      },
      include: {
        proposedBy: true,
        request: {
          include: {
            requestedBy: true,
            track: true
          }
        }
      },
      orderBy: [
        {
          createdAt: 'asc'
        }
      ],
      take: 100
    }),
    prisma.catalogueRelease.findMany({
      where: {
        pricingReviewStatus: 'NEEDS_REVIEW',
        status: {
          in: [
            catalogueReleaseStatuses.published,
            catalogueReleaseStatuses.submitted
          ]
        }
      },
      include: {
        tracks: {
          include: {
            track: {
              select: {
                composer: true,
                id: true,
                title: true
              }
            }
          },
          orderBy: {
            position: 'asc'
          }
        },
        uploadedBy: true
      },
      orderBy: [
        {
          createdAt: 'asc'
        }
      ],
      take: 100
    })
  ])

  return {
    releases: releases.map(toReleasePricingReviewItem),
    requestProposals: requestProposals.map(toRequestPricingReviewItem),
    tracks: tracks.map(toTrackPricingReviewItem)
  }
}
