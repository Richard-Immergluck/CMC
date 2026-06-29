import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  requireRouteMethod
} from '../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../lib/server/route-auth'
import { requireSupportPermission } from '../../../../lib/server/permissions.mjs'
import { createRouteTelemetry } from '../../../../lib/server/route-telemetry'
import {
  buildDeepHealth,
  buildEnvChecks
} from '../../../../lib/server/health-core.mjs'

export const runtime = 'nodejs'

const methodNotAllowed = createMethodNotAllowedHandler(['GET'])

const checkDatabase = async () => {
  try {
    const { default: prisma } = await import('../../../../lib/server/prisma.js')
    await prisma.$queryRaw`SELECT 1`

    return {
      status: 'pass'
    }
  } catch (error) {
    return {
      status: 'fail',
      error: 'database_unavailable',
      errorName: error.name
    }
  }
}

export async function GET(request) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/admin/health',
    event: 'health.deep'
  })

  try {
    requireRouteMethod(request, ['GET'])

    const user = await requireRouteCurrentUser()
    requireSupportPermission(user)

    const checks = {
      ...buildEnvChecks(),
      databaseConnection: await checkDatabase()
    }
    const body = buildDeepHealth({ checks })
    const statusCode = body.status === 'ok' ? 200 : 503

    telemetry.complete({
      statusCode,
      userId: user.id,
      healthStatus: body.status
    })

    return jsonResponse(statusCode, body, {
      'X-Request-Id': telemetry.requestId
    })
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as PATCH,
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
