import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import HomePageContent from '../components/features/home/HomePageContent'
import { authOptions } from '../pages/api/auth/[...nextauth]'

const HomePage = async () => {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/catalogue')
  }

  return <HomePageContent />
}

export default HomePage
