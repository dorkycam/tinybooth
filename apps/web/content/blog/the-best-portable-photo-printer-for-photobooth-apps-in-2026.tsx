import Link from 'next/link';
import type { Post } from '../../src/lib/blog';
import { PlaceholderFigure } from '../../src/components/blog';

export const post: Post = {
  meta: {
    slug: 'the-best-portable-photo-printer-for-photobooth-apps-in-2026',
    title: 'The best portable photo printer for photobooth apps in 2026',
    description:
      'Canon Selphy CP1500 vs CP1300 vs DNP DS-RX1HS. Prints-per-pack math, AirPrint quirks, and why we recommend the Selphy CP1500 for DIY photobooths.',
    date: '2026-04-20',
    keywords: [
      'photo booth printer',
      'canon selphy cp1500',
      'airprint photo booth',
      'photo booth printer for iphone',
      'best portable photo printer',
    ],
    heroImageAlt: 'A Canon Selphy CP1500 printing a 2x6 photo strip on a side table.',
  },
  Body: (): JSX.Element => (
    <>
      <p>
        Three printers cover the entire DIY photobooth market in 2026: the Canon Selphy CP1500
        (current), the Canon Selphy CP1300 (still everywhere on used markets), and the DNP
        DS-RX1HS (the pro lab unit). One of them is right for almost every DIY setup. The
        recommendation is the Selphy CP1500 if you have a budget under $200; the DNP if you are
        running the booth as a side hustle and you need 700 prints in three hours.
      </p>

      <p>
        Here is the math, the AirPrint compatibility notes, and the quirk every DIY host hits
        the first time they try to print a 2x6 strip.
      </p>

      <PlaceholderFigure
        alt="A Canon Selphy CP1500 next to a stack of KP-108IN paper packs."
        caption="The Canon Selphy CP1500 with a KP-108IN paper / ink pack."
      />

      <h2>The recommendation: Canon Selphy CP1500</h2>

      <p>
        Around $129 to $179 depending on the season. Dye-sublimation, AirPrint, 4x6 sheets, the
        TikTok and Weddingbee DIY favorite. A user on a wedding-bee thread put it bluntly: she
        bought a Selphy from Best Buy &ldquo;for a fraction of what a photobooth would cost&rdquo;
        and that was the entire booth.
      </p>

      <p>
        Why the CP1500 over the CP1300:
      </p>

      <ul>
        <li>
          <strong>Wi-Fi speed.</strong> The CP1500 has updated radio and a snappier mobile-print
          implementation. The CP1300 works fine but the first connection is slower.
        </li>
        <li>
          <strong>Battery option.</strong> Optional NB-CP2LH battery pack lets you run the
          printer cordless for a full event. Useful at outdoor venues with no nearby outlet.
        </li>
        <li>
          <strong>Same paper.</strong> Both use KP-108IN postcard paper / ink packs. If you have a
          stash of CP1300 paper it works on the CP1500.
        </li>
      </ul>

      <h3>Prints per pack</h3>

      <p>
        KP-108IN is the standard pack. 108 sheets of 4x6, plus matching dye-sub ink. Around $35.
        That is $0.32 per 4x6 sheet. If you cut each 4x6 down the middle you get two 2x6 strips
        per sheet, which is $0.16 per strip.
      </p>

      <p>
        The bigger pack is KP-36IP (a 36-sheet pack) which is the same paper at the same per-sheet
        cost; not worth it unless you only have shelf space for the smaller box. There is also
        KL-36IP for 5x7 prints (Selphy CP1500 supports 5x7) at about $0.45 per print.
      </p>

      <h3>Speed and reliability</h3>

      <p>
        About 41 seconds per 4x6 print. So roughly 80 seconds per pair of strips when you print
        a full sheet. At a busy wedding the limiting factor is operator-side, not printer-side;
        guests take strips faster than the printer outputs.
      </p>

      <p>
        The reliability story is mostly good with one big asterisk: the iOS print queue stalls
        after 8 to 10 prints. The bug is in iOS Print Center, not the Selphy. The Wifibooth
        forum thread on it is a decade old. TinyBooth handles this in software (12-second
        timeout, one-tap queue restart). Most other photobooth apps require a full iPad reboot
        to recover.
      </p>

      <h2>The runner-up: Canon Selphy CP1300</h2>

      <p>
        Discontinued by Canon but still sold used and refurbished for $90 to $110. Use the same
        KP-108IN paper. Same per-print cost. Same general workflow. Slower Wi-Fi setup. No
        battery option from Canon. Buy it only if you find one for under $100 and you do not
        plan to scale beyond one booth.
      </p>

      <h2>The pro choice: DNP DS-RX1HS</h2>

      <p>
        Around $1,000 used or $1,400 new. Used by every photo booth rental company in the US and
        most overseas. 12 to 15 seconds per 4x6 print, 700-sheet capacity per ribbon roll, native
        2x6 strip cutting. Connects via USB to a Mac or PC; AirPrint support requires a third-party
        bridge like the Mac-and-PC printing companion that Booth.Events sells.
      </p>

      <p>
        Buy this only if:
      </p>
      <ul>
        <li>You are running multiple booths a year as a side business.</li>
        <li>You have a Mac or PC to bridge the iPad to the printer.</li>
        <li>You need to print 200+ strips in a single night.</li>
      </ul>

      <p>
        For a single wedding it is overkill. The Selphy will keep up.
      </p>

      <h2>What about Canon Pixma or HP photo printers?</h2>

      <p>
        Pixma photo printers are inkjet, not dye-sub. Inkjet prints are slower (90+ seconds per
        4x6), use up to 6 ink cartridges that empty unevenly, and the prints smear if a guest
        touches them while wet. They are the wrong tool. Dye-sub seals the print as it comes out
        of the printer; you can hand it to a guest immediately.
      </p>

      <p>
        HP Sprocket and similar Zink printers print 2x3 stickers, not strips. Cute for a baby
        shower; wrong size for a 2x6 wedding strip.
      </p>

      <h2>The 2x6 strip quirk every host hits</h2>

      <p>
        AirPrint does not have a native 2x6 paper size. The Selphy print sheet on iOS shows you
        4x6 (postcard) and that is it. The way you make 2x6 strips work is to design the strip
        as a 2x6 image embedded inside a 4x6 sheet, with the second half either blank or holding
        a duplicate of the first.
      </p>

      <p>
        TinyBooth ships this as the default for the 1x4 classic layout. The strip prints centered
        on a 4x6 sheet with a faint cut line down the middle. Use a paper trimmer to cut the
        sheet in half. You get one strip per print, with the option to enable
        &ldquo;double-print&rdquo; mode that puts the same strip on both halves so each guest gets
        a copy and the couple keeps a copy.
      </p>

      <p>
        Other apps either skip 2x6 entirely (forcing you to print 4x6 collages) or hide it
        behind a paid &ldquo;custom paper size&rdquo; feature. There is no extra fee for it in
        TinyBooth.
      </p>

      <h2>Bring spare paper</h2>

      <p>
        The single most embarrassing failure mode at a DIY booth is the printer running out of
        paper at 10pm with 50 guests still in line. Bring two full KP-108IN packs to a wedding
        of 100. Bring three to a wedding of 150. The unused paper does not expire; you keep it
        for the next event.
      </p>

      <h2>Other things you actually need</h2>

      <ul>
        <li>
          <strong>A paper trimmer.</strong> $25 at any office supply store. Cut the 4x6 sheets
          down to 2x6 strips at the booth.
        </li>
        <li>
          <strong>A small tray for the printed strips.</strong> Hosts on Reddit recommend a
          shallow ceramic tray; the prints are dry as soon as the Selphy ejects them but the
          tray keeps them organized.
        </li>
        <li>
          <strong>A pen.</strong> Sharpie or paint pen. Guests write a note on the bottom of the
          strip for a guest book. This is the entire wedding-tradition tie-in.
        </li>
      </ul>

      <h2>The full DIY rig with a Selphy</h2>

      <p>
        See{' '}
        <Link href="/blog/how-to-set-up-an-ipad-photobooth-for-your-wedding">
          how to set up an iPad photobooth for your wedding
        </Link>{' '}
        for the complete shopping list and Wi-Fi setup. The Selphy is one piece of a larger setup
        that runs $300 to $500 all-in.
      </p>

      <p>
        TinyBooth is the app side of the rig. It is free for personal use and{' '}
        <Link href="/help">supports AirPrint</Link> to any compatible printer including the
        Selphy CP1500, CP1300, and the DNP via a Mac/PC bridge.
      </p>

      <h2>Sources</h2>

      <ul>
        <li>
          Simple Booth&apos;s 2024 photo booth printer roundup:{' '}
          <a href="https://www.simplebooth.com/blog/best-photo-booth-printers/" rel="noreferrer noopener">
            simplebooth.com
          </a>
          .
        </li>
        <li>
          Wifibooth forum on Selphy AirPrint queue stalls:{' '}
          <a href="https://wifibooth.com/community/viewtopic.php?t=2159" rel="noreferrer noopener">
            wifibooth.com
          </a>
          .
        </li>
        <li>
          Weddingbee thread on Selphy DIY booth printing:{' '}
          <a href="https://boards.weddingbee.com/topic/ipad-wedding-photobooth-any-experiencesuggestions/" rel="noreferrer noopener">
            boards.weddingbee.com
          </a>
          .
        </li>
      </ul>
    </>
  ),
};
