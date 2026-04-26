import Link from 'next/link';
import type { Post } from '../../src/lib/blog';
import { PlaceholderFigure } from '../../src/components/blog';

export const post: Post = {
  meta: {
    slug: 'how-to-set-up-an-ipad-photobooth-for-your-wedding',
    title: 'How to set up an iPad photobooth for your wedding',
    description:
      'A real, tested setup guide for a DIY iPad photobooth at a wedding. Stand, ring light, Canon Selphy CP1500, Wi-Fi tips, and Guided Access.',
    date: '2026-04-21',
    keywords: [
      'diy photo booth ipad',
      'how to make a photo booth',
      'ipad wedding photo booth',
      'photo booth app for ipad',
    ],
    heroImageAlt: 'An iPad on a 7-foot light stand with a ring light at a wedding reception.',
  },
  Body: (): JSX.Element => (
    <>
      <p>
        A 360 photo booth rental in the US averages $1,170 for three hours per the 2025 Puddles
        Photo Booth survey. An open-air rental averages $870. Add-ons (custom backdrop, prints,
        attendant, props) push the total up another $150 to $800. The same money buys an iPad
        you keep, a printer you keep, and a software setup you can use at the next ten parties.
      </p>

      <p>
        This is the actual rig. Tested at a real wedding. Hosts on Weddingbee and the WeddingWire
        DIY threads run almost the exact same setup. We will walk through gear, software, the
        Wi-Fi gotchas that ruin booths, and how to lock the iPad so a tipsy guest cannot exit
        the app at 11pm.
      </p>

      <PlaceholderFigure
        alt="An iPad portrait on a 7-foot light stand with a 14 inch ring light, a Canon Selphy on a side table, and a fabric backdrop."
        caption="The complete rig. iPad, ring light, printer, backdrop, power."
      />

      <h2>The shopping list</h2>

      <p>
        Buy these in this order. Total is $300 to $500 depending on what you already own.
      </p>

      <ol>
        <li>
          <strong>iPad (10th gen or newer).</strong> $329 base. Or use the one in your house.
          Portrait orientation is the standard at every wedding thread; the strip output and the
          preview both match.
        </li>
        <li>
          <strong>Tall light stand with a tablet mount.</strong> About $35 on Amazon. Get the 7-
          or 8-foot version, not the 5-foot one. Eye-level for adults, tall enough that kids
          cluster underneath rather than block.
        </li>
        <li>
          <strong>14-inch ring light.</strong> $40 to $60. Wedding venues are dim and tungsten.
          Without a ring light, every strip looks muddy. The 14-inch is the sweet spot of brightness
          to size; the 18-inch is overkill in most rooms.
        </li>
        <li>
          <strong>Canon Selphy CP1500.</strong> $129 to $179. Dye-sublimation, AirPrint, 4x6
          sheets that cut into two 2x6 strips. The Wifibooth forum favorite. Buy the KP-108IN
          paper / ink pack at the same time; it gives you 108 prints (54 strip pairs).
        </li>
        <li>
          <strong>A backdrop.</strong> $30 fabric, or a curtain you already own. Solid colors
          photograph cleaner than busy patterns. Hang it 18 inches behind where guests stand so
          the focus stays on faces and not on the fabric weave.
        </li>
        <li>
          <strong>A power strip plus two long cables.</strong> $20. iPad needs to stay plugged
          in for a 5-hour event. So does the Selphy. Run them off one strip you can hide.
        </li>
        <li>
          <strong>A folding table.</strong> $25 if you are renting one separately. The Selphy
          plus a tray of paper, a pair of scissors, and a small pen for guests to sign their
          strip lives here.
        </li>
      </ol>

      <p>
        Total without the iPad: about $300. With a base iPad: about $620. With a real Selphy:
        about $750. Compared to $870 for an open-air rental of the same three hours.
      </p>

      <h2>The software</h2>

      <p>
        Install <Link href="/app/ipad">TinyBooth</Link> on the iPad. It is free for personal use.
        Set the layout to 1x4 classic in the layout sheet (this gives two strips per Selphy 4x6
        sheet, which doubles your prints per pack).
      </p>

      <p>
        Optional: create a TinyBooth event so the strip carries your names and date in the
        bottom border, and so guest uploads from a TinyWall QR code land in the same dashboard.
        The Event Pass is $14.99 in the app and includes the wall, the dashboard, the bulk
        export, and removes the wordmark from the printed strip.
      </p>

      <p>
        Skip every other photo booth app at the price points they charge. Simple Booth HALO
        starts at $9 a week. LumaBooth is $19.99 a month. Booth.Events runs $49 to $129 monthly.
        For a single wedding you do not need any of that.
      </p>

      <h2>The Wi-Fi setup (this is where most setups die)</h2>

      <p>
        Venue Wi-Fi gets oversaturated when 150 guests connect at the same time. This is the most
        common reason a DIY booth stops printing mid-event. Two fixes:
      </p>

      <ol>
        <li>
          <strong>Use a hotspot, not the venue Wi-Fi.</strong> Tether the iPad and the Selphy to
          your phone&apos;s 5G hotspot. The Selphy connects via Wi-Fi Direct so it will see the
          same network the iPad is on. Two devices on a phone hotspot uses negligible data.
        </li>
        <li>
          <strong>Or run the Selphy on Wi-Fi Direct only.</strong> The Selphy can host its own
          Wi-Fi network. The iPad connects to it for the print job, then switches back to the
          hotspot. This is fiddly to set up but it survives any venue.
        </li>
      </ol>

      <p>
        Test the print path the day before the event with at least 12 prints in a row. The Canon
        Selphy print queue is known to stall in iOS after 8 to 10 prints (the Wifibooth forum
        thread is ten years old and the bug still ships). TinyBooth wraps the print call in a
        12-second timeout and surfaces a one-tap restart when this happens, so you do not have
        to power-cycle the iPad mid-event. Other apps will require a power cycle. Test it.
      </p>

      <h2>Lock the iPad with Guided Access</h2>

      <p>
        Open Settings &gt; Accessibility &gt; Guided Access. Turn it on. Set a passcode. Open
        TinyBooth, triple-click the side button (or the home button on older iPads). The iPad is
        now locked into TinyBooth. Triple-click again with your passcode to unlock it.
      </p>

      <p>
        Without Guided Access, every drunk guest at 11pm tries to swipe out of the app to text
        their friend. With it, the only thing they can do is take a strip.
      </p>

      <h2>Where to put the booth in the room</h2>

      <p>
        Three rules:
      </p>

      <ul>
        <li>
          <strong>Near a power outlet.</strong> Not optional. The iPad and the Selphy both need
          full power for the night. Running cables across a dance floor is a tripping hazard and
          looks bad.
        </li>
        <li>
          <strong>Away from the dance floor.</strong> Far enough that the booth does not get knocked
          over, close enough that guests find it on the way to the bar.
        </li>
        <li>
          <strong>With a sight line to the TV.</strong> If you also have a TinyWall slideshow
          running on a TV, place the booth so guests can see it while waiting their turn. The two
          products feed each other.
        </li>
      </ul>

      <h2>Operator (yes, you need one)</h2>

      <p>
        The biggest mistake DIY hosts make is unattended-booth-with-no-operator. The iPad sits in
        the corner, the Selphy stalls, nobody notices for an hour. Assign one person (an aunt, a
        cousin, a paid attendant for $30 an hour) to check the booth every 30 minutes for the
        first half of the night and once an hour after that. They:
      </p>

      <ul>
        <li>Tap the &ldquo;restart printing&rdquo; button if it surfaces.</li>
        <li>Reload the Selphy with new paper if the tray empties.</li>
        <li>Confirm the iPad is still on TinyBooth and not on the Notes app.</li>
        <li>Catch a guest who is taking 30 strips because they think they have to.</li>
      </ul>

      <h2>The strip itself</h2>

      <p>
        The default 1x4 classic strip is sized for a 2x6 print: four photos vertical, with a 32px
        gutter, on a Cream background that mimics real photo paper. The bottom of the strip
        carries the event branding when you set one (your names, your event color). Without an
        event, the bottom carries a small &ldquo;tinybooth.com&rdquo; wordmark; the $14.99 Event
        Pass removes it.
      </p>

      <p>
        Use a paper trimmer to cut down the middle of each Selphy 4x6. You get two strips per
        sheet. The KP-108IN pack of paper plus ink runs about $35 and gives you 108 prints, so
        $0.32 per strip. Plan around 3 strips per attending guest as the upper bound; most
        weddings end the night with 70 to 100 strips printed.
      </p>

      <PlaceholderFigure
        alt="A printed 2x6 photo strip showing four photos and an event branding bar at the bottom."
        caption="The 1x4 classic strip. Cut the 4x6 down the middle. Two strips per sheet."
      />

      <h2>Add the wall, get the candids too</h2>

      <p>
        The booth catches the posed photos. The wall catches everything else: the cousin&apos;s
        photo of grandma crying, the couple sneaking off to the patio, the moment the dance floor
        opened. Real Knot forum posts report 200 to 850 guest uploads per wedding when you run
        the wall.
      </p>

      <p>
        Set up a TinyWall in the same event from the dashboard. Print one QR card, hang it near
        the bar, run the slideshow on a venue TV. No app for guests, no signup, no friction. See{' '}
        <Link href="/wall/for-weddings">wedding photo wall</Link> for the wall side.
      </p>

      <h2>Day-of checklist</h2>

      <ol>
        <li>iPad fully charged. Charger plugged in.</li>
        <li>Selphy plugged in. New ink and paper loaded. KP-108IN spare in the bag.</li>
        <li>Tethered to your phone&apos;s hotspot, not venue Wi-Fi.</li>
        <li>Guided Access on. Passcode tested.</li>
        <li>Layout set to 1x4 classic. Random message on.</li>
        <li>Test strip printed. Operator briefed.</li>
        <li>QR code for the wall printed and on every table.</li>
        <li>Slideshow URL open on the venue TV in full-screen browser mode.</li>
      </ol>

      <p>
        That is the whole setup. About 90 minutes the morning of the wedding. Everything works
        for the next ten parties you throw, too.
      </p>

      <h2>Sources</h2>

      <ul>
        <li>
          Puddles Photo Booth 2025 rental cost guide:{' '}
          <a href="https://www.puddlesphotobooth.com/2025-photo-booth-rental-costs" rel="noreferrer noopener">
            puddlesphotobooth.com
          </a>
          .
        </li>
        <li>
          Wifibooth forum thread on the Selphy queue stall:{' '}
          <a href="https://wifibooth.com/community/viewtopic.php?t=2159" rel="noreferrer noopener">
            wifibooth.com
          </a>
          .
        </li>
        <li>
          Joy Factory tablet photobooth setup guide:{' '}
          <a href="https://blog.thejoyfactory.com/how-to-setup-a-mobile-tablet-photo-booth" rel="noreferrer noopener">
            blog.thejoyfactory.com
          </a>
          .
        </li>
      </ul>
    </>
  ),
};
