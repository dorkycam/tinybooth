import Link from 'next/link';
import type { Post } from '../../src/lib/blog';
import { PlaceholderFigure } from '../../src/components/blog';

export const post: Post = {
  meta: {
    slug: 'the-ultimate-photo-strip-layout-guide-1x4-2x2-and-more',
    title: 'The ultimate photo strip layout guide: 1x4, 2x2, and more',
    description:
      'When to use the 1x4 classic strip vs 2x2 grid vs 1x3 vs single shot vs 1x6 double. Sample strips, paper sizes, and the layout picker in TinyBooth.',
    date: '2026-04-17',
    keywords: [
      '2x2 photo booth template',
      'classic photo strip layout',
      'photostrip app',
      '4 photo strip app',
      'photo strip maker app',
    ],
    heroImageAlt: 'Five photo strip layouts shown side by side: 1x4, 2x2, 1x3, single, 1x6 double.',
  },
  Body: (): JSX.Element => (
    <>
      <p>
        Five layouts cover almost every photo strip use case. TinyBooth ships all five. Picking
        the right one depends on three things: the paper you have, the print orientation that
        feels most booth-like, and whether you want one strip or two from each sheet of paper.
      </p>

      <p>
        Quick recommendation: 1x4 classic for weddings, 2x2 for casual at-home shoots, single
        for portrait nights with a backdrop. The other two cover edge cases.
      </p>

      <h2>1x4 classic strip (the default)</h2>

      <p>
        Four photos vertical, in a 2x6 strip. The original photobooth output. The aspect ratio
        and the rhythm of four small frames is what the brain reads as &ldquo;photo booth.&rdquo;
        Print on a 4x6 dye-sub sheet (Canon Selphy KP-108IN works) and cut down the middle to get
        two strips per print, or enable double-print to put the same strip on both halves so the
        guest takes one and the couple keeps one.
      </p>

      <PlaceholderFigure
        alt="A 1x4 classic photo strip with four square photos stacked vertically and event branding at the bottom."
        ratio={{ w: 1, h: 3 }}
        caption="The 1x4 classic. Four photos, 2x6 strip, two strips per Selphy 4x6 sheet."
      />

      <p>
        <strong>Best for:</strong> weddings, milestone birthdays, anything where the printed
        artifact is the point.
      </p>

      <p>
        <strong>Why it works:</strong> the rhythm of a 3-second countdown plus a random message
        plus four shots in a row catches a real progression of expressions. The first shot is
        always stiff. The third is always the best.
      </p>

      <h2>2x2 grid</h2>

      <p>
        Four photos in a 2x2 grid, square output. Print on a 4x4 sheet or a 4x6 with white
        margins. The newer Polaroid-style aesthetic. Better for groups of 3 or 4 because the
        wider format keeps everyone in frame.
      </p>

      <p>
        <strong>Best for:</strong> casual at-home use, baby showers, holiday parties.
      </p>

      <p>
        <strong>Why it works:</strong> a square grid reads as social-media-native. Guests take
        the strip, snap a photo of it, post to Stories. The aspect ratio matches Instagram.
      </p>

      <h2>1x3 strip</h2>

      <p>
        Three photos vertical. Tighter print, less space for branding at the bottom. Good when
        you only have room for a name and a date and you want each photo bigger than 1x4 lets
        you go.
      </p>

      <p>
        <strong>Best for:</strong> graduations, sweet sixteens, anywhere you want more visible
        face per print.
      </p>

      <p>
        <strong>Why it works:</strong> three frames is the minimum that feels like a sequence.
        Two photos feels like a pair. Three photos feels like a story.
      </p>

      <h2>Single shot (4x6)</h2>

      <p>
        One photo, full 4x6. Or 5x7 with the right paper. The portrait night option. Best when
        you have a real backdrop and a ring light and you want each guest to leave with one
        beautiful photo, not a strip of small faces.
      </p>

      <PlaceholderFigure
        alt="A single 4x6 portrait photo on Cream paper with a small caption strip at the bottom."
        ratio={{ w: 2, h: 3 }}
        caption="Single shot. Full 4x6. Portrait night with a backdrop."
      />

      <p>
        <strong>Best for:</strong> headshot booths at corporate events, portrait night with a
        ring light, family reunions where you want a print of each branch.
      </p>

      <p>
        <strong>Why it works:</strong> the single shot cuts the photo-booth pretense and gives
        you a portrait. If the backdrop is good and the lighting is good, the print is one you
        keep.
      </p>

      <h2>1x6 double</h2>

      <p>
        Six photos, two columns of three. Wider than a classic strip. Migrated from the original
        Swift TinyBooth app where the 1x4 actually printed two columns to fill a 4x6 sheet.
        Preserved as an option for hosts who already know it.
      </p>

      <p>
        <strong>Best for:</strong> photo-booth nostalgia where the couple wants more frames per
        guest, or for events where two guests at a time take strips together.
      </p>

      <p>
        <strong>Why it works:</strong> six frames hits the ceiling of attention span. After six
        the guest is ready to move on.
      </p>

      <h2>The picker in TinyBooth</h2>

      <p>
        Tap the small layout icon next to the shutter. The bottom sheet slides up with all five
        layouts as a grid. Tap one. The picker remembers your choice for the rest of the session.
      </p>

      <p>
        The 1x4 classic is the default for new installs because it is the layout people picture
        when they say &ldquo;photo booth.&rdquo; The default is set per session; if a wedding host
        prefers 2x2, switching once at the start of the night is the only operator action.
      </p>

      <h2>Paper math by layout</h2>

      <table className="my-6 text-sm w-full border-collapse">
        <thead>
          <tr className="border-b border-stone">
            <th className="text-left py-2 pr-4 font-semibold text-ink">Layout</th>
            <th className="text-left py-2 pr-4 font-semibold text-ink">Aspect</th>
            <th className="text-left py-2 pr-4 font-semibold text-ink">Print size</th>
            <th className="text-left py-2 pr-4 font-semibold text-ink">Per Selphy 4x6</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">1x4 classic</td>
            <td className="py-2 pr-4">1:3</td>
            <td className="py-2 pr-4">2x6 strip</td>
            <td className="py-2 pr-4">2 strips per sheet</td>
          </tr>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">2x2 grid</td>
            <td className="py-2 pr-4">1:1</td>
            <td className="py-2 pr-4">4x4 square</td>
            <td className="py-2 pr-4">1 grid (white margins)</td>
          </tr>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">1x3 strip</td>
            <td className="py-2 pr-4">1:2.5</td>
            <td className="py-2 pr-4">2.4x6</td>
            <td className="py-2 pr-4">2 strips per sheet</td>
          </tr>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">Single</td>
            <td className="py-2 pr-4">2:3</td>
            <td className="py-2 pr-4">4x6 full</td>
            <td className="py-2 pr-4">1 print per sheet</td>
          </tr>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">1x6 double</td>
            <td className="py-2 pr-4">2:3</td>
            <td className="py-2 pr-4">4x6 (two columns)</td>
            <td className="py-2 pr-4">1 print per sheet</td>
          </tr>
        </tbody>
      </table>

      <h2>Branding zone per layout</h2>

      <p>
        Every layout reserves a branding zone at the bottom (or, for the 2x2, across the bottom).
        On the free tier this carries a small &ldquo;tinybooth.com&rdquo; wordmark. On a paid
        event it carries your event branding (logo + names + date). The zone height is
        proportional to the strip:
      </p>

      <ul>
        <li>1x4 classic: 190px tall (about 10 percent of strip).</li>
        <li>2x2 grid: 80px tall (single horizontal bar at bottom).</li>
        <li>1x3 strip: 130px (proportional).</li>
        <li>Single: 18px white margin only (preserves photo space).</li>
        <li>1x6 double: 190px (matches the 1x4).</li>
      </ul>

      <h2>The random message survives every layout</h2>

      <p>
        The random message after each shot is layout-independent. Whether you are in 1x4 or
        single mode, the message renders between captures in Caveat handwriting on the live
        preview. The message does not appear on the printed strip; it only shows during the
        shoot as the &ldquo;cooking your strip&rdquo; moment.
      </p>

      <p>
        On Event Pass Plus, you add up to 50 of your own one-liners to the random message pool.
        The booth pulls from the union of your 50 plus the original 9 from the Swift app.
      </p>

      <h2>Picking for your event</h2>

      <p>
        Three quick decisions:
      </p>

      <ol>
        <li>
          Are you printing? Yes → 1x4 classic. No → 2x2 (better for sharing as a single image).
        </li>
        <li>
          Do you want two prints per Selphy sheet? Yes → 1x4 classic or 1x3. No → single or 1x6
          double.
        </li>
        <li>
          Is the photo more important than the booth aesthetic? Yes → single. No → 1x4 classic.
        </li>
      </ol>

      <p>
        See{' '}
        <Link href="/blog/how-to-set-up-an-ipad-photobooth-for-your-wedding">
          how to set up an iPad photobooth for your wedding
        </Link>{' '}
        for the rest of the rig and{' '}
        <Link href="/blog/the-best-portable-photo-printer-for-photobooth-apps-in-2026">
          the printer guide
        </Link>{' '}
        for paper math.
      </p>

      <p>
        TinyBooth is on{' '}
        <Link href="/app">iOS and Android</Link>. All five layouts ship in the free tier.
      </p>
    </>
  ),
};
