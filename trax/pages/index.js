import Head from 'next/head'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import styles from '../styles/Home.module.css'
import ShortList from '../components/ShortList'

export default function Home() {

  
  const { data: session, status } = useSession()

  return (
    <div className={styles.container}>
      <Head>
        <title>CMC</title>
        <meta
          name='Classical Music Catalogue'
          content='Classical Backing Track Catalogue'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          {session ? `${session.user.name},  ` : ''} Welcome to the Classical
          Music Catalogue{' '}
        </h1>
        <div>
          {/* <ShortList /> */}
        </div>
      </main>

      <footer className={styles.footer}>

      </footer>
    </div>
  )
}
