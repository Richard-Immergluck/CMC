'use client'

import Link from 'next/link'
import { Col, Container, Row } from 'react-bootstrap'

const catalogueRows = [
  {
    number: '01',
    title: 'Piano Concerto No. 21',
    composer: 'W. A. Mozart',
    status: ['published', 'draft', 'requested']
  },
  {
    number: '02',
    title: 'Cello Sonata No. 1',
    composer: 'J. Brahms',
    status: ['published', 'requested']
  },
  {
    number: '03',
    title: 'Violin Concerto in G',
    composer: 'M. Bruch',
    status: ['draft', 'requested']
  }
]

const systemFlows = [
  {
    state: 'published',
    title: 'Publish useful recordings',
    body: 'Upload reductions, accompaniments, cue tracks, and studies that other players can discover and use.'
  },
  {
    state: 'draft',
    title: 'Keep work in progress close',
    body: 'Shape metadata, pricing, previews, and catalogue placement before a track goes live.'
  },
  {
    state: 'requested',
    title: 'Let demand guide the archive',
    body: 'Requests and discussion help reveal missing repertoire and the practice material musicians need next.'
  }
]

const fallbackHeroStats = [
  { value: '0', label: 'Tracks', tone: 'gold' },
  { value: '0', label: 'Uploaders', tone: 'teal' },
  { value: '0', label: 'Requests', tone: 'gold' },
  { value: '0', label: 'Comments', tone: 'red' }
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
              <span className='cmc-home-hero-initial'>B</span>ack<span className='cmc-home-hero-dotted-i'>i<span aria-hidden='true' /></span>ng tracks
              <br />
              should not gather dust
              <span className='cmc-home-hero-dot' aria-hidden='true'>.</span>
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
          <p className='cmc-kicker'>How it works</p>
          <h2>Find the track, use it in practice, improve what comes next.</h2>
          <div className='cmc-home-pathway-grid'>
            <article>
              <span>01</span>
              <h3>Find the track</h3>
              <p>Search by composer, key, instrumentation, uploader, or price, then preview before purchase.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Use it in practice</h3>
              <p>Keep purchased music close to the profile area so players can return to their working material.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Improve the catalogue</h3>
              <p>Comment, request, reward good uploads, and let demand guide what gets created next.</p>
            </article>
          </div>
        </div>
      </Container>
    </section>

    <section className='cmc-home-section'>
      <Container fluid='xl'>
        <Row className='g-5 align-items-start'>
          <Col lg={5}>
            <div className='cmc-home-section-heading'>
              <div className='cmc-home-paper-indent' aria-hidden='true' />
              <div>
                <p className='cmc-kicker'>Digital music archive</p>
                <h2>Catalogue first. Community around every track.</h2>
              </div>
            </div>
          </Col>
          <Col lg={7}>
            <div className='cmc-home-catalogue-preview' aria-label='Catalogue preview'>
              {catalogueRows.map(row => (
                <article className='cmc-home-catalogue-row' key={row.number}>
                  <span className='cmc-home-row-index'>{row.number}</span>
                  <div>
                    <h3>{row.title}</h3>
                    <p>{row.composer}</p>
                  </div>
                  <i className='cmc-home-row-status' aria-hidden='true'>
                    {row.status.map(state => (
                      <span className={`cmc-home-row-status__mark cmc-home-row-status__mark--${state}`} key={state} />
                    ))}
                  </i>
                </article>
              ))}
            </div>
          </Col>
        </Row>
      </Container>
    </section>

    <section className='cmc-home-section cmc-home-section--system'>
      <Container fluid='xl'>
        <Row className='g-5 align-items-start'>
          <Col lg={6}>
            <p className='cmc-kicker'>Marketplace grammar</p>
            <h2>Every state has a visible place in the archive.</h2>
            <p>
              The Paper Bar system gives the product a quiet institutional rhythm:
              textured vertical bars for meaning, staff-line rules for separation, and
              dark readable typography for the work itself.
            </p>
          </Col>
          <Col lg={6}>
            <div className='cmc-home-meaning-list'>
              {systemFlows.map(flow => (
                <article className={`cmc-home-meaning-row cmc-home-meaning-row--${flow.state}`} key={flow.state}>
                  <div>
                    <strong>{flow.title}</strong>
                    <span>{flow.body}</span>
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
