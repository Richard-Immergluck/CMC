import Link from 'next/link'
import { Container } from 'react-bootstrap'
import { BrandMark } from './brand'

const footerGroups = [
  {
    title: 'Platform',
    links: [
      { label: 'Catalogue', href: '/catalogue' },
      { label: 'Upload tracks', href: '/upload' },
      { label: 'Profile', href: '/profile' },
      { label: 'Cart', href: '/cart' }
    ]
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact', href: 'mailto:hello@classicalmusiccatalogue.com' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Help centre', href: '/help' },
      { label: 'Track requests', href: '/requests' }
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Sitemap', href: '/sitemap' },
      { label: 'Accessibility', href: '/accessibility' },
      { label: 'Privacy', href: '/privacy' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms', href: '/terms' },
      { label: 'Copyright', href: '/copyright' },
      { label: 'Licensing', href: '/licensing' },
      { label: 'Cookies', href: '/cookies' }
    ]
  }
]

const FooterLink = ({ href, label }) => {
  if (href.startsWith('mailto:')) {
    return <a href={href}>{label}</a>
  }

  return <Link href={href}>{label}</Link>
}

const Footer = () => (
  <footer className='cmc-footer'>
    <Container>
      <div className='cmc-footer__inner'>
        <div className='cmc-footer__brand'>
          <BrandMark compact wordmark='initials' />
          <p>
            A marketplace and community archive for classical music backing tracks.
          </p>
        </div>
        <nav className='cmc-footer__nav' aria-label='Footer navigation'>
          {footerGroups.map(group => (
            <section className='cmc-footer__group' key={group.title}>
              <h2>{group.title}</h2>
              <ul>
                {group.links.map(link => (
                  <li key={link.label}>
                    <FooterLink href={link.href} label={link.label} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </div>
      <div className='cmc-footer__base'>
        <span>&copy; 2026 Classical Music Catalogue</span>
        <span>Placeholder footer links for product development.</span>
      </div>
    </Container>
  </footer>
)

export default Footer
