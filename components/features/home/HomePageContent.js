'use client'

import Link from 'next/link'
import { Button, Col, Container, Row } from 'react-bootstrap'

const communityPillars = [
  {
    title: 'Recover hidden work',
    body: 'Home-made accompaniments, cue tracks, studies, reductions, and practice recordings can move from forgotten folders into a searchable catalogue.'
  },
  {
    title: 'Reward useful tracks',
    body: 'Uploaders can earn from music that solves real practice problems, while popular and reliable tracks can be surfaced more prominently over time.'
  },
  {
    title: 'Shape the next upload',
    body: 'Comments, requests, and profile activity are intended to help musicians ask for missing repertoire and improve what already exists.'
  }
]

const profileFeatures = [
  'Purchased and downloaded music in one place',
  'Track comments and community requests tied to a real profile',
  'Uploader pages that show catalogue, style, status, and contribution history',
  'Signals for frequently purchased, trusted, and actively discussed tracks'
]

const HomePageContent = () => (
  <main className='cmc-home-page'>
    <section className='cmc-home-hero'>
      <Container fluid='xl'>
        <Row className='align-items-end g-5'>
          <Col lg={8}>
            <p className='cmc-kicker'>Classical music marketplace</p>
            <h1>Backing tracks should not gather dust.</h1>
            <p className='cmc-home-copy'>
              CMBC is being built as a specialist marketplace for classical musicians:
              a place to publish useful home-made backing tracks, buy practice-ready
              recordings, request missing repertoire, and build reputation around the
              music people actually use.
            </p>
            <div className='cmc-home-actions'>
              <Link href='/catalogue' className='cmc-button cmc-button--secondary'>
                Browse catalogue
              </Link>
              <Button
                variant='outline-secondary'
                href='/auth/signin?callbackUrl=/catalogue'
                className='cmc-home-auth-button'
              >
                Sign in or register
              </Button>
            </div>
          </Col>
          <Col lg={4}>
            <aside className='cmc-home-market-note' aria-label='Marketplace summary'>
              <span>Marketplace loop</span>
              <strong>Upload. Discover. Discuss. Request.</strong>
              <p>
                The product is more than a file shop: every track can become part of a
                living practice network for players, teachers, accompanists, and arrangers.
              </p>
            </aside>
          </Col>
        </Row>
      </Container>
    </section>

    <section className='cmc-home-section cmc-home-section--split'>
      <Container fluid='xl'>
        <Row className='g-5 align-items-start'>
          <Col lg={5}>
            <p className='cmc-kicker'>Why it exists</p>
            <h2>Useful accompaniments are already being made. The platform gives them somewhere to live.</h2>
          </Col>
          <Col lg={7}>
            <div className='cmc-home-pillar-grid'>
              {communityPillars.map(pillar => (
                <article className='cmc-home-pillar' key={pillar.title}>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.body}</p>
                </article>
              ))}
            </div>
          </Col>
        </Row>
      </Container>
    </section>

    <section className='cmc-home-section cmc-home-section--dark'>
      <Container fluid='xl'>
        <Row className='g-5 align-items-center'>
          <Col lg={6}>
            <p className='cmc-kicker'>For musicians</p>
            <h2>Profiles should make ownership, contribution, and conversation visible.</h2>
            <p>
              Buyers need fast access to purchased tracks and downloads. Uploaders need a
              place to show what they have contributed. The community needs a way to
              comment on tracks and request the repertoire that is missing.
            </p>
          </Col>
          <Col lg={6}>
            <ul className='cmc-home-feature-list'>
              {profileFeatures.map(feature => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </Col>
        </Row>
      </Container>
    </section>

    <section className='cmc-home-section'>
      <Container fluid='xl'>
        <div className='cmc-home-pathway'>
          <p className='cmc-kicker'>The intended product shape</p>
          <h2>Catalogue first, community next, reputation over time.</h2>
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
  </main>
)

export default HomePageContent
