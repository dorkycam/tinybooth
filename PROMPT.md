I have two existing apps that I want to modernize and grow.

**Brand & naming**
- TinyBooth is the company / parent brand.
- TinyWall is a product under TinyBooth (refer to it as "TinyWall by TinyBooth").
- Brand identity should be strong, semi-playful, but not childish. Think confident and friendly, not cutesy.

**TinyBooth (the photobooth app)** - Currently iOS only. It's old, 100% free, no accounts, no monetization. I want to:
1. Modernize the app. A single cross-platform codebase (React Native, Flutter, etc.) that ships to both iOS and Android is preferred if it can deliver every feature well. Two separate native apps are acceptable only if cross-platform genuinely can't.
2. Better tablet support (iPad and Android tablets). **Tablet is the primary form factor for the photobooth app** — most real-world use is on a propped-up iPad at an event. Design tablet-first, then make sure phones still look good. Treat phone as secondary, not the default. Landscape and portrait both must look polished on tablets.
3. Figure out a monetization strategy that makes sense (see "Monetization & free tier" below).
4. Build a website at tinybooth.com with the best SEO possible.
5. Support multiple photostrip / photo layout options (classic strip, 2x2, single, etc. — research what's standard).
6. Keep the random message that appears after each photo. This is a beloved feature. Keep the existing message library and let users customize / add their own messages at some tier.
7. Keep the app simple and straightforward. The current simplicity is a feature, not a limitation. Add customization without making the UX heavier — and do it without forcing users to log into a separate website to configure anything.

**TinyWall** - A sister app for parties. A TV displays a QR code pointing to wall.tinybooth.com where guests scan it and upload photos that appear on the TV in real-time. I want to modernize this too.

**Existing assets:**
- TinyBooth iOS app: https://apps.apple.com/us/app/tinybooth/id1519858905
- TinyBooth website domain: tinybooth.com (on GoDaddy)
- TinyWall domain: wall.tinybooth.com (on GoDaddy)
- TinyWall has an existing Vercel deployment with Vercel Postgres DB. Download all data locally before migrating. Read the .env files in tinybooth-wall/ for the database connection string.
- Start by reading the App Store listing and any existing code repos to understand what's already built.

**Local project structure:**
- `tinybooth-old/` - The original Swift/iOS project that's currently live on the App Store. This is READ-ONLY reference. Do NOT commit to or modify this repo. Use it to understand what the current app does, what features exist, and what the UI looks like. The new app does not need to be in Swift. Pick whatever tech stack makes the most sense.
- `tinybooth-wall/` - The TinyWall TV/party project with the Vercel deployment. Read this code too. This CAN be modified directly. It was built recently and is the active codebase for TinyWall.
- Create a NEW folder/repo for the new TinyBooth app. Do not modify tinybooth-old/.
- Keep the same App Store bundle ID from tinybooth-old so the update goes to existing users.

**TinyWall details:**
- Currently deployed on Vercel with Vercel's database (Postgres)
- It was a proof of concept used for one personal event
- Before doing anything, download all existing data locally so I don't lose it
- I'm fine migrating away from Vercel's DB to Supabase or AWS, whatever makes the most sense
- The app should stay free to use but with premium features behind a paywall (freemium)
- This should be another source of passive income like Fitted
- Think about what premium features party hosts would actually pay for (custom branding, higher upload limits, photo filters, slideshow modes, analytics, etc.)
- Event guests / uploaders should NEVER need to download an app or create an account to upload a photo. Scan QR, take/pick photo, it appears on the wall. That's it.

**Events (cross-product feature):**
- Introduce a first-class concept of an "event" in the system.
- An event has a name, a logo, theme colors, optionally a date / location, and other branding settings.
- Printed / saved photostrips from TinyBooth use the event's theme as a border / accent.
- A TinyWall instance can be connected to an event so uploads from guests are tagged to it.
- A web dashboard (probably at tinybooth.com or events.tinybooth.com) lets the event owner see both TinyBooth photos and TinyWall uploads from that event in one place. Download all, share, etc.
- Events are the natural unit that ties the two products together and is a strong place to monetize (custom branding, more storage, longer retention, higher guest counts, etc.).

**Account model:**
- TinyBooth (the app) should be usable with NO account for basic / standalone use. Open it, take photos, save them. Done.
- An account is only required to create / manage events and access the cross-device dashboard.
- TinyWall guests / uploaders never need an account.
- Event hosts need an account (to own the event, manage branding, see the dashboard).

**Monetization & free tier philosophy:**
- Free tier should be genuinely useful, not a crippled demo. The current app is 100% free; existing users should not feel betrayed.
- Free TinyBooth: includes a small "TinyBooth" logo / watermark on the photostrip. Paying removes it. This is the core free-to-paid lever.
- Free tier must be cheap for me to operate (be thoughtful about storage, compute, retention, image sizes, etc.). Picking the right defaults here matters more than any single paid feature.
- Don't gate so many features that the free app feels lame. Things that cost me nothing (layouts, basic filters, the random message) should generally stay free.
- Things that cost me real money or are clearly "host / event / pro" (custom event branding, dashboard, longer retention, higher guest counts, custom messages library, removing the watermark, exporting in bulk) are fair game for paid.

**What I need you to do (you'll be working while I sleep):**

Before building anything, do extensive research on each of these:
1. Market analysis - who are the competitors? What do they charge? What features do they have? What's missing?
2. User research - what do photobooth app users actually want? What do party hosts need? Search Reddit, app store reviews of competitors, etc.
3. Monetization research - what pricing model works best for this type of app? Freemium? One-time purchase? Credits?
4. Tech stack research - what's the best way to build cross-platform (iOS + Android)? React Native? Flutter? What makes sense given that iOS already exists?
5. SEO research - how do we rank #1 for photobooth app searches?

After research, create a detailed plan. Then implement it. Then research competitors again and iterate. Then do an audit and fix issues. Keep going until it's polished.

**Rules to follow (these are non-negotiable):**
- Never use em dashes (the long dash character). Use periods, commas, or semicolons instead.
- Never use AI-sounding words: leverage, robust, comprehensive, seamless, streamline, elevate, optimize, synergy, empower, holistic, pivotal, delve, tapestry, landscape (as metaphor), testament, groundbreaking, revolutionary, game-changing, cutting-edge, state-of-the-art, innovative (as assertion), transformative, dynamic, mission-critical, vibrant, showcasing, profound, diverse array.
- Never use phrases like "that said", "I want to be transparent", "to be honest", "it's important to note". Just state facts directly.
- All copy should sound like a real person wrote it, not an AI.
- Be specific with numbers and real details, not vague claims.
- Write tests for everything. Fix broken code, not broken tests.
- Document everything.
- If you have questions, list them all at the start before I go to sleep so I can answer them.
- Don't implement anything that costs me money while I sleep. Use mock/free tiers for development.
- Do NOT push anything to GitHub or deploy anything while I sleep. Commit locally only. I will review and push when I wake up.
- Save all research findings to docs/ folder.
- Commit frequently with descriptive messages.
- If using AWS, write Terraform for all infrastructure. No manual AWS console setup. Follow the same pattern as my bookish project at /Users/dorkycam/projects/bookish/bookish-infra/: separate `terraform/environments/staging` and `terraform/environments/production` directories, shared `terraform/modules/`, environment-specific tfvars. Read that repo for reference.
- Docker is available and running. Use it for local development and testing. Test everything while implementing.
- Set up GitHub Actions for CI/CD (linting, tests, builds). Have the pipeline ready even if we don't push yet.
- For app deployment (iOS/Android), minimize friction. Use EAS Build (Expo), Fastlane, or whatever automates the build-and-submit process so I don't have to manually archive and upload. Scripts or CI pipelines that handle it with one command are ideal.
- Read /Users/dorkycam/.claude/CLAUDE.md for my coding standards (TypeScript, explicit return types, JSDoc, camelCase, etc.).

**My accounts/info:**
- I'm based in Los Angeles, CA
- I have Apple Developer and Google Play developer accounts
- I have AWS, Vercel, and Supabase accounts
- I don't want to manage inventory, employees, or anything high-maintenance
- I prefer a credits or pay-per-use model over subscriptions
- TinyBooth/TinyWall will need its own Stripe account (separate from my other projects). Don't set this up while I sleep, just note where it's needed.
- For in-app purchases: follow Apple App Store and Google Play Store guidelines strictly. Apple takes 30% on IAP and will reject apps that try to bypass it. Research the rules and make sure the monetization strategy is compliant. If premium features are sold inside the app, use Apple/Google's native IAP systems. Web-only purchases may be an option for some features but research what's allowed.

**Ask me any questions before I go to bed.**

---

## Answers from Camrynn (round 1)

1. **Free tier storage retention.** Confirmed. TinyWall photos: ~7 days post-event for free, longer for paid. TinyBooth standalone photos: device only (camera roll), no cloud upload unless tied to an event.
2. **Current TinyBooth output.** Both physical print and camera roll. Physical printing must be preserved. Read the Swift code in `tinybooth-old/` to find the printer integration; assume AirPrint unless the code says otherwise.
3. **Dashboard URL.** Pick whatever is best for SEO. Default to `tinybooth.com/dashboard` (consolidates domain authority on the marketing site) unless research shows a subdomain is meaningfully better.
4. **Random messages.** Keep them static. No AI generation. Preserve the existing message list verbatim from the Swift app — read it out of `tinybooth-old/` and migrate it. It's fine to add to the library, but don't remove anything. Customization at paid tier = users add their own messages to the static pool.
5. **Brand assets.** There is an existing logo at `tinybooth-old/assets/logo.png` plus icon sets in `tinybooth-old/assets/icons/` and `tinybooth-old/assets/tinybooth icons/`. Camrynn likes it but wants it modernized. Treat the existing logo as the starting point — keep the spirit / shape language, refresh the execution. Propose a refreshed mark + color palette + type system in the brand doc.
6. **Auth.** "Is all a heavy lift?" — answer: no, not really. Use a managed auth provider (Supabase Auth, Clerk, or Auth.js) so Apple + Google + email magic link is mostly config. Skip passwords entirely. Apple Sign-In is required by App Store rules if any other social login is offered, so it has to be in.
7. **Layouts & sharing.**
   - Printable photostrips are required (multiple configurations: 1x4 classic, 2x2, 1x3, single, etc.).
   - At an event with a paid host, guests can opt to have their strip emailed or texted to themselves. Capture email/phone at the booth, send via SES/Twilio (or equivalent). This is a paid-host feature, not a free feature, because it costs me money per send.
   - Also generate a shareable link with an IG-story-formatted version of the photo that has the TinyBooth logo on it. This is the brand-recognition lever — encourage sharing, get free distribution. Free tier gets the watermark; paid hosts can remove the watermark from the IG version too (or maybe not, since the IG version is specifically the brand vector — decide during design).
8. **Scope.** Go ham. Full research → plan → implement → compare to competitors → iterate loop. Multiple iterations expected. Always benchmark feature set against competitors to make sure TinyBooth offers the most value at each tier. Camrynn is willing to wait past wake-up if needed. Still: no deploys, no pushes to GitHub, no spending money. Local commits only.
