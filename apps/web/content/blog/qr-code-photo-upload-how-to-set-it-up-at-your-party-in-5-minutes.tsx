import Link from 'next/link';
import type { Post } from '../../src/lib/blog';
import { PlaceholderFigure } from '../../src/components/blog';

export const post: Post = {
  meta: {
    slug: 'qr-code-photo-upload-how-to-set-it-up-at-your-party-in-5-minutes',
    title: 'QR code photo upload: how to set it up at your party in 5 minutes',
    description:
      'A 5-step setup for a no-app QR code photo wall at a party. From printing the QR card to opening the slideshow on a Smart TV.',
    date: '2026-04-15',
    keywords: [
      'qr code photo upload',
      'qr code photo wall',
      'guest photo upload',
      'collect photos from guests',
    ],
    heroImageAlt: 'A printed QR code card on a party table next to a centerpiece.',
  },
  Body: (): JSX.Element => (
    <>
      <p>
        Five steps. About five minutes if you have a printer. The result is a no-app QR code
        photo wall on a TV at your party that guests can post to without downloading anything,
        without signing up, and without typing a name. Photos appear on the screen in under two
        seconds.
      </p>

      <p>
        This works for weddings, birthdays, baby showers, holiday parties, corporate events,
        graduation parties. Anywhere with a TV with a browser (basically every Smart TV from
        2018 on) plus a stack of printable cardstock.
      </p>

      <h2>Step 1: Create a free wall</h2>

      <p>
        Go to <Link href="/wall/new">tinybooth.com/wall/new</Link>. Type an event name (the
        couple&apos;s names, the birthday, the company event title, anything). Tap Create. You
        get back a TV link and a QR code.
      </p>

      <p>
        No account. No card. Free events get 100 uploads and 7 days of retention with the live
        slideshow included. If you need more, upgrade to Event Pass for $14.99 (in-app) or $12.99
        (web) which raises the cap to 150 guests and extends retention to 60 days.
      </p>

      <PlaceholderFigure
        alt="The TinyWall create-event form filled in with an event name and a green Create button."
        caption="One field, one tap. The whole setup starts here."
      />

      <h2>Step 2: Print the QR card</h2>

      <p>
        Right-click the QR code on the success screen and save it. Drop it into a Word doc or a
        Google Doc. Print it onto cardstock at one card per page (for the entrance sign) and
        four cards per page (for table tents).
      </p>

      <p>
        Recommended sizes:
      </p>

      <ul>
        <li>
          <strong>Entrance sign:</strong> 5x7 with the QR centered, the event name above, and a
          one-line caption like &ldquo;Scan and share photos with us.&rdquo;
        </li>
        <li>
          <strong>Table tents:</strong> 4x6 folded, QR on one side, instruction on the other.
        </li>
        <li>
          <strong>Bar card:</strong> 3x5, vertical, QR plus &ldquo;upload from your phone, see it
          on the screen.&rdquo;
        </li>
      </ul>

      <p>
        Print one entrance sign and one card per table. Most weddings need 8 to 12 cards total;
        most birthdays need 3 to 5. If the venue has a printer, you can do this morning-of. If
        not, print the night before.
      </p>

      <h2>Step 3: Open the slideshow on a TV</h2>

      <p>
        Pick the option that matches the room:
      </p>

      <h3>Smart TV browser (easiest)</h3>

      <p>
        Most TVs from 2018 on have a built-in web browser. Open it from the TV remote. Type the
        TV link from the success screen (or save it as a bookmark on your phone and AirDrop the
        URL). Open the URL, tap full-screen, walk away.
      </p>

      <p>
        Confirmed working on LG webOS, Samsung Tizen, and Google TV browsers.
      </p>

      <h3>AirPlay from a Mac</h3>

      <p>
        Open the wall URL in Safari on your laptop. Click the AirPlay icon in the menu bar.
        Stream to an Apple TV connected to the venue display. Works on AirPlay 2 receivers and
        Apple TVs from 2015 on.
      </p>

      <h3>Chromecast or HDMI</h3>

      <p>
        Plug a $30 Chromecast into the TV&apos;s HDMI port. Cast a Chrome tab from any laptop.
        Or run an HDMI cable from a laptop directly to the TV. Both work on any TV with an
        HDMI input.
      </p>

      <h2>Step 4: Test the path before guests arrive</h2>

      <p>
        Before the party starts, test the round trip:
      </p>

      <ol>
        <li>Pick up your phone.</li>
        <li>Scan the printed QR with the camera app.</li>
        <li>Tap the link that appears.</li>
        <li>Take a photo (or pick one from the camera roll).</li>
        <li>Tap upload.</li>
        <li>Look at the TV. The photo should appear within 2 seconds.</li>
      </ol>

      <p>
        If anything in this path breaks (the QR does not scan, the upload page does not load,
        the photo does not appear on the TV), fix it before guests arrive. The most common
        failure is the venue Wi-Fi not letting devices talk to each other; the fix is to use a
        phone hotspot or to ask the venue for the Wi-Fi password.
      </p>

      <h2>Step 5: Place the cards and let it run</h2>

      <p>
        Best placements:
      </p>

      <ul>
        <li>
          <strong>The entrance.</strong> First card guests see. About 60 percent of uploads come
          from the entrance card.
        </li>
        <li>
          <strong>Every dinner table.</strong> The card sits on the table all night and keeps
          getting picked up.
        </li>
        <li>
          <strong>The bar.</strong> Guests are standing, looking around, scanning everything in
          sight. The bar is high-converting.
        </li>
        <li>
          <strong>Near the TV.</strong> A card next to the TV. Guests see the slideshow, look
          for the QR, find it, scan, post.
        </li>
      </ul>

      <p>
        Bad placements:
      </p>

      <ul>
        <li>The bathroom. People do not stand in there long enough.</li>
        <li>The dance floor. Cards get stepped on.</li>
        <li>Centered above the cake. Nobody scans things during the cake cutting.</li>
      </ul>

      <h2>Pro tips</h2>

      <ul>
        <li>
          <strong>Test the QR with at least three phones.</strong> An iPhone, an Android, and one
          older device. The default Camera app on iOS 11+ and Android 8+ both scan QRs natively;
          older devices may need the Google Lens or a third-party scanner.
        </li>
        <li>
          <strong>Keep the slideshow URL bookmarked on your phone.</strong> If the TV crashes or
          someone changes the channel, you can re-cast in 30 seconds.
        </li>
        <li>
          <strong>Add a one-line caption to the card.</strong> &ldquo;Help us catch the angles
          our photographer missed&rdquo; converts better than just &ldquo;Scan to share
          photos.&rdquo;
        </li>
        <li>
          <strong>Brand the QR landing page.</strong> On Event Pass, set custom colors and a
          logo so the upload page picks them up. Guests see the event name when they land,
          which feels more legitimate than a generic page.
        </li>
        <li>
          <strong>Download the morning after.</strong> Open the dashboard, tap Export, get a
          zip URL. Move the zip into Google Drive. Done. See{' '}
          <Link href="/blog/event-photo-retention-how-long-should-you-keep-the-photos">
            event photo retention
          </Link>{' '}
          for why.
        </li>
      </ul>

      <h2>What guests see</h2>

      <p>
        When a guest scans the QR, their phone opens a small upload page in the browser. The page
        shows the event name. They tap a button labeled &ldquo;Take a photo&rdquo; or
        &ldquo;Choose from camera roll.&rdquo; The phone&apos;s camera opens. They take or pick
        a photo. They tap upload. A success message appears. The photo lands on the TV in 1 to
        2 seconds.
      </p>

      <p>
        Total guest time: 15 to 30 seconds. No app, no signup, no name field by default.
      </p>

      <h2>Common questions guests ask</h2>

      <p>
        <strong>&ldquo;Can I upload more than one photo?&rdquo;</strong> Yes. Each upload is one
        post. Take 5 photos, do 5 uploads.
      </p>

      <p>
        <strong>&ldquo;Where do my photos go?&rdquo;</strong> They go into the host&apos;s
        gallery for the event. The host downloads them as a zip after the event.
      </p>

      <p>
        <strong>&ldquo;Can I delete my photo if I do not like it?&rdquo;</strong> Not as a guest
        in the current version. The host can remove individual photos from the dashboard.
      </p>

      <p>
        <strong>&ldquo;Does my phone need to be on the venue Wi-Fi?&rdquo;</strong> No. The
        upload uses your normal cell connection. Wi-Fi just makes the upload faster.
      </p>

      <h2>Add the booth too</h2>

      <p>
        For weddings and milestone events, run a TinyBooth photo booth on an iPad in the same
        event. Booth strips and guest uploads share the same dashboard, the same branding, the
        same export. See{' '}
        <Link href="/blog/how-to-set-up-an-ipad-photobooth-for-your-wedding">
          how to set up an iPad photobooth for your wedding
        </Link>
        .
      </p>

      <p>
        Or just stick with the wall. The wall by itself is a complete experience. The booth is a
        nice add when you have the budget.
      </p>
    </>
  ),
};
