import Link from 'next/link';
import type { Post } from '../../src/lib/blog';

export const post: Post = {
  meta: {
    slug: 'how-to-save-money-on-your-wedding-photobooth-rent-vs-diy',
    title: 'How to save money on your wedding photobooth: rent vs DIY',
    description:
      'A spreadsheet-style breakdown of $550 to $1,170 photobooth rentals vs $300 to $500 DIY iPad setups. With real numbers and the 12-month cost-per-event math.',
    date: '2026-04-18',
    keywords: [
      'diy photo booth',
      'wedding photo booth rental cost',
      'photo booth rental vs diy',
      'cheap wedding photo booth',
    ],
    heroImageAlt: 'A spreadsheet comparing wedding photo booth rental and DIY costs.',
  },
  Body: (): JSX.Element => (
    <>
      <p>
        The average 3-hour wedding photo booth rental in the US runs $550 to $1,170 per the 2025
        Puddles Photo Booth survey. Open-air booths average $870. 360 booths average $1,170.
        Add-ons (custom backdrop, prints included, attendant) push everything up another $150 to
        $800. A typical wedding ends up paying $900 to $1,500 for the booth line item.
      </p>

      <p>
        The DIY equivalent is $300 to $500 all-in, you keep the gear, and the next event pays
        zero except for prints. Here is the spreadsheet.
      </p>

      <h2>The DIY shopping list with prices</h2>

      <table className="my-6 text-sm w-full border-collapse">
        <thead>
          <tr className="border-b border-stone">
            <th className="text-left py-2 pr-4 font-semibold text-ink">Item</th>
            <th className="text-left py-2 pr-4 font-semibold text-ink">Cost</th>
            <th className="text-left py-2 pr-4 font-semibold text-ink">Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">iPad (10th gen base)</td>
            <td className="py-2 pr-4">$329</td>
            <td className="py-2 pr-4">$0 if you already own one</td>
          </tr>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">7-foot light stand + tablet mount</td>
            <td className="py-2 pr-4">$35</td>
            <td className="py-2 pr-4">Amazon, any brand</td>
          </tr>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">14-inch ring light</td>
            <td className="py-2 pr-4">$55</td>
            <td className="py-2 pr-4">Sweet spot of brightness vs size</td>
          </tr>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">Canon Selphy CP1500</td>
            <td className="py-2 pr-4">$149</td>
            <td className="py-2 pr-4">Dye-sub, AirPrint, 4x6</td>
          </tr>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">KP-108IN paper / ink (108 sheets)</td>
            <td className="py-2 pr-4">$35</td>
            <td className="py-2 pr-4">$0.32/print, $0.16/strip</td>
          </tr>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">Backdrop</td>
            <td className="py-2 pr-4">$30</td>
            <td className="py-2 pr-4">Solid color, $0 if you have a curtain</td>
          </tr>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">Power strip + cables</td>
            <td className="py-2 pr-4">$20</td>
            <td className="py-2 pr-4">2 long cables minimum</td>
          </tr>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">Folding table</td>
            <td className="py-2 pr-4">$25</td>
            <td className="py-2 pr-4">For the printer + supplies</td>
          </tr>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">TinyBooth Event Pass (optional)</td>
            <td className="py-2 pr-4">$14.99</td>
            <td className="py-2 pr-4">Custom branding + the wall + dashboard</td>
          </tr>
          <tr className="border-b border-stone font-semibold">
            <td className="py-2 pr-4">Total (with new iPad)</td>
            <td className="py-2 pr-4">$693</td>
            <td className="py-2 pr-4"></td>
          </tr>
          <tr className="border-b border-stone font-semibold">
            <td className="py-2 pr-4">Total (with iPad you already own)</td>
            <td className="py-2 pr-4">$364</td>
            <td className="py-2 pr-4"></td>
          </tr>
        </tbody>
      </table>

      <h2>Side-by-side</h2>

      <table className="my-6 text-sm w-full border-collapse">
        <thead>
          <tr className="border-b border-stone">
            <th className="text-left py-2 pr-4 font-semibold text-ink">Cost line</th>
            <th className="text-left py-2 pr-4 font-semibold text-ink">Open-air rental</th>
            <th className="text-left py-2 pr-4 font-semibold text-ink">360 rental</th>
            <th className="text-left py-2 pr-4 font-semibold text-ink">DIY (own iPad)</th>
            <th className="text-left py-2 pr-4 font-semibold text-ink">DIY (new iPad)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">Base 3-hour rental</td>
            <td className="py-2 pr-4">$870</td>
            <td className="py-2 pr-4">$1,170</td>
            <td className="py-2 pr-4">$0</td>
            <td className="py-2 pr-4">$0</td>
          </tr>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">Print add-on</td>
            <td className="py-2 pr-4">$150</td>
            <td className="py-2 pr-4">$200</td>
            <td className="py-2 pr-4">Included in DIY</td>
            <td className="py-2 pr-4">Included in DIY</td>
          </tr>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">Custom backdrop</td>
            <td className="py-2 pr-4">$100</td>
            <td className="py-2 pr-4">$200</td>
            <td className="py-2 pr-4">$30</td>
            <td className="py-2 pr-4">$30</td>
          </tr>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">Branded strips</td>
            <td className="py-2 pr-4">$50</td>
            <td className="py-2 pr-4">$50</td>
            <td className="py-2 pr-4">$14.99 (Event Pass)</td>
            <td className="py-2 pr-4">$14.99 (Event Pass)</td>
          </tr>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">Hardware (DIY)</td>
            <td className="py-2 pr-4">N/A</td>
            <td className="py-2 pr-4">N/A</td>
            <td className="py-2 pr-4">$304</td>
            <td className="py-2 pr-4">$633</td>
          </tr>
          <tr className="border-b border-stone font-semibold">
            <td className="py-2 pr-4">First-event total</td>
            <td className="py-2 pr-4">$1,170</td>
            <td className="py-2 pr-4">$1,620</td>
            <td className="py-2 pr-4">$349</td>
            <td className="py-2 pr-4">$678</td>
          </tr>
        </tbody>
      </table>

      <p>
        DIY savings on the first event: $821 (open-air) to $1,271 (360, with iPad already owned).
        That covers your dress alterations and dinner the night before.
      </p>

      <h2>The 12-month math</h2>

      <p>
        Now imagine you also throw a birthday party 6 months later. The DIY rig is sitting in
        your closet. Your only marginal cost is paper.
      </p>

      <table className="my-6 text-sm w-full border-collapse">
        <thead>
          <tr className="border-b border-stone">
            <th className="text-left py-2 pr-4 font-semibold text-ink">Event</th>
            <th className="text-left py-2 pr-4 font-semibold text-ink">Rental cost</th>
            <th className="text-left py-2 pr-4 font-semibold text-ink">DIY cost (own iPad)</th>
            <th className="text-left py-2 pr-4 font-semibold text-ink">Savings</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">Wedding (open-air)</td>
            <td className="py-2 pr-4">$1,170</td>
            <td className="py-2 pr-4">$349</td>
            <td className="py-2 pr-4">$821</td>
          </tr>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">+ Birthday (paper only)</td>
            <td className="py-2 pr-4">$870</td>
            <td className="py-2 pr-4">$50</td>
            <td className="py-2 pr-4">$820</td>
          </tr>
          <tr className="border-b border-stone">
            <td className="py-2 pr-4">+ Holiday party (paper only)</td>
            <td className="py-2 pr-4">$870</td>
            <td className="py-2 pr-4">$35</td>
            <td className="py-2 pr-4">$835</td>
          </tr>
          <tr className="border-b border-stone font-semibold">
            <td className="py-2 pr-4">12-month total</td>
            <td className="py-2 pr-4">$2,910</td>
            <td className="py-2 pr-4">$434</td>
            <td className="py-2 pr-4">$2,476</td>
          </tr>
        </tbody>
      </table>

      <p>
        After three events the DIY rig has paid for itself nine times over, and you still own the
        iPad and the printer.
      </p>

      <h2>What you give up by going DIY</h2>

      <p>
        Honest version. The DIY trade-offs:
      </p>

      <ul>
        <li>
          <strong>No attendant.</strong> A rental usually includes one. With DIY you assign an
          aunt or pay a friend $30 an hour to babysit the booth.
        </li>
        <li>
          <strong>No fancy 360 video.</strong> The 360 booth is a specific aesthetic and the DIY
          equivalent (a phone on a motorized arm) costs $400+ and looks worse. If you have to
          have 360, rent it.
        </li>
        <li>
          <strong>You set up and tear down.</strong> 90 minutes the morning of, 30 minutes after.
          Your friend who likes to plan things is the right person for this.
        </li>
        <li>
          <strong>One thing can break.</strong> The Selphy can stall, the iPad can drop Wi-Fi, the
          ring light can flicker. Test the day before and have a backup phone with TinyBooth as
          your fallback.
        </li>
      </ul>

      <h2>What you keep that the rental cannot give you</h2>

      <ul>
        <li>The hardware after the night ends.</li>
        <li>Every photo from every guest at native resolution, in your Google Drive forever.</li>
        <li>The branded strips, with no upcharge.</li>
        <li>The wall, included for free with TinyBooth, that catches every candid the photographer missed.</li>
      </ul>

      <p>
        See{' '}
        <Link href="/blog/how-to-set-up-an-ipad-photobooth-for-your-wedding">
          how to set up an iPad photobooth for your wedding
        </Link>{' '}
        for the gear walkthrough and{' '}
        <Link href="/blog/the-best-portable-photo-printer-for-photobooth-apps-in-2026">
          the best portable photo printer for photobooth apps in 2026
        </Link>{' '}
        for the printer breakdown.
      </p>

      <h2>The honest exception</h2>

      <p>
        DIY is the right call for 80 percent of weddings. The 20 percent where you should rent:
      </p>

      <ul>
        <li>
          <strong>Black-tie events with no DIY budget.</strong> If hiring a $200 attendant for the
          night feels less stressful than briefing your aunt, rent.
        </li>
        <li>
          <strong>You hate setup.</strong> Some people genuinely do not enjoy this. Pay someone.
        </li>
        <li>
          <strong>You need a 360 booth.</strong> No DIY equivalent looks as good.
        </li>
      </ul>

      <p>
        For the other 80 percent, the math is overwhelming.
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
          PhotoBooth Rocks rental vs DIY breakdown:{' '}
          <a href="https://photoboothrocks.com/rentals-vs-diy-photo-booth" rel="noreferrer noopener">
            photoboothrocks.com
          </a>
          .
        </li>
      </ul>
    </>
  ),
};
