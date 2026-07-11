import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod,
  requireTrustedRouteOrigin
} from '../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../lib/server/route-auth'
import { createRouteTelemetry } from '../../../lib/server/route-telemetry'
import {
  createWorksCollection,
  listUserWorksCollections,
  serializeWorksCollection
} from '../../../lib/server/works-collections.mjs'
import {
  createWorksCollectionBodySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['GET', 'POST'])

export async function GET(request) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/works-collections',
    event: 'works_collections.list'
  })

  try {
    requireRouteMethod(request, ['GET', 'POST'])
    const user = await requireRouteCurrentUser({
      route: '/api/works-collections'
    })
    const collections = await listUserWorksCollections({
      userId: user.id
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      collectionCount: collections.length
    })

    return jsonResponse(200, {
      collections: collections.map(serializeWorksCollection)
    })
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export async function POST(request) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/works-collections',
    event: 'works_collections.create'
  })

  try {
    requireRouteMethod(request, ['GET', 'POST'])
    requireTrustedRouteOrigin(request)
    const user = await requireRouteCurrentUser({
      route: '/api/works-collections'
    })
    const body = await parseRouteJson(request)
    const input = validateInput(
      createWorksCollectionBodySchema,
      body,
      'Invalid Works & Collections request'
    )
    const collection = await createWorksCollection({
      input,
      user
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      collectionId: collection.id
    })

    return jsonResponse(200, {
      collection: serializeWorksCollection(collection)
    })
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as PATCH,
  methodNotAllowed as PUT
}
