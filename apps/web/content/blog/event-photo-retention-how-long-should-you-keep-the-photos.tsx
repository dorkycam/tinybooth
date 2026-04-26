import Link from 'next/link';
import type { Post } from '../../src/lib/blog';

export const post: Post = {
  meta: {
    slug: 'event-photo-retention-how-long-should-you-keep-the-photos',
    title: 'Event photo retention: how long should you keep the photos?',
    description:
      'A practical guide to event photo retention windows. The WedPics shutdown story, our 7 / 60 / 90-day tiers, and how to download everything before retention expires.',
    date: '2026-04-16',
    keywords: [
      'event photo retention',
      'wedding photo storage',
      'how long to keep wedding photos',
      'wedpics shutdown',
    ],
    heroImageAlt: 'A timeline of event photo retention tiers: 7, 60, and 90 days.',
  },
  Body: (): JSX.Element => (
    <>
      <p>
        WedPics shut down in February 2019. They gave users three weeks to download their photos.
        The Knot retired the Guest app in October 2022; existing users could pull photos through
        June 2024, after which the gallery went dark. Both products had real users and real
        revenue. Both decided the photos were not theirs to keep forever.
      </p>

      <p>
        This is the cautionary tale that should shape how you think about event photo retention.
        Photos are not a forever-storage problem solved by your favorite cloud product. Photos
        are a never-let-anyone-else-be-the-only-copy problem. Here is how to think about it.
      </p>

      <h2>The 4-rule short version</h2>

      <ol>
        <li>
          Pick a photo product that lets you bulk export at any time during retention. Not just at
          the end. Not just on the highest tier. Always.
        </li>
        <li>
          Download the export the morning after the event. Not in a week. Not when the album
          notification reminds you. The morning after.
        </li>
        <li>
          Put the export in two places: your Google Drive (or Dropbox or iCloud) plus an external
          drive. Cloud is not a backup; cloud + external is.
        </li>
        <li>
          Pick a retention window that gives you 30 days of slack to actually do step 2 and 3.
        </li>
      </ol>

      <p>
        Rule 4 is why TinyBooth&apos;s free retention is 7 days and the paid tiers are 60 and 90
        days. Less than that and you have to download the morning after. More than that and we
        carry storage costs we do not need to.
      </p>

      <h2>What retention actually means</h2>

      <p>
        Retention is the window during which the photos are accessible to view, share, and
        download from the live product. After retention, the database row and the storage object
        are deleted by an automated cleanup job.
      </p>

      <p>
        For TinyBooth events:
      </p>

      <ul>
        <li>Free events: 7 days from the event creation date.</li>
        <li>Event Pass: 60 days from the event end date.</li>
        <li>Event Pass Plus: 90 days from the event end date.</li>
        <li>Standalone TinyBooth strips: never reach our servers, stay on your device.</li>
      </ul>

      <p>
        The cleanup runs hourly. Past the retention window, photos are gone from R2 storage and
        from the database. There is no soft-delete, no recoverable trash, no &ldquo;email us
        within 30 days for restoration.&rdquo;
      </p>

      <h2>How long do other products keep your photos?</h2>

      <p>
        The market splits into three buckets:
      </p>

      <ul>
        <li>
          <strong>Forever.</strong> GuestPix top tier (12 months from event date, renewable).
          GuestCam (12 months default, 14 months total). DropEvent (permanent on paid).
        </li>
        <li>
          <strong>Year-ish.</strong> Lense (12 months). LiveShareNow Premium (1 year). Most
          dedicated wedding apps.
        </li>
        <li>
          <strong>Limited.</strong> Most free tiers run 7 to 30 days. Free Kululu is 7 days. Free
          Fotify is 7 days. Free LiveShareNow shows you the 10 newest posts only with no
          downloads at all.
        </li>
      </ul>

      <p>
        TinyBooth&apos;s free tier matches the median for free (7 days) and beats the median for
        paid (60 days vs the 12-month standard) because we genuinely think 60 days is enough if
        you also export. The 90-day Plus tier exists for hosts who want extra slack.
      </p>

      <h2>Why we picked these specific windows</h2>

      <p>
        Three reasons:
      </p>

      <p>
        <strong>Storage cost.</strong> Storing photos costs us per-month per-event. R2 is cheap
        ($0/GB egress, $0.015/GB month storage) but it is not free. A free event with 100 photos
        averages 200MB. Holding that for 12 months is 12 events worth of storage. Across thousands
        of free events, that is a real bill we would have to pass to paid users.
      </p>

      <p>
        <strong>Honest defaults.</strong> Most hosts who say they want forever-retention do not
        actually log back in after 60 days. The data on this is consistent across the category.
        90 days is enough for the second &ldquo;hey did you save that one&rdquo; conversation.
      </p>

      <p>
        <strong>Encourages export.</strong> A 60-day retention plus a one-tap zip export means
        you actually do the export. A 12-month retention means you push it off until November.
        The shorter window plus the easy export is the better default.
      </p>

      <h2>How to export everything</h2>

      <p>
        From the dashboard, open the event, tap Export. The endpoint zips every booth strip and
        every guest upload at full resolution and signs a 24-hour URL to the zip. You download
        once. The zip lives in your Google Drive forever.
      </p>

      <p>
        On a wedding-size event (200 to 850 photos) the zip is 1 to 5 GB. Large enough that you
        want to download it on a stable connection, small enough that Google Drive accepts it as
        a single upload.
      </p>

      <p>
        Bulk export is included on every paid event. Free events do not get the bulk export
        endpoint; they get individual photo downloads from the dashboard, which is fine for a
        100-upload free event.
      </p>

      <h2>What to do with the export</h2>

      <ol>
        <li>
          <strong>Move it to Google Drive (or equivalent).</strong> One folder per event. Name it
          like &ldquo;2026-08-15 Mya and Sam wedding.&rdquo;
        </li>
        <li>
          <strong>Copy it to an external drive.</strong> Cloud + external = real backup. Either
          one alone is risk.
        </li>
        <li>
          <strong>Pick the keepers.</strong> 200 to 850 photos is a lot. Pick the 50 to 100 you
          actually want printed or shared.
        </li>
        <li>
          <strong>Share the keepers with guests.</strong> Send the 50-photo subset to guests via
          a Google Drive share, not the full zip.
        </li>
      </ol>

      <h2>How to make sure photos survive a product shutdown</h2>

      <p>
        Pick products that:
      </p>

      <ul>
        <li>
          Let you export at any time during retention. Not just at the end. Not gated by the
          highest tier.
        </li>
        <li>
          Charge for the product, not for re-access to your photos. If a product is free at the
          host tier, the long-tail incentive is to monetize re-access. We picked one-time per-
          event consumable purchases on purpose to avoid this.
        </li>
        <li>
          Tell you the retention policy in writing. If the policy is &ldquo;photos may be deleted
          at any time at our discretion,&rdquo; do not store anything important there.
        </li>
        <li>
          Have a public terms of service that names the retention windows by tier. Ours does (see{' '}
          <Link href="/legal/terms">terms of service</Link>).
        </li>
      </ul>

      <h2>The deletion side</h2>

      <p>
        The other half of retention is the right to delete. From the dashboard at{' '}
        <Link href="/dashboard/account">tinybooth.com/dashboard/account</Link> you can delete an
        event or your entire account. Either action removes the database rows and the storage
        objects within minutes. There is no soft-delete or recoverable trash; the deletion is
        permanent.
      </p>

      <p>
        Email{' '}
        <a href="mailto:hello@tinybooth.com">hello@tinybooth.com</a> for a manual deletion (we
        process within 30 days per CCPA / GDPR timelines).
      </p>

      <h2>If you are migrating from a product that just shut down</h2>

      <p>
        WedPics or The Guest users sometimes still have downloaded photos from before the
        shutdown. Upload them to a TinyBooth event marked as &ldquo;Wedding 2018 archive&rdquo;
        or similar. The dashboard treats it as a normal event with no booth attached. You get
        the gallery, the slideshow, and the export pipeline.
      </p>

      <p>
        This is a manual workflow and we are not actively promoting it; the new event creation
        flow is built for live events, not historical imports. Email us if you have a
        thousand-photo backlog and we will help.
      </p>

      <h2>The honest pitch</h2>

      <p>
        The reason we built TinyBooth is partly that the products that should have lived died.
        WedPics had a great moment. The Knot Guest had a great moment. Both shut down. The next
        round of products needs to be smaller, more honest about retention, and ready to put
        the export button at the front of the dashboard. That is what we are trying to be.
      </p>

      <p>
        Read{' '}
        <Link href="/blog/the-instagram-hashtag-is-dead-heres-what-replaced-it">
          the Instagram hashtag is dead post
        </Link>{' '}
        for the broader story of why this category exists.
      </p>
    </>
  ),
};
