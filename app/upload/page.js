import UploadForm from '../../components/uploadFormComponents/UploadForm'

const UploadPage = async ({ searchParams }) => {
  const resolvedSearchParams = await searchParams
  const fulfilledRequestId = typeof resolvedSearchParams?.fulfilledRequestId === 'string'
    ? resolvedSearchParams.fulfilledRequestId
    : ''

  return (
    <>
      {fulfilledRequestId && (
        <aside className='cmc-upload-fulfilment-notice' aria-label='Request fulfilment upload'>
          This upload will be attached to request #{fulfilledRequestId} after submission.
        </aside>
      )}
      <UploadForm initialFulfilledRequestId={fulfilledRequestId} />
    </>
  )
}

export default UploadPage
