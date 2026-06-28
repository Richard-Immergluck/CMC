import { getServerSession } from 'next-auth'
import { getProviders } from 'next-auth/react'
import { redirect } from 'next/navigation'
import SignInPageContent from '../../../components/features/auth/SignInPageContent'
import { authOptions } from '../../../pages/api/auth/[...nextauth]'

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
      error={query?.error || null}
      providers={providers || {}}
    />
  )
}

export default SignInPage
