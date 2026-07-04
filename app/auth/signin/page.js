import { getServerSession } from 'next-auth'
import { getProviders } from 'next-auth/react'
import { redirect } from 'next/navigation'
import SignInPageContent from '../../../components/features/auth/SignInPageContent'
import { authOptions } from '../../../lib/server/auth'

const normaliseCallbackUrl = value => {
  if (!value || Array.isArray(value)) {
    return '/catalogue'
  }

  if (value.startsWith('/')) {
    return value
  }

  try {
    const url = new URL(value)
    return `${url.pathname}${url.search}${url.hash}` || '/catalogue'
  } catch {
    return '/catalogue'
  }
}

const getLocalHostname = () => {
  try {
    return new URL(process.env.NEXTAUTH_URL || '').hostname
  } catch {
    return ''
  }
}

const devLoginEnabled = () => {
  const hostname = getLocalHostname()

  return process.env.CMC_ENABLE_E2E_AUTH === 'true' &&
    process.env.VERCEL_ENV !== 'production' &&
    ['localhost', '127.0.0.1', '::1'].includes(hostname)
}

const SignInPage = async ({ searchParams }) => {
  const query = await searchParams
  const callbackUrl = normaliseCallbackUrl(query?.callbackUrl)
  const session = await getServerSession(authOptions)

  if (session) {
    redirect(callbackUrl)
  }

  const providers = await getProviders()

  return (
    <SignInPageContent
      callbackUrl={callbackUrl}
      devLoginEnabled={devLoginEnabled()}
      error={query?.error || null}
      providers={providers || {}}
    />
  )
}

export default SignInPage
