import {
  createNotFoundError
} from '../../../../lib/server/api-core.mjs'
import {
  createMethodNotAllowedHandler,
  handleRouteError,
  requireRouteMethod
} from '../../../../lib/server/route-handlers'
import {
  getDemoFixtureBuffer,
  syntheticFixturesEnabled
} from '../../../../lib/server/demo-fixtures'

const methodNotAllowed = createMethodNotAllowedHandler(['GET'])

export async function GET(request, { params }) {
  try {
    requireRouteMethod(request, ['GET'])

    if (!syntheticFixturesEnabled()) {
      throw createNotFoundError('Demo fixtures are not enabled')
    }

    const routeParams = await params
    const fixtureName = routeParams.fixtureName
    const audio = getDemoFixtureBuffer(fixtureName)

    if (!audio) {
      throw createNotFoundError('Demo fixture not found')
    }

    const { searchParams } = new URL(request.url)
    const headers = {
      'Content-Type': 'audio/wav',
      'Content-Length': String(audio.length),
      'Cache-Control': 'no-store'
    }

    if (searchParams.get('download') === '1') {
      headers['Content-Disposition'] = `attachment; filename="${fixtureName}"`
    }

    return new Response(audio, {
      status: 200,
      headers
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as PATCH,
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
