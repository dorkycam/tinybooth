# Competitor Research: Photobooth Apps and Party Photo Walls

Last updated: 2026-04-26

## Executive Summary

The photobooth app market splits cleanly into two camps. On one end you have $20 to $250 per month professional tools like [Simple Booth HALO](https://www.simplebooth.com/plans), [LumaBooth](https://dslrbooth.com/lumabooth-photo-booth-app), [Snappic](https://www.snappic.com/pricing), and [Booth.Events](https://booth.events/pricing) that are sold to people running photo booth businesses. They have hundreds of layouts, AI portraits, DSLR support, green screen, and the kind of feature density that makes the UI feel like Photoshop. Reviews mention bugs, finicky template editors, and crashes mid-event ([LumaBooth reviews](https://apps.apple.com/us/app/lumabooth-event-photo-booth/id1162206015)). On the other end you have $0.99 to $20 one-time consumer apps like [Pocketbooth](https://apps.apple.com/us/app/pocketbooth-photo-booth/id385145330) and [Mini Photobooth](https://apps.apple.com/us/app/mini-photobooth/id1342093386) that hit the nostalgic vibe but barely support events. There is a clear hole in the middle: a casual host throwing one wedding or birthday a year does not need a $99 subscription, but they also need more than 4 vintage filters. TinyBooth can win by being the best app for non-professionals running a single event, with good defaults, simple paid tiers (no $9, $16, $34, $111, $186, $249 confusion), and tablet-first UX that does not make the iPad feel like an afterthought.

The party photo wall market is more fragmented and most players overlap heavily. [Kululu](https://www.kululu.com/), [Fotify](https://fotify.app/), [GuestPix](https://guestpix.com/pricing/), [GuestCam](https://guestcam.co/), [LiveWall](https://livewall.no/), [DropEvent](https://dropevent.com/pricing), and [LiveShareNow](https://www.livesharenow.com/pricing) all do roughly the same thing: QR code, no app for guests, live photo wall on a TV, one-time event fee around $39 to $99. The category leader [The Guest by The Knot](https://www.theknot.com/photo-sharing-app/) (formerly Veri) was free and dominant but [shut down for new events in October 2022](https://justuseapp.com/en/app/1105933454/the-guest-photo-sharing). That left a big gap. The differentiators that matter to real customers: (1) free tier that is actually usable not a 24-hour 10-photo demo, (2) zero friction guest flow with no app and no signup, (3) a live wall that does not require casting hardware. TinyWall already has the right architecture (web-based, no app) so the play is to ship a free tier with a real retention window (7 days plus 50 photos minimum), price paid plans simply at one or two tiers under $50, and tie tightly to TinyBooth so an event uses both products from one dashboard.

---

## Photobooth App Competitors

### Simple Booth HALO

- **Link**: [simplebooth.com](https://www.simplebooth.com/) | [App Store](https://apps.apple.com/us/app/simple-booth-halo/id1323267760)
- **Platform**: iPad first. Sells a $2,090+ HALO hardware kit alongside the software.
- **App Store rating**: 4.7 stars, 2,400+ ratings.
- **Pricing**: 5 tiers, weekly and monthly billing, plus paid AI credits.
  - Lite: $9/week, $29.99/month, $289.99/year
  - Core: $16/week, $49.99/month, $489.99/year
  - Plus: $34/week, $99.99/month, $989.99/year
  - Pro: $149/month (no weekly)
  - Select: $249/month (no weekly)
  - AI credits: $0.10 each, 25 free for new trials
  - Add-on device licenses: $9 to $186 extra per device per period
  - Source: [simplebooth.com/plans](https://www.simplebooth.com/plans)
- **Features**: Layout designer, AI effects and filters, DSLR support, AI background replacement and green screen, props and stickers, offline mode, QR/text/email/AirDrop sharing, AirPrint, live feed gallery, Glam smoothing.
- **Top 3 strengths**:
  1. Most polished pro tool, recognizable brand among event vendors.
  2. Offline capability so events do not break when WiFi dies.
  3. Genuinely good free trial with 25 AI credits.
- **Top 3 weaknesses**:
  1. Pricing is confusing. Five tiers with weekly, monthly, annual, AI credit add-ons, and per-device add-ons.
  2. Buggy update cycle. Reviews mention features being removed in updates ("The recent update has taken away several options, including the option to add a logo" - AmBarDR).
  3. Photos can fail to save silently. "None of my photos saved. It was a waste of $30 and memories lost" - CaliRN20.
- **Sample review quotes**:
  - "Even if it's just girl's night we have so much fun just taking different pictures" - stacyreneeh
  - "Photos would not be saved in ANY WAY unless the users complete the dialogue after the photo is taken" - Mra266
  - "No ability to even look at the app without the $29 payment. Feels like dishonesty to list as 'Get' app" - MacExperience
  - Source: [App Store reviews](https://apps.apple.com/us/app/simple-booth-halo/id1323267760?see-all=reviews&platform=ipad)

### LumaBooth

- **Link**: [dslrbooth.com/lumabooth-photo-booth-app](https://dslrbooth.com/lumabooth-photo-booth-app) | [App Store](https://apps.apple.com/us/app/lumabooth-event-photo-booth/id1162206015)
- **Platform**: iPad, iPhone, Mac. Owned by dslrBooth.
- **App Store rating**: 4.6 stars, 1,300+ ratings.
- **Pricing**:
  - Monthly: $19.99 (App Store) or $19.99 (web)
  - Annual: $18/month billed annually ($199.99/year on App Store)
  - First two devices included
  - LumaShare add-on: $7.99/month
  - HashPrinter: $25/month
  - Source: [dslrbooth.com/pricing](https://dslrbooth.com/pricing)
- **Features**: 820+ pro templates, 170+ AI portrait styles, GIF/boomerang, AirPrint plus DNP/Canon/Sony/Nikon printer support, DSLR/mirrorless camera support, AI background removal, green screen, branded online gallery, motion-triggered sessions, virtual attendant.
- **Top 3 strengths**:
  1. Cheapest pro app at $18 to $20/month with 2 devices.
  2. Feature-rich. AI portraits, DSLR, multi-printer support all included.
  3. Works offline.
- **Top 3 weaknesses**:
  1. Notorious bugs around video uploads, audio prompts, and finicky print template editor.
  2. UI feels dated and clunky.
  3. Settings split between iPad app and web dashboard.
- **Sample review quotes**:
  - "This was the perfect alternative to booking a photo booth at our wedding!"
  - "The app UI is kind of clunky, but it more than makes up for it with features"
  - "Every time I try to do a video or a boomerang it tells me that it fails to upload"
  - "The print layout is extremely finicky, really easy to accidentally move them"
  - "There just doesn't seem to be any QA, so the releases come in a flurry"
  - Source: [App Store reviews](https://apps.apple.com/us/app/lumabooth-event-photo-booth/id1162206015)

### dslrBooth (Windows desktop)

- **Link**: [dslrbooth.com](https://dslrbooth.com/) | [Pricing](https://dslrbooth.com/pricing)
- **Platform**: Windows PC only. Designed for events that use a DSLR.
- **Pricing**:
  - Annual: $17/month billed annually, includes first 2 computers
  - Monthly: $49.99/month, includes first 2 computers
  - Additional computers: $17/month per computer (annual)
  - License renewal entry-level: $25/year
  - Standard edition has been discontinued. All tiers now include Professional features.
- **Features**: Canon/Nikon/Sony/Webcam/GoPro support, photo/GIF/video, green screen, custom voice clips, 5 GB free storage, unlimited events and sessions, custom templates.
- **Top 3 strengths**:
  1. Widest camera support of any app.
  2. Strong wedding/event vendor reputation, 9+ years in market.
  3. Mature feature set including custom voice prompts (rare).
- **Top 3 weaknesses**:
  1. Windows only, which excludes the iPad-first market.
  2. UI looks dated. Setup is clunky.
  3. Stability issues on lower-end hardware per [SLR Lounge review](https://www.slrlounge.com/dslr-photobooth-software-review/).

### Pocketbooth (iPhone) and Pocketbooth Party (iPad)

- **Link**: [iPhone version](https://apps.apple.com/us/app/pocketbooth-photo-booth/id385145330) | [iPad version](https://apps.apple.com/us/app/pocketbooth-party-photo-booth/id560180763)
- **Platform**: Pocketbooth on iPhone, Pocketbooth Party on iPad.
- **App Store rating**: 4.5 stars (iPhone, 2,000+ ratings), 3.7 stars (iPad, 31 ratings).
- **Pricing**:
  - Pocketbooth (iPhone): Free with subscriptions
    - Weekly: $4.99
    - Monthly: $19.99 to $39.99
    - Yearly: $99.99
    - Event Pack: $4.99 one-time
    - Filter packs: $0.99 each
  - Pocketbooth Party (iPad): $19.99 one-time, no IAP
- **Features**: Vintage 1950s photo strips, 4 effects (iPhone) / 20 booth skins, 10 filters, 11 photo layouts (iPad), AirPrint, custom text, Bluetooth shutter remote, Guided Access lock for party mode.
- **Top 3 strengths**:
  1. Strong vintage aesthetic that became their signature.
  2. iPad version is one-time $19.99 with no subscription.
  3. Good developer responsiveness in older eras.
- **Top 3 weaknesses**:
  1. Recent subscription model on iPhone caused significant user backlash. "My old purchases are gone, my old photo strips are gone, and the app itself is just like a thousand other apps like it."
  2. No DSLR support, and developers say they are not adding it.
  3. iPad version (Pocketbooth Party) has not been meaningfully updated. Pictures upside down on newer iPads, only fixed in 3.8.5.
- **Sample review themes**: Long-term users praise the nostalgic charm, but are upset by the conversion to subscription and loss of historical purchases. Source: [App Store reviews](https://apps.apple.com/us/app/pocketbooth-photo-booth/id385145330).

### Snappic

- **Link**: [snappic.com](https://www.snappic.com/) | [Pricing](https://www.snappic.com/pricing)
- **Platform**: iPad and iPhone, plus DSLR/mirrorless integration.
- **Pricing**:
  - Per-event: $19 to $29
  - Starter monthly: $69/month
  - Business monthly: $189/month (also listed as $169/month enterprise)
  - 14-day free trial, no credit card required
- **Features**: VideoFX video editor, 360 booth support, AI photo capture and enhancement, FaceMatch facial recognition, green screen and AI background removal (add-on), customizable templates, microsites with branding, instant social sharing, custom surveys, analytics, spin-to-win contests.
- **Top 3 strengths**:
  1. Best-in-class for 360 booths and VideoFX.
  2. Per-event pricing as low as $19 for occasional use.
  3. Strong support reputation.
- **Top 3 weaknesses**:
  1. Big jump from $19 per event to $69/month with no mid-tier.
  2. Settings are mostly web-based, not in-app.
  3. Green screen is an add-on, not included in base.

### Booth.Events

- **Link**: [booth.events](https://booth.events/) | [Pricing](https://booth.events/pricing)
- **Platform**: iPad, plus Mac/PC printing companion.
- **App Store rating**: 4.8 stars, 839 ratings (per Simple Booth's review roundup).
- **Pricing**:
  - 1 Week Pass for Basic features
  - 4x Pro Event Credits (no expiration)
  - Subscription tiers: Basic, Pro, Pro+, Pro+ Annual (specific dollar amounts not shown publicly, blogs cite $19/week and $49 to $129/month)
  - Free trial: 3 free Pro events, 100-photo and SMS limit (US/Canada only)
- **Features**: Mac/PC printing support, Canon/Sony/Nikon DSLR integration, AI portraits, white-label options, optimized printing.
- **Top 3 strengths**:
  1. Highest-rated app of the pro tier.
  2. Strong printing reliability.
  3. Pro Event Credits don't expire (rare).
- **Top 3 weaknesses**:
  1. Template design only via web interface, not on the iPad.
  2. Expensive monthly tiers.
  3. Brand recognition is lower than Simple Booth or dslrBooth.

### Mini Photobooth

- **Link**: [miniphotobooth.co](https://miniphotobooth.co/) | [App Store](https://apps.apple.com/us/app/mini-photobooth/id1342093386)
- **Platform**: iPad and iPhone.
- **App Store rating**: 4.7 stars, 8,600+ reviews.
- **Pricing**: Free download, then Pro subscription:
  - Monthly: $39.99
  - Annual: $239.99
- **Features**: 60+ animated templates, 120+ fonts, 800+ stickers, photo/video/GIF/boomerang, AirPrint, custom backgrounds, Bluetooth shutter, event mode with countdown.
- **Top 3 strengths**:
  1. Highest review count of any consumer photobooth app.
  2. Free tier is actually useful for casual events.
  3. No setup or signup, runs independently per user reviews.
- **Top 3 weaknesses**:
  1. Pro subscription is steep at $39.99/month.
  2. Branded as Mini, struggles to position for serious events.
  3. Animated templates are mostly seasonal (Halloween, Christmas).

### Darkroom Booth (iPad)

- **Link**: Per [Simple Booth roundup](https://www.simplebooth.com/blog/best-photo-booth-apps/)
- **App Store rating**: 3.6 stars, 16 ratings.
- **Pricing**: $29.99/month or $299.99/year.
- **Features**: Logo watermarking, multi-iPad support (up to 10 simultaneous), manual camera controls, AirPrint, multilingual.
- **Top 3 strengths**:
  1. Multi-device sync (rare for iPad apps).
  2. Pro photographer-grade manual controls.
  3. Multilingual.
- **Top 3 weaknesses**:
  1. Low rating count and middling stars.
  2. No filters, no digital props.
  3. Limited branding customization.

### Fiesta Booth

- **Link**: Per [Simple Booth roundup](https://www.simplebooth.com/blog/best-photo-booth-apps/)
- **App Store rating**: 3.4 stars, 102 ratings.
- **Pricing**: $49 to $99/month, 30-day free trial.
- **Features**: 240+ event themes, Photo Booth Academy (100+ training videos), scheduling, live slideshow casting.
- **Top 3 strengths**:
  1. Largest theme library at 240+.
  2. Built-in training resources for new operators.
  3. Long free trial.
- **Top 3 weaknesses**:
  1. Lowest rating in the pro tier.
  2. Reliability issues since the Salsa transition.
  3. Vendor lock-in concerns.

### TinyBooth (the existing app, for reference)

- **Link**: [App Store](https://apps.apple.com/us/app/tinybooth/id1519858905)
- **Platform**: iOS only.
- **App Store rating**: 4.6 stars, 10 ratings.
- **Pricing**: Free, no IAP.
- **Features**: 4-photo countdown, 4x6 photo strip, double-print option.
- **Notes**: Tiny but loved. One reviewer: "EXACTLY what I was looking for after struggling with overpriced alternatives." Common request: "different borders or possibly editable borders." Confirms the gap between Pocketbooth and Simple Booth is real.

---

## Photobooth App Comparison Table

| App | Pricing | Tablet-first | GIF/Boomerang | AirPrint | Custom Branding | DSLR | Account required | Watermark on free |
|---|---|---|---|---|---|---|---|---|
| TinyBooth (current) | Free | Yes | No | No (unclear) | No | No | No | None |
| Pocketbooth Party | $19.99 one-time | Yes | No | Yes | Limited | No | No | N/A (paid only) |
| Pocketbooth iPhone | $4.99/wk to $99.99/yr | No | No | Yes | Limited | No | No | Unclear |
| Mini Photobooth | Free; $39.99/mo Pro | Both | Yes | Yes | Yes (Pro) | No | No | Yes |
| Simple Booth HALO | $9/wk to $249/mo | Yes | Yes | Yes | Yes (Plus+) | Yes (Core+) | Yes | Trial only |
| LumaBooth | $18-$20/mo | Yes | Yes | Yes | Yes | Yes | Yes | Trial only |
| Snappic | $19/event to $189/mo | Yes | Yes | Yes | Yes | Yes | Yes | Trial only |
| Booth.Events | ~$19-$129/mo | Yes | Yes | Yes | Yes (white-label) | Yes | Yes | Trial only |
| Darkroom Booth | $29.99/mo | Yes | Limited | Yes | Limited | Yes | Yes | Yes |
| dslrBooth (Win) | $17-$49.99/mo | No | Yes | No (DSLR) | Yes | Yes | Yes | Trial only |

---

## Party Photo Wall Competitors

### Kululu

- **Link**: [kululu.com](https://www.kululu.com/) | [Pricing](https://www.kululu.com/pricing)
- **Platform**: Web. Guests upload via QR with no app. Casts to TV via browser.
- **Pricing** (one-time per-event):
  - Free: 500 uploads, 7-day retention, basic customization (was 50 uploads as of original research; updated April 2026 per `docs/research/iteration-2026-04.md`)
  - Plus: $39, more retention + bulk download
  - Pro: $99, unlimited uploads, 1-year retention, moderation
- **Free tier**: 500 photos/videos, 7 days. Live photo wall included even on free. The 10x bump means Kululu now leads the pure-wall category on free-tier generosity.
- **Top 3 strengths**:
  1. Free tier is actually usable (50 uploads + 7 days vs LiveShareNow's 10 posts).
  2. Live photo wall included on free.
  3. One-time pricing, no subscription.
- **Top 3 weaknesses**:
  1. 500-upload cap on Plus is low for a wedding (typical wedding gets 800+ uploads per [The Knot](https://www.theknotww.com/press-releases/the-guest-photo-sharing-app/)).
  2. Branding is "better customization" but no full white-label.
  3. Public launch pricing is 50% off, suggests they might be discounting heavily for traction.

### Fotify

- **Link**: [fotify.app](https://fotify.app/event-photo-sharing/)
- **Platform**: Web. No app for guests.
- **Pricing** (per event, one-time):
  - Free Party: $0, 20 invites, 50 photos, 7-day access
  - Photo Gallery: $29.99, unlimited photos, 30-day access, bulk download
  - Premium: $49.00, unlimited everything, 365-day access, custom branding, RSVP
- **Top 3 strengths**:
  1. Premium tier has full RSVP and digital invitations bundled.
  2. AI content moderation included.
  3. Cheapest paid tier at $29.99.
- **Top 3 weaknesses**:
  1. Photo-only on free, no video.
  2. No mention of video uploads on any tier.
  3. Generic-feeling brand.

### GuestPix

- **Link**: [guestpix.com](https://guestpix.com/) | [Wedding pricing](https://guestpix.com/weddings-pricing/) | [Party pricing](https://guestpix.com/party-pricing/)
- **Platform**: Web. No guest app.
- **Pricing**:
  - Wedding tiers: Classic $49, Signature $89, Luxe $119
  - Party tiers: Small $39, Medium $49, Large $89
  - All one-time. 12-month gallery hosting.
- **Free tier**: None visible. Sells against subscription competitors.
- **Top 3 strengths**:
  1. Clear per-vertical pricing pages (weddings vs parties vs kids vs business vs memorials).
  2. 12-month upload window on top tier (Signature/Luxe).
  3. Includes video guestbook, digital invitations with RSVP, slideshow.
- **Top 3 weaknesses**:
  1. No free tier at all.
  2. No video on Small ($39) tier.
  3. "Default Color Theme" only on Classic and Signature, not Luxe-level.

### GuestCam

- **Link**: [guestcam.co](https://guestcam.co/)
- **Platform**: Web. No app for guests.
- **Pricing**: Specific tiers not displayed publicly on landing page.
- **Features**: Unlimited photos, videos, and guests. 12-month upload window. 14-month total storage. Live photo slideshow. Audio guestbook. MagicFind AI photo finder. 1-click ZIP download.
- **Top 3 strengths**:
  1. Audio guestbook is a unique angle.
  2. 14 months of storage on standard plans.
  3. AI photo finder.
- **Top 3 weaknesses**:
  1. Hidden pricing on landing page hurts trust.
  2. No clear free tier.
  3. Brand recognition is low.

### LiveWall

- **Link**: [livewall.no](https://livewall.no/)
- **Platform**: Web. Norway-based.
- **Pricing** (one-time per event):
  - Free: 24 hours / 10 photos (or 7 days / 100 photos with email signup)
  - Plus: Unlimited photos, 3-month upload, 1-year storage, 500 guests, custom branding, password
  - Premium: All of Plus + 10-min video, Google Drive sync, AI safety filter, PDF photo book, notifications
  - Signature: All of Premium + 1-year upload window, unlimited walls, embedding, FTP, Zapier, 30-min video
  - Specific dollar amounts not displayed in fetched content
- **Top 3 strengths**:
  1. PDF photo book auto-generation is unique.
  2. Google Drive sync, FTP, Zapier integrations on Signature.
  3. Polaroid Wall design is visually distinctive.
- **Top 3 weaknesses**:
  1. Free tier is too restrictive (10 photos, 24 hours).
  2. European brand, less recognized in US market.
  3. Pricing not transparent on landing.

### DropEvent

- **Link**: [dropevent.com](https://dropevent.com/) | [Pricing](https://dropevent.com/pricing)
- **Platform**: Web. No guest app.
- **Pricing**:
  - Photos Only: $49 one-time, unlimited photos, 45-day upload window, "forever" view-only gallery
  - Photo + Video: $98 one-time, unlimited photos, up to 100 GB video, permanent access
  - Event Pros: $178/month, up to 5 active galleries
  - Enterprise: Custom
- **Free tier**: None visible.
- **Top 3 strengths**:
  1. Permanent gallery access on paid tiers.
  2. Uncompressed photos.
  3. Slideshow mode included.
- **Top 3 weaknesses**:
  1. No free tier.
  2. Photos Only at $49 is photos only (no video at all).
  3. Event Pros at $178/month is steep for what it offers.

### LiveShareNow

- **Link**: [livesharenow.com](https://www.livesharenow.com/pricing)
- **Platform**: Web.
- **Pricing**:
  - Trial Event: Free, 1 event, 7-day retention, 10 newest posts only, no downloads
  - Standard Event: $19.99, 90 days, all posts, host download
  - Premium Event: $39.99, 1 year, all posts, host + guest download
  - Premium+ Event: $79.99, 90 days, video, keepsake posts, live slideshow
  - Premium+ Subscription: $99.99/year, unlimited events, all features
- **Top 3 strengths**:
  1. Cheapest paid tier at $19.99.
  2. Annual subscription option for unlimited events.
  3. Clear feature differentiation per tier.
- **Top 3 weaknesses**:
  1. Free trial only shows 10 posts. Useless for any real event.
  2. Live slideshow is locked behind $79.99 Premium+.
  3. Confusing tier names (Premium vs Premium+ vs Premium+ Subscription).

### POV (formerly POVR)

- **Link**: [pov.camera](https://pov.camera/) | [Pricing](https://pov.camera/pricing)
- **Platform**: Web (uploaders), with optional iOS app.
- **Pricing**:
  - Free: Up to 10 guests
  - Tiered guest counts: 25, 50, 100, 175, 250, 251+ (specific dollar amounts not displayed publicly, but referenced as "$4.99 for 25 users")
  - Business Essentials add-on: Custom branding, live slideshow, 24/7 support
- **Top 3 strengths**:
  1. Strong "disposable camera" positioning that resonates with younger users.
  2. Customizable per-guest photo limits (you control how many photos each guest can take).
  3. Gallery reveal options (during, after, on a delay).
- **Top 3 weaknesses**:
  1. Free tier capped at 10 guests is tiny.
  2. Live slideshow is a paid Business add-on, not standard.
  3. The "you control how many photos per guest" mechanic conflicts with party hosts who want unlimited.

### Memento

- **Link**: [memento.photo](https://event.memento.photo/) | [Apps](https://apps.apple.com/us/app/memento-group-videos-albums/id1579704961)
- **Platform**: iOS app primarily, plus web. Guests have to use the app for full features.
- **Pricing**: Subscription model with ads on all plans except Platinum (specific tiers not loaded due to redirect).
- **Features**: Photo moderation, real-time shared albums, unlimited storage and contributors, customizable slideshow, branded covers/logo/colors/QR codes, group video creation.
- **Top 3 strengths**:
  1. Unlimited storage forever on paid.
  2. Strong slideshow and branding tools.
  3. Group video creation is unique.
- **Top 3 weaknesses**:
  1. Ads on all but Platinum hurts the experience.
  2. App-required model adds friction vs web-only competitors.
  3. Less consumer name recognition than Joy or The Knot.

### The Guest by The Knot (formerly Veri / Wedding Snap)

- **Link**: [theknot.com/photo-sharing-app](https://www.theknot.com/photo-sharing-app/)
- **Status**: **Retired October 2022 for new events**. Existing users could download photos through June 2024.
- **Historical pricing**: Originally Veri at $129 for 5 events, then waived to free under The Knot brand.
- **Notes**: This is the most important data point in the category. The Knot got 870 photos per wedding average versus 22 from Instagram hashtags. Massive validated demand. They shut it down anyway, leaving a gap that smaller players (Kululu, Fotify, GuestCam) are now racing to fill. Source: [PR Newswire](https://www.prnewswire.com/news-releases/the-knot-offers-100-photo-sharing-app-for-free-to-every-couple-getting-married-in-america-300723396.html).

### Joy

- **Link**: [withjoy.com](https://withjoy.com/) | [App](https://withjoy.com/app/)
- **Platform**: iOS, Android, web. Wedding-only.
- **Pricing**: Free for couples and guests. Monetizes through wedding registry purchases, premium designs, custom domains.
- **Features**: Wedding website, guest list, RSVPs, photo album with unlimited uploads, real-time slideshow during reception, virtual guestbook.
- **Top 3 strengths**:
  1. Free with no upsell pressure (registry monetization is invisible to host).
  2. Photo album bundled with full wedding planning suite.
  3. Real-time slideshow at reception is included.
- **Top 3 weaknesses**:
  1. Wedding-only. Won't work for birthdays, corporate, baby showers.
  2. Guests have to download the Joy app, which is friction.
  3. Photos are a feature, not the focus.

### WedShoots

- **Link**: [App Store](https://apps.apple.com/ca/app/wedshoots/id660256196) | [Google Play](https://play.google.com/store/apps/details?id=net.bodas.android.wedshoots)
- **Platform**: iOS, Android. Wedding-only.
- **Pricing**: Free, with iCloud storage upgrades from $0.99/month.
- **Features**: Wedding-specific organization, QR code, organize by moments, private galleries, comments and likes.
- **Top 3 strengths**:
  1. Free baseline.
  2. Comments and likes for guest engagement.
  3. Moments-based organization (cocktail hour, ceremony, etc.).
- **Top 3 weaknesses**:
  1. Guests must download the app.
  2. Storage expires in 7 to 90 days depending on plan.
  3. Limited customization vs newer competitors.

### Eversnap (now part of Snappr)

- **Link**: [eversnapapp.com](https://www.eversnapapp.com/) | [Snappr](https://eversnap.snappr.com/)
- **Platform**: iOS, Android, plus web. Acquired by Snappr.
- **Pricing**:
  - Free app: Unlimited photos and videos
  - Live Slideshow: $199/event
  - Pro Photo Streaming: $199/event
  - Pro Photo Retouching: separate add-on
- **Top 3 strengths**:
  1. Free app baseline is generous (unlimited).
  2. Strong photographer integration.
  3. Snappr backing.
- **Top 3 weaknesses**:
  1. Live Slideshow at $199/event is one of the most expensive in the category.
  2. App download required for guests.
  3. Brand transition under Snappr creates confusion.

### Lovecast

- **Link**: [lovecastapp.com](https://www.lovecastapp.com/pricing)
- **Platform**: Web and iOS. Primarily a wedding livestream app, photo sharing is secondary.
- **Pricing**: Free Basic plan, paid premium tiers for streaming features.
- **Notes**: Less of a direct competitor since it's livestream-focused. Worth tracking because livestream + photo wall is a natural bundle that nobody is doing well.

---

## Party Photo Wall Comparison Table

| Service | Free tier | Cheapest paid | Top tier | Live wall | Guest app needed | Custom branding | Video |
|---|---|---|---|---|---|---|---|
| TinyWall (current) | Free, no limits set yet | TBD | TBD | Yes | No | TBD | TBD |
| Kululu | 50 uploads, 7 days | $39 one-time | $99 one-time | Yes (all tiers) | No | Plus and Pro | Yes |
| Fotify | 50 photos, 7 days | $29.99 one-time | $49 one-time | Yes (paid) | No | Premium only | No |
| GuestPix | None | $39 one-time | $119 one-time | Yes (all tiers) | No | Luxe only | $49+ tier |
| GuestCam | None visible | Not public | Not public | Yes | No | Unclear | Yes |
| LiveWall | 10 photos, 24 hrs | Not public | Not public | Yes (paid) | No | Plus+ | Premium+ |
| DropEvent | None | $49 one-time | $178/mo | Yes | No | Pro tier | $98+ tier |
| LiveShareNow | 10 posts, 7 days | $19.99 one-time | $99.99/year unlimited | Premium+ only | No | Most tiers | Premium+ only |
| POV | 10 guests | ~$4.99 (25 guests) | Custom | Business add-on | Optional iOS app | Business add-on | Yes |
| Memento | Limited | Subscription | Platinum | Yes | Yes (iOS) | Yes | Yes |
| Joy | Free | $0 | $0 | Yes | Yes (iOS/Android) | No | Yes |
| WedShoots | Free, 7 days | $0.99/mo (iCloud) | iCloud-based | No | Yes | No | Yes |
| Eversnap | Free, unlimited | $199/event | $199/event | $199 add-on | Yes | Limited | Yes |
| The Guest (Knot) | RIP | RIP | RIP | RIP | RIP | RIP | RIP |

---

## Gaps and Opportunities

### TinyBooth (the photobooth app)

1. **Tablet-first that actually feels like an iPad app**. Most pro tools (Simple Booth, LumaBooth, Snappic) treat the iPad as a delivery mechanism for a feature-dense desktop experience. Reviews consistently call them "clunky." TinyBooth can win on UX alone by designing for a propped-up iPad with one operator and a steady stream of guests.

2. **No-account standalone use**. Every competitor except free consumer apps requires signup. The current TinyBooth's "open it, take photos, done" experience is the exception, and reviews like "EXACTLY what I was looking for after struggling with overpriced alternatives" prove there's demand.

3. **Sane pricing**. Simple Booth has 5 tiers across 3 billing periods plus AI credit add-ons plus per-device add-ons. LumaBooth charges $19.99/month which is too much for a once-a-year wedding host. The right play is:
   - Free with watermark (TinyBooth already does free, just add the watermark on the strip).
   - One paid tier around $4.99 to $9.99 per event, no subscription. Removes watermark, unlocks event branding, includes the IG-story share format with the TinyBooth logo. Below the per-event prices of Snappic ($19+) and LumaBooth ($20/mo).
   - Optional $19.99/year "host plan" for people who throw multiple events per year.

4. **Print integration that just works**. LumaBooth users complain the print template is finicky. Pocketbooth Party had upside-down photos on new iPads. AirPrint plus a small set of polished layouts (1x4 strip, 2x2, 1x3, single) executed well will beat 240 themes that crash.

5. **The random message hook is unique**. Nothing in this market does it. Keeping it free, making it customizable at the paid tier, is a low-cost moat that creates a memorable mechanic competitors can't easily copy without looking derivative.

6. **Cross-platform is an opportunity, not a wash**. Pocketbooth, Mini Photobooth, Simple Booth, LumaBooth are all iOS/iPad only or Mac-tied. A polished Android tablet experience opens up a market segment competitors have abandoned.

7. **Filter packs as a paid hook works**. Pocketbooth charges $0.99 per filter pack and reviews show people buying them. It's a low-friction monetization that respects the free tier.

### TinyWall (the party photo wall)

1. **The free tier is the moat**. Competitor free tiers are bad on purpose:
   - LiveShareNow: 10 newest posts only.
   - LiveWall: 10 photos / 24 hours.
   - POV: 10 guests max.
   - Kululu: 50 uploads / 7 days (the current best in class).
   - Fotify: 50 photos / 7 days.
   - GuestPix, GuestCam, DropEvent: no free tier.
   
   TinyWall should beat Kululu at minimum. Suggested free tier: 100 uploads, 7-day retention, live wall included, no guest cap. That's a usable free product for a small birthday or baby shower and creates word-of-mouth demand for the paid tier when people throw bigger events.

2. **Live wall on free**. Most competitors gate the live slideshow behind paid. Kululu and GuestPix include it on every tier. TinyWall should match them. The TV slideshow is the magic moment. Locking it behind a paywall kills the "wow" demo.

3. **No guest app, ever**. Joy, Memento, WedShoots, Eversnap all require guest app downloads. The current TinyWall design (web, no signup) is the right call. This must stay non-negotiable.

4. **Per-event one-time pricing wins**. Subscriptions don't fit the use case. People throw weddings once. The market has converged on one-time per-event pricing in the $39 to $99 range. TinyWall pricing should be:
   - Free: 100 uploads, 7 days, live wall, no branding.
   - Pro Event: $29 one-time. Unlimited uploads, 90-day retention, custom event branding (logo, colors), bulk download, video.
   - That's it. Two tiers. Beats Kululu's $39, Fotify's $29.99, and avoids the GuestPix-style multi-vertical-pricing-page complexity.

5. **The Guest by The Knot leaves a vacuum**. They got 870 photos per wedding. The market knows the demand exists. The smaller players (Kululu, Fotify) are growing into the gap but none have category-defining brand. TinyWall with TinyBooth bundling has a real shot at differentiation.

6. **Bundle photobooth + wall under one event**. No competitor does this. dslrBooth and Simple Booth have desktop apps that can post to galleries, but they don't have a guest-upload-from-phone wall integrated. TinyBooth + TinyWall under a single event = guests at the booth + guests with their phones, all feeding one slideshow. That's a genuine product wedge.

7. **Pricing transparency**. GuestCam, LiveWall, Booth.Events all hide pricing. Be the company that lists prices on the homepage. It's a small but real trust signal in a market where most players act like enterprise SaaS.

8. **AI moderation should be table stakes**. Fotify already advertises it. As party walls scale, content moderation (NSFW filtering) becomes important. Build it in from day one, market it as a feature for hosts who care.

9. **Cost-to-operate matters more than any single feature**. Free tier needs to be cheap to run. Hard limits that matter:
   - Max image size on upload (e.g., resize to 2048px on the wire).
   - 7-day retention auto-delete.
   - 100-upload cap per event.
   - JPEG-only on free, PNG/HEIC on paid.
   - These keep storage and bandwidth costs predictable.

10. **The "TinyBooth-branded IG share format" doubles as marketing**. Every shared photo from a TinyWall event is a free billboard. Don't let paid hosts strip the watermark from the social-share format (only from saved/printed strips). This is the single biggest growth lever in the brief and competitors aren't doing it.

---

## Sources

### Photobooth apps
- [Simple Booth HALO App Store](https://apps.apple.com/us/app/simple-booth-halo/id1323267760)
- [Simple Booth Plans](https://www.simplebooth.com/plans)
- [Simple Booth's roundup of best iPad photo booth apps](https://www.simplebooth.com/blog/best-photo-booth-apps/)
- [LumaBooth App Store](https://apps.apple.com/us/app/lumabooth-event-photo-booth/id1162206015)
- [LumaBooth on dslrbooth.com](https://dslrbooth.com/lumabooth-photo-booth-app)
- [dslrBooth pricing](https://dslrbooth.com/pricing)
- [Pocketbooth iPhone App Store](https://apps.apple.com/us/app/pocketbooth-photo-booth/id385145330)
- [Pocketbooth Party iPad App Store](https://apps.apple.com/us/app/pocketbooth-party-photo-booth/id560180763)
- [Snappic pricing](https://www.snappic.com/pricing)
- [Booth.Events pricing](https://booth.events/pricing)
- [Mini Photobooth](https://miniphotobooth.co/)
- [Mini Photobooth App Store](https://apps.apple.com/us/app/mini-photobooth/id1342093386)
- [Snapbar's photo booth software comparison](https://snapbar.com/blog/2024-comparison-of-photo-booth-software-providers)
- [TinyBooth current App Store listing](https://apps.apple.com/us/app/tinybooth/id1519858905)

### Party photo walls
- [Kululu](https://www.kululu.com/) and [Kululu pricing](https://www.kululu.com/pricing)
- [JoinMyMoment](https://joinmymoment.com/) (April 2026 entrant: $19.99 one-time, 100 guests, Google Photos auto-sync. See `docs/research/iteration-2026-04.md`.)
- [EasyWeddingAlbum](https://easyweddingalbum.com/) (April 2026 entrant: $29 one-time, 12-month storage)
- [Fotify](https://fotify.app/event-photo-sharing/)
- [GuestPix wedding pricing](https://guestpix.com/weddings-pricing/) and [party pricing](https://guestpix.com/party-pricing/)
- [GuestCam](https://guestcam.co/)
- [LiveWall](https://livewall.no/)
- [DropEvent pricing](https://dropevent.com/pricing)
- [LiveShareNow pricing](https://www.livesharenow.com/pricing)
- [POV pricing](https://pov.camera/pricing)
- [Memento Photo](https://event.memento.photo/)
- [Joy app](https://withjoy.com/app/)
- [The Guest by The Knot](https://www.theknot.com/photo-sharing-app/)
- [WedShoots App Store](https://apps.apple.com/ca/app/wedshoots/id660256196)
- [Eversnap](https://www.eversnapapp.com/)
- [Lovecast pricing](https://www.lovecastapp.com/pricing)
- [The Knot waives Veri photo app fee, Marketing Dive](https://www.marketingdive.com/news/the-knot-waives-100-fee-for-photo-sharing-app/538831/)
- [The Knot Press Release on $100 photo sharing app](https://www.theknotww.com/press-releases/the-guest-photo-sharing-app/)
