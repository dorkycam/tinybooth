import Link from 'next/link';
import type { Post } from '../../src/lib/blog';
import { PlaceholderFigure } from '../../src/components/blog';

export const post: Post = {
  meta: {
    slug: 'the-instagram-hashtag-is-dead-heres-what-replaced-it',
    title: 'The Instagram hashtag is dead. Here is what replaced it.',
    description:
      'Wedding hashtags stopped working around 2020. WedPics shut down in 2019. The Knot retired Guest in 2022. Here is the QR-code wall pattern hosts actually use now.',
    date: '2026-04-22',
    keywords: [
      'wedding hashtag alternative',
      'wedding photo wall',
      'qr code wedding photos',
      'wedding photo sharing app',
    ],
    heroImageAlt: 'A printed QR code on a wedding table card next to a centerpiece.',
  },
  Body: (): JSX.Element => (
    <>
      <p>
        WedPics shut down in February 2019 with three weeks notice. The Knot retired the Guest app
        in October 2022. The wedding hashtag, which was the workaround couples used in between,
        has been quietly broken since around 2020. If you are getting married in 2026 and you are
        trying to figure out how to actually collect photos from your guests, here is the
        playbook that works now.
      </p>

      <p>
        Short version: print one QR code, point it at a no-app upload page, run the slideshow on
        a TV in the corner. Guests scan, snap, see the photo land on the screen, feel the dopamine,
        upload more. By Sunday morning you have 200 to 850 candid photos in one zip file.
      </p>

      <PlaceholderFigure
        alt="A QR code printed on a 5x7 card sitting next to flowers on a reception table."
        caption="The whole stack is one printed QR card and a TV browser open to the slideshow URL."
      />

      <h2>Why hashtags stopped working</h2>

      <p>
        Wedding hashtags were a workaround in the first place. Instagram is a photo network, but
        it is not your photo network, and the hashtag was a way to coax a broadcast platform into
        acting like a private album. It mostly worked for a few years. It does not anymore, and
        the reasons are not specific to weddings.
      </p>

      <h3>Hashtags are public</h3>

      <p>
        The Snapseek team put it directly: when you use a hashtag, you are splashing your event
        across the public internet, but weddings are personal. A guest who would happily text you
        a photo of grandma will not post that same photo under a public hashtag where strangers
        can browse it. The hashtag asks for the wrong privacy default, and the people who matter
        most opt out.
      </p>

      <h3>Most photos never get posted</h3>

      <p>
        The Knot tracked this when they were running the Guest app: their average wedding got 870
        photos through the app, against 22 photos under the matching Instagram hashtag. Per
        wedding. Same guests. Forty times the volume. Most guests keep favorites on their camera
        roll, share them privately in group chats, or post to Stories that vanish in 24 hours and
        never make it back to you.
      </p>

      <h3>The algorithm buries you</h3>

      <p>
        Even when a guest does post, Instagram&apos;s feed algorithm decides whether the photo
        ranks. If your friend&apos;s photo of grandma crying does not get 500 likes in the first
        hour, it sinks. You will not find it three months later when you go looking.
      </p>

      <h3>Compression eats the quality</h3>

      <p>
        iMessage, WhatsApp, and Instagram all crush photo quality on upload. Even when you do
        manage to find the photo, the version that survived two re-encodings is not the one you
        want printed.
      </p>

      <h2>Why dedicated apps failed too</h2>

      <p>
        Couples who skipped the hashtag tried dedicated apps. WedPics was the first big one and
        the cautionary tale. They built a real product, real users, real revenue, and shut it
        down in February 2019 with three weeks of notice for users to download their photos. The
        Dead Pixels Society ran the obituary. Couples lost wedding memories.
      </p>

      <p>
        The Knot tried to fill the gap with The Guest (formerly Veri). They had the brand, the
        distribution, and the product was good. They retired it for new events in October 2022.
        Existing users could pull photos through June 2024. After that the gallery went dark.
      </p>

      <p>
        And the apps that did not shut down had their own problem: they require guests to install
        an app. Real Knot forum posts:
      </p>

      <blockquote>
        I downloaded WedPics for a friend&apos;s wedding the day before and deleted it the day after.
      </blockquote>

      <blockquote>
        I&apos;m not going to download an app for one event.
      </blockquote>

      <p>
        Every guest who declines is one fewer angle on grandma crying. The math always loses.
      </p>

      <h2>What replaced it: the QR code wall</h2>

      <p>
        The pattern that works in 2026 is built on three pieces. None of them require a guest
        download or a host signup.
      </p>

      <p>
        <strong>One QR code</strong> printed on a card and placed on every table plus one big sign
        at the entrance. The QR resolves to a tiny upload page that opens in any phone&apos;s
        browser.
      </p>

      <p>
        <strong>A live photo wall on a TV</strong> in the room, running the same event&apos;s
        slideshow URL. New uploads appear within two seconds. Guests scan, snap, and look up to
        see their photo land. The room reacts. Uploads spike. Repeat.
      </p>

      <p>
        <strong>A dashboard for the host</strong> that holds every photo and exports the lot as a
        zip file. No third-party app. No public Instagram. Photos owned by the host, available
        for at least 60 days after the event.
      </p>

      <PlaceholderFigure
        alt="A TV mounted near a bar showing a photo slideshow, with a QR code card on the bar surface."
        caption="The slideshow is the dopamine loop. Guests scan, snap, and watch the photo land."
      />

      <h2>How TinyWall does it</h2>

      <p>
        TinyWall is the QR-wall product half of TinyBooth. The free tier covers most parties
        under 100 uploads with a 7-day retention window. Paid events extend retention to 60 or 90
        days, raise the upload cap, and add custom branding so the QR landing page picks up the
        couple&apos;s names and colors.
      </p>

      <p>
        Setup is one minute on{' '}
        <Link href="/wall/new">tinybooth.com/wall/new</Link>. Type an event name, get a TV link
        and a QR code, print the card, open the TV link on a Smart TV browser. There is no guest
        download, no signup, and no app required at any step.
      </p>

      <p>
        The full setup walkthrough lives at{' '}
        <Link href="/blog/qr-code-photo-upload-how-to-set-it-up-at-your-party-in-5-minutes">
          QR code photo upload: how to set it up at your party in 5 minutes
        </Link>
        .
      </p>

      <h2>What about the photo booth?</h2>

      <p>
        The QR wall captures candids. A photo booth captures the posed shots, the tipsy group
        photos, the hour after the dance floor opens when everyone wants a strip. The two
        products are separate but they share a host event in TinyBooth, so booth strips and
        guest uploads land in the same dashboard with the same branding.
      </p>

      <p>
        See{' '}
        <Link href="/app/for-weddings">photo booth app for weddings</Link> for the booth side and
        the rent-vs-DIY math.
      </p>

      <h2>Pick a different name</h2>

      <p>
        One last thing. If you are still stuck on a hashtag because Pinterest convinced you it was
        part of the wedding aesthetic, consider that you can have both. Pick a hashtag if you
        want to. Use it on the program. But also print the QR. The QR is the one that actually
        gets you the photos. The hashtag is just a name for the night.
      </p>

      <h2>Sources</h2>

      <ul>
        <li>
          The Dead Pixels Society obituary on the WedPics shutdown:{' '}
          <a href="https://thedeadpixelssociety.com/wedpics-to-shut-down-feb-15/" rel="noreferrer noopener">
            wedpics-to-shut-down-feb-15
          </a>
          .
        </li>
        <li>
          The Knot Press Release on the original $100 Guest app:{' '}
          <a href="https://www.theknotww.com/press-releases/the-guest-photo-sharing-app/" rel="noreferrer noopener">
            theknotww.com
          </a>
          .
        </li>
        <li>
          POV Camera&apos;s Ahrefs-sourced data on hashtag-vs-QR search volume:{' '}
          <a href="https://pov.camera/blog/wedding-hashtags-vs-qr-code-photo-sharing" rel="noreferrer noopener">
            pov.camera
          </a>
          .
        </li>
        <li>
          Snapseek on why hashtags stopped working:{' '}
          <a href="https://snapseek.app/blog/why-wedding-hashtags-are-dead" rel="noreferrer noopener">
            snapseek.app
          </a>
          .
        </li>
      </ul>
    </>
  ),
};
