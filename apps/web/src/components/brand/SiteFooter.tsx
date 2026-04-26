import Link from 'next/link';

const FOOTER_GROUPS: ReadonlyArray<{
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
}> = [
  {
    title: 'App',
    links: [
      { href: '/app', label: 'TinyBooth' },
      { href: '/app/ipad', label: 'For iPad' },
      { href: '/app/iphone', label: 'For iPhone' },
      { href: '/app/android', label: 'For Android' },
      { href: '/app/for-weddings', label: 'For weddings' },
      { href: '/app/for-birthdays', label: 'For birthdays' },
      { href: '/app/for-corporate-events', label: 'For corporate events' },
    ],
  },
  {
    title: 'Wall',
    links: [
      { href: '/wall', label: 'TinyWall' },
      { href: '/wall/for-weddings', label: 'For weddings' },
      { href: '/wall/live-slideshow', label: 'Live slideshow' },
      { href: '/wall/new', label: 'Create a wall' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/events', label: 'Events' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/help', label: 'Help' },
      { href: '/blog', label: 'Blog' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/legal/privacy', label: 'Privacy' },
      { href: '/legal/terms', label: 'Terms' },
    ],
  },
];

/**
 * Site-wide footer. Mirrors the SiteHeader nav + adds legal and a brand
 * line at the bottom. Microcopy pulled from the brand identity doc.
 */
export function SiteFooter(): JSX.Element {
  return (
    <footer className="border-t border-stone bg-cream/40 mt-16">
      <div className="mx-auto w-full max-w-[1120px] px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm text-graphite">
        {FOOTER_GROUPS.map((group) => (
          <div key={group.title}>
            <h2 className="text-ink font-semibold mb-3">{group.title}</h2>
            <ul className="flex flex-col gap-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-coral transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto w-full max-w-[1120px] px-6 pb-10 pt-2 flex flex-col md:flex-row md:items-end md:justify-between gap-4 text-xs text-graphite">
        <div>
          <p className="font-semibold text-ink">tinybooth</p>
          <p className="mt-1">Take a photo. Get a strip. That&apos;s the whole app.</p>
        </div>
        <p>
          &copy; {new Date().getFullYear()} TinyBooth. Built in Los Angeles.{' '}
          <Link href="/legal/privacy" className="underline hover:text-coral">
            Privacy
          </Link>
          {' . '}
          <Link href="/legal/terms" className="underline hover:text-coral">
            Terms
          </Link>
        </p>
      </div>
    </footer>
  );
}
