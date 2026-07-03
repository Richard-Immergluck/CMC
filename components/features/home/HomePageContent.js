'use client'

import Link from 'next/link'
import { Col, Container, Row } from 'react-bootstrap'
import BrandDisplayText from '../../brand/BrandDisplayText'

const fallbackHeroStats = [
  { value: '0', label: 'Tracks', tone: 'gold' },
  { value: '0', label: 'Uploaders', tone: 'teal' },
  { value: '0', label: 'Requests', tone: 'gold' },
  { value: '0', label: 'Comments', tone: 'red' }
]

const purposeRows = [
  {
    state: 'published',
    title: 'Publish useful recordings',
    body: 'Upload reductions, accompaniments, cue tracks, and studies that other players can discover and use.'
  },
  {
    state: 'draft',
    title: 'Build an uploader profile',
    body: 'Give each contributor a visible home for their catalogue, reputation, comments, and future requests.'
  },
  {
    state: 'requested',
    title: 'Let demand guide the archive',
    body: 'Requests and discussion help reveal missing repertoire and the practice material musicians need next.'
  }
]

const HomePageContent = ({ heroStats = fallbackHeroStats }) => (
  <main className='cmc-home-page'>
    <section className='cmc-home-hero'>
      <Container fluid='xl'>
        <div className='cmc-home-hero-board'>
          <div className='cmc-home-hero-staff' aria-hidden='true' />
          <div className='cmc-home-hero-paper' aria-hidden='true' />
          <div className='cmc-home-hero-dead-space cmc-home-hero-dead-space--ds01' aria-hidden='true' />
          <div className='cmc-home-hero-content'>
            <h1>
              <BrandDisplayText text={'Backing tracks\nshould not gather dust.'} />
            </h1>
            <p className='cmc-home-copy'>
              Discover, buy, request and discuss the practice tracks that help music come to life.
            </p>
            <div className='cmc-home-actions'>
              <Link href='/catalogue' className='cmc-button cmc-button--paper'>
                Browse catalogue
              </Link>
              <Link
                href='/auth/signin?callbackUrl=/catalogue'
                className='cmc-button cmc-button--ink'
              >
                Join the community
              </Link>
            </div>
          </div>
          <dl className='cmc-home-hero-stats' aria-label='Classical Music Catalogue activity'>
            {heroStats.map(stat => (
              <div className={`cmc-home-hero-stat cmc-home-hero-stat--${stat.tone}`} key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>

    <section className='cmc-home-section cmc-home-section--pathway'>
      <Container fluid='xl'>
        <div className='cmc-home-pathway'>
          <div className='cmc-home-section-label'>
            <div className='cmc-home-section-mark' aria-hidden='true'>
              <span className='cmc-home-section-mark__bar cmc-home-section-mark__bar--archive' />
              <span className='cmc-home-section-mark__bar cmc-home-section-mark__bar--catalogue' />
              <span className='cmc-home-section-mark__bar cmc-home-section-mark__bar--community' />
            </div>
            <p className='cmc-kicker'>How it works</p>
          </div>
          <h2>
            <BrandDisplayText text='A marketplace for the tracks musicians already have, and the ones players need next.' />
          </h2>
          <div className='cmc-home-pathway-grid'>
            <article>
              <span>01</span>
              <h3>Upload the archive</h3>
              <p>Musicians can publish backing tracks, reductions, accompaniments, and studies that would otherwise sit unused.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Find rehearsal material</h3>
              <p>Players search by repertoire, composer, instrumentation, uploader, or price, then preview and purchase what fits.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Shape what comes next</h3>
              <p>Comments, requests, profiles, and track activity turn the catalogue into a shared map of musical demand.</p>
            </article>
          </div>
        </div>
      </Container>
    </section>

    <section className='cmc-home-section cmc-home-section--purpose'>
      <Container fluid='xl'>
        <Row className='g-5 align-items-start'>
          <Col lg={6}>
            <div className='cmc-home-section-heading'>
              <div className='cmc-home-paper-indent' aria-hidden='true' />
              <div>
                <p className='cmc-kicker'>Digital music archive</p>
                <h2>
                  <BrandDisplayText text='Useful recordings deserve somewhere to live.' />
                </h2>
                <p className='cmc-home-purpose-copy'>
                  Classical musicians already create useful rehearsal tracks every day.
                  CMC gives that work a permanent home: searchable for players,
                  meaningful for uploaders, and shaped by the community around it.
                </p>
              </div>
            </div>
          </Col>
          <Col lg={6}>
            <div className='cmc-home-meaning-list' aria-label='Community catalogue principles'>
              {purposeRows.map(row => (
                <article className={`cmc-home-meaning-row cmc-home-meaning-row--${row.state}`} key={row.state}>
                  <div>
                    <strong>{row.title}</strong>
                    <span>{row.body}</span>
                  </div>
                </article>
              ))}
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  </main>
)

export default HomePageContent
