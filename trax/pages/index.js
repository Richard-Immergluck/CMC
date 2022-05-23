import Head from 'next/head'
import Image from 'next/image'
import {useSession} from 'next-auth/react'
import styles from '../styles/Home.module.css'

export default function Home() {
  const {data: session, status} = useSession()
  console.log(`session ===>`, session)
  console.log(`status ===>`, status)
  return (
    <div className={styles.container}>
      <Head>
        <title>CMC</title>
        <meta name="Classical Music Catalogue" content="Classical Backing Track Catalogue" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          {session ? `${session.user.name},  ` : ''} Welcome to the Classical Music Catalogue{' '}
        </h1>
        <body>
          Some extra stuff here
        </body>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}
