import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  requireRouteMethod
} from '../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../lib/server/route-auth'
import { getSecurityDashboardData } from '../../../../lib/server/admin-operations'
import { requireSupportPermission } from '../../../../lib/server/permissions.mjs'
import {
  toSecurityReportCsv,
  toSecurityReportRows
} from '../../../../lib/server/security-report-core.mjs'
import {
  adminSecurityReportQuerySchema,
  validateInput
} from '../../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['GET'])

export async function GET(request) {
  try {
    requireRouteMethod(request, ['GET'])

    const user = await requireRouteCurrentUser()
    requireSupportPermission(user)

    const { searchParams } = new URL(request.url)
    const query = validateInput(
      adminSecurityReportQuerySchema,
      Object.fromEntries(searchParams.entries()),
      'Invalid security report query'
    )
    const dashboard = await getSecurityDashboardData()
    const generatedAt = new Date()
    const rows = toSecurityReportRows({
      dashboard,
      generatedAt
    })

    if (query.format === 'csv') {
      return new Response(toSecurityReportCsv(rows), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="cmc-security-report-${generatedAt.toISOString().slice(0, 10)}.csv"`
        }
      })
    }

    return jsonResponse(200, {
      generatedAt: generatedAt.toISOString(),
      dashboard,
      rows
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
