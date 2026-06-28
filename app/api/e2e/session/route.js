import { encode } from 'next-auth/jwt'
import {
  createForbiddenError
} from '../../../../lib/server/api-core.mjs'
import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod
} from '../../../../lib/server/route-handlers'
import prisma from '../../../../lib/server/prisma'

const SESSION_MAX_AGE = 60 * 60
const E2E_EMAIL_PATTERN = /^e2e-[a-z-]+@example\.com$/
const methodNotAllowed = createMethodNotAllowedHandler(['POST'])

const getLocalHostname = () => {
  try {
    return new URL(process.env.NEXTAUTH_URL || '').hostname
  } catch {
    return ''
  }
}

const e2eSessionAuthEnabled = () => {
  const hostname = getLocalHostname()

  return process.env.CMC_ENABLE_E2E_AUTH === 'true' &&
    process.env.VERCEL_ENV !== 'production' &&
    ['localhost', '127.0.0.1', '::1'].includes(hostname)
}

const getSessionCookieName = () => {
  const useSecureCookie = Boolean(process.env.NEXTAUTH_URL?.startsWith('https://'))
  return `${useSecureCookie ? '__Secure-' : ''}next-auth.session-token`
}

const createSessionCookie = token => {
  const cookieName = getSessionCookieName()
  const secure = cookieName.startsWith('__Secure-') ? '; Secure' : ''

  return `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${secure}`
}

export async function POST(request) {
  try {
    requireRouteMethod(request, ['POST'])

    if (!e2eSessionAuthEnabled()) {
      throw createForbiddenError('E2E session auth is not enabled')
    }

    const body = await parseRouteJson(request)
    const email = typeof body?.email === 'string' ? body.email : ''

    if (!E2E_EMAIL_PATTERN.test(email)) {
      throw createForbiddenError('Only seeded E2E users can request test sessions')
    }

    const user = await prisma.user.findUnique({
      where: {
        email
      }
    })

    if (!user || user.accountStatus !== 'ACTIVE') {
      throw createForbiddenError('Seeded E2E user is not available')
    }

    const token = await encode({
      secret: process.env.NEXTAUTH_SECRET,
      maxAge: SESSION_MAX_AGE,
      token: {
        name: user.name,
        email: user.email,
        picture: user.image,
        sub: user.id
      }
    })

    return jsonResponse(
      200,
      {
        user: {
          email: user.email,
          name: user.name,
          role: user.role
        }
      },
      {
        'Set-Cookie': createSessionCookie(token)
      }
    )
  } catch (error) {
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as GET,
  methodNotAllowed as PATCH,
  methodNotAllowed as PUT
}
