import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod,
  requireTrustedRouteOrigin
} from '../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../lib/server/route-auth'
import { createRouteTelemetry } from '../../../../lib/server/route-telemetry'
import {
  deleteWorksCollection,
  serializeWorksCollection,
  updateWorksCollection
} from '../../../../lib/server/works-collections.mjs'
import {
  updateWorksCollectionBodySchema,
  validateInput,
  worksCollectionIdParamSchema
} from '../../../../lib/validation/api.mjs'

const routePath = '/api/works-collections/[collectionId]'
const methodNotAllowed = createMethodNotAllowedHandler(['DELETE', 'PATCH'])

export async function PATCH(request, { params }) {
  const telemetry = createRouteTelemetry({
    request,
    route: routePath,
    event: 'works_collections.update'
  })

  try {
    requireRouteMethod(request, ['DELETE', 'PATCH'])
    requireTrustedRouteOrigin(request)
    const user = await requireRouteCurrentUser({
      route: routePath
    })
    const { collectionId } = validateInput(
      worksCollectionIdParamSchema,
      await params,
      'Invalid Work or Collection id'
    )
    const body = await parseRouteJson(request)
    const input = validateInput(
      updateWorksCollectionBodySchema,
      body,
      'Invalid Works & Collections request'
    )
    const collection = await updateWorksCollection({
      collectionId,
      input,
      user
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      collectionId
    })

    return jsonResponse(200, {
      collection: serializeWorksCollection(collection)
    })
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export async function DELETE(request, { params }) {
  const telemetry = createRouteTelemetry({
    request,
    route: routePath,
    event: 'works_collections.delete'
  })

  try {
    requireRouteMethod(request, ['DELETE', 'PATCH'])
    requireTrustedRouteOrigin(request)
    const user = await requireRouteCurrentUser({
      route: routePath
    })
    const { collectionId } = validateInput(
      worksCollectionIdParamSchema,
      await params,
      'Invalid Work or Collection id'
    )

    await deleteWorksCollection({
      collectionId,
      user
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      collectionId
    })

    return jsonResponse(200, {
      deleted: true
    })
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as GET,
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
