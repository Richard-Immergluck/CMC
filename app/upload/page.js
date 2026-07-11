import { getServerSession } from 'next-auth'
import UploadForm from '../../components/uploadFormComponents/UploadForm'
import { authOptions } from '../../lib/server/auth'
import prisma from '../../lib/server/prisma'
import { serializeUploadBatch } from '../../lib/server/upload-batches.mjs'

export const dynamic = 'force-dynamic'

const getInitialUploadBatch = async ({ batchId, email }) => {
  if (!batchId || !email) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: {
      email
    },
    select: {
      id: true
    }
  })

  if (!user) {
    return null
  }

  const batch = await prisma.uploadBatch.findFirst({
    where: {
      id: batchId,
      userId: user.id
    },
    include: {
      tracks: {
        orderBy: {
          uploadedAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          composer: true,
          moderationStatus: true,
          processingStatus: true,
          status: true,
          uploadedAt: true
        }
      }
    }
  })

  return batch ? serializeUploadBatch(batch) : null
}

const UploadPage = async ({ searchParams }) => {
  const session = await getServerSession(authOptions)
  const resolvedSearchParams = await searchParams
  const fulfilledRequestId = typeof resolvedSearchParams?.fulfilledRequestId === 'string'
    ? resolvedSearchParams.fulfilledRequestId
    : ''
  const requestedBatchId = Number.parseInt(resolvedSearchParams?.batchId || '', 10)
  const initialUploadBatch = await getInitialUploadBatch({
    batchId: Number.isInteger(requestedBatchId) ? requestedBatchId : null,
    email: session?.user?.email || null
  })

  return (
    <>
      {fulfilledRequestId && (
        <aside className='cmc-upload-fulfilment-notice' aria-label='Request fulfilment upload'>
          This upload will be attached to request #{fulfilledRequestId} after submission.
        </aside>
      )}
      <UploadForm
        initialFulfilledRequestId={fulfilledRequestId}
        initialUploadBatch={initialUploadBatch}
      />
    </>
  )
}

export default UploadPage
