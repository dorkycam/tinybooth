# TinyBooth Brand Identity

A proposal to refresh the TinyBooth brand. This is a starting point for review, not a final spec. Camrynn picks the direction, then we lock the system.

Reference assets read for this proposal:
- `tinybooth-old/assets/logo.png`
- `tinybooth-old/assets/icons/1024.jpg`
- `tinybooth-old/assets/tinybooth icons/1024.png`
- `tinybooth-wall/src/theme/themeConfig.ts`
- `tinybooth-wall/src/types/index.ts` (`DEFAULT_EVENT_SETTINGS`)

Drafts in `./assets/`.

---

## 1. Brand essence

TinyBooth is the friend who brings a real camera to the party. It is a small, well-made tool for capturing the night and printing something you want to keep. It looks confident the way Linear looks confident: clean type, restrained color, room to breathe. It has warmth (we are at a wedding, not a meeting) and a sense of humor (the post-photo random message is a feature, not a bug). It is not a kids app. It is not a Disney app. It is not a corporate SaaS dashboard. It is a small, sharp product that makes a printed photostrip you would actually pin to your fridge.

---

## 2. Logo direction

The existing mark is a squircle app icon with a mint background, a white inner ring, a lavender lens, and a comma-shaped highlight. The wordmark is "tinybooth" lowercase in a chunky rounded sans. People recognize it. We keep the lens-in-a-frame DNA and the lowercase wordmark. We modernize by simplifying shapes, dropping the glossy highlight, tightening the type, and re-balancing color so it does not read as a 2014 iOS icon.

Three directions, ordered from "most familiar" to "most modern."

### Direction A: Aperture Squircle (`logo-direction-1-aperture-squircle.svg`)

- Silhouette: superellipse / squircle, same proportions as today.
- Inside: a single flat lens disc with a 6-blade aperture mark and a coral center dot. No inner white ring. No glossy highlight.
- Why it fits: keeps maximum visual continuity with the App Store icon current users recognize. New mark reads as the same brand on day one.
- Inherits: squircle frame, centered lens, two-tone palette (frame vs lens).
- Best for: an App Store update where existing users should not feel the rug got pulled out.

### Direction B: Shutter Dot (`logo-direction-2-shutter-dot.svg`)

- Silhouette: pure circular lens. Outer ring + solid disc + one offset highlight dot. No squircle frame.
- Why it fits: the highlight dot is a direct rewrite of the comma reflection in the original. Same idea, fewer parts. Reads cleanly at favicon size (16px). Most "Linear / Vercel / Notion" of the three.
- Inherits: the lens-with-a-reflection idea. Loses the squircle.
- Best for: web favicon, social avatar, Stripe-style minimal mark. Pair with a stronger wordmark since the icon alone is more abstract.

### Direction C: Photo Tab (`logo-direction-3-photo-tab.svg`)

- Silhouette: squircle frame holding a Polaroid-style photo card. Photo viewport sits high in the frame, leaving a chunky bottom border like a printed instant photo.
- Why it fits: literal to the product (we make printed photo strips), and the bottom border is exactly where the watermark lives on a real strip. The brand and the product share a shape.
- Inherits: squircle, lens dot, two-tone color.
- Best for: a brand mark that doubles as a product mnemonic. Slightly busier than B, more modern than A.

**Recommendation:** Direction B for the lockup mark and favicon. Direction A as the App Store icon, so existing users see continuity. Direction C kept as a marketing illustration, not the primary mark.

---

## 3. Color palette

Two anchors, three accents, neutral system. Both modes share the same accent hex shifts so a designer only has to remember one family.

The current TinyWall theme uses Tailwind violet `#7c3aed` as primary and pure black `#0a0a0a` as background. Both are wrong for this brand. Violet 600 is the color of every B2B SaaS shipped in 2023. Pure black on a tablet at a dim venue makes the screen look like a void and shows every fingerprint. **Override both.**

### Light mode

| Role | Name | Hex | Use |
|---|---|---|---|
| Background | Paper | `#FBF7EE` | App background, photo paper, marketing site body |
| Surface | Cream | `#F4EAD8` | Cards, photostrip border, raised surfaces |
| Foreground | Ink | `#1F2937` | Body text, wordmark, icons |
| Subtle text | Graphite | `#5B6470` | Captions, helper text, metadata |
| Hairline | Stone | `#E5E0D5` | Dividers, input borders, disabled states |
| Primary accent | Coral | `#E85D5D` | Primary buttons, active states, lens center |
| Secondary accent | Mint | `#5FBFA6` | Success, TinyBooth-core highlights, heritage tie-back |
| Tertiary accent | Lilac | `#B488D6` | TinyWall sub-brand accent, secondary chips |

Contrast: Ink on Paper = 12.7:1 (AAA). Ink on Cream = 11.4:1 (AAA). Coral on Paper = 4.6:1 (AA for normal text). Mint on Ink = 7.8:1 (AAA). Lilac on Ink = 6.4:1 (AAA).

### Dark mode

| Role | Name | Hex | Use |
|---|---|---|---|
| Background | Carbon | `#0F1216` | App background (warmer than the current `#0a0a0a`) |
| Surface | Slate | `#181C22` | Cards, modals |
| Elevated | Slate-2 | `#21262E` | Popovers, raised tiles |
| Foreground | Cream | `#F4EAD8` | Body text, wordmark, icons |
| Subtle text | Fog | `#A8AEB8` | Captions, metadata |
| Hairline | `#2A2F37` | | Dividers, borders |
| Primary accent | Coral | `#FF7A6B` | Lifted for dark surfaces |
| Secondary accent | Mint | `#74D2B9` | |
| Tertiary accent | Lilac | `#C9A4E8` | TinyWall sub-brand |

Contrast on Carbon: Cream = 13.9:1, Coral `#FF7A6B` = 5.7:1, Mint `#74D2B9` = 9.1:1, Lilac `#C9A4E8` = 8.4:1. All pass AA for normal and large text.

### Why this palette

- **Cream + Ink** is the photostrip. Real photo paper is warm white, not cold white. Using it as the app background ties the digital UI to the physical output. Phones and tablets at a dim venue look better with a warm anchor than with pure white or pure black.
- **Coral** does the work that violet was doing in TinyWall. It is friendly, slightly retro, and reads warm under tungsten event lighting where blue-purples go muddy.
- **Mint and Lilac** are the heritage colors from the original mark. We keep them in the system but demote them from "the brand colors" to "supporting accents." Mint stays as the TinyBooth-core highlight. Lilac becomes the TinyWall sub-brand accent.
- We override the existing TinyWall `#7c3aed` and `#0a0a0a` defaults in `DEFAULT_EVENT_SETTINGS`.

### Tokens (suggested)

```ts
export const brand = {
  light: {
    bg: '#FBF7EE', surface: '#F4EAD8', fg: '#1F2937',
    subtle: '#5B6470', hairline: '#E5E0D5',
    coral: '#E85D5D', mint: '#5FBFA6', lilac: '#B488D6',
  },
  dark: {
    bg: '#0F1216', surface: '#181C22', elevated: '#21262E',
    fg: '#F4EAD8', subtle: '#A8AEB8', hairline: '#2A2F37',
    coral: '#FF7A6B', mint: '#74D2B9', lilac: '#C9A4E8',
  },
} as const;
```

---

## 4. Typography

All free, all on Google Fonts, all already installed on iOS and Android via system fallbacks.

### Primary recommendation: Manrope

- Display + UI + body. One family does the whole job.
- Geometric grotesque with slightly softened terminals. Reads as "modern" without reading as "tech bro." Has a 200-800 weight axis for headline contrast.
- Weights to ship: 500 (body), 600 (UI), 700 (display), 800 (hero only).
- Wordmark uses Manrope 700 with `letter-spacing: -1.5px` at large sizes.

### Alternative options

- **Playful option: Fraunces.** Variable serif with optional softness and "wonky" stylistic sets. Used for marketing display only, never UI. Pair with Manrope body.
- **Grown-up option: Inter.** The default. Safe, well-hinted, ships on every device. Use only if Manrope feels too distinct.

**Why Manrope wins:** Inter is the "I have no opinion" font. Fraunces alone is too writerly for a camera app. Manrope sits between them. It has personality (the rounded terminals echo the soft chunky feel of the existing wordmark) but holds up at 12px UI sizes.

### Handwriting accent: Caveat

- One purpose only: the random post-photo message and event captions on share images. Never UI. Never headlines. Caveat 500 at ~24-32px feels like Sharpie on a Polaroid.

### Type scale (tablet-first)

| Token | Size | Weight | Use |
|---|---|---|---|
| display-xl | 56 / 60 | 700 | Marketing hero only |
| display-lg | 40 / 48 | 700 | Screen titles on tablet |
| h1 | 32 / 40 | 700 | Sheet titles |
| h2 | 24 / 32 | 600 | Card titles |
| h3 | 18 / 24 | 600 | Subheadings |
| body | 17 / 24 | 500 | Default body on tablet |
| body-sm | 15 / 20 | 500 | Phone body, secondary copy |
| caption | 13 / 16 | 500 | Metadata, helper text |
| mono | 13 / 16 | 500 | Event codes, share URLs (use SF Mono / JetBrains Mono) |

Body size is bumped to 17px because the primary form factor is a tablet held at arm's length on a tripod. 14px reads tiny from 3 feet away.

---

## 5. Sub-brand system

TinyBooth is the parent. TinyWall is the first product. Future products are TinyX where X is a one-word noun.

### Naming rule

Always one lowercase compound word. Prefix is always `tiny`. The product noun describes what the user does, not the technology. "TinyWall" works because the wall is the user-facing artifact (a TV showing photos). A future TinyPrint, TinyTape, TinyStrip would all qualify. Avoid TinyAI, TinyCloud, TinyPro. Those describe us, not the user.

### Logo lockup

Two patterns. See `assets/sub-brand-lockup.svg`.

**Lockup A (preferred):** product wordmark + thin vertical rule + small "by tinybooth" tag in 2-line format ("by" / "tinybooth"). Rule is 2px, 40% opacity Ink. Used in product UI top bars, marketing site headers, App Store listings.

**Lockup B (compact):** product wordmark only with " by tinybooth" inline at 40% size. For favicons, social bios, footer credits.

Always lowercase. Always Manrope 700 product name + Manrope 600 parent. Never stack the two names vertically with equal weight, and never put "tinybooth" first.

### Color delta per product

Each product gets one of the three accents as its identity. The other two stay supporting roles in that product.

| Product | Identity accent | Supporting | Notes |
|---|---|---|---|
| TinyBooth (core app + marketing) | Coral `#E85D5D` | Mint, Lilac | The flagship. Coral is "the brand color" when in doubt. |
| TinyWall | Lilac `#B488D6` | Coral, Mint | Lilac echoes the original lens color, gives TinyWall its own identity, and overrides the current Tailwind violet. |
| TinyX (future) | Mint `#5FBFA6` | Coral, Lilac | Reserved. |

Event hosts also pick a per-event color via `EventTheme.buttonColor`. That always wins over the product accent inside event-scoped UI. The product accent only shows in marketing surfaces, settings, the app shell.

---

## 6. Photostrip border treatment

Mock at `assets/photostrip-watermark-mock.svg`.

The watermark is the brand-recognition lever. It must look intentional, not like a free-trial nag. People should photograph the strip and post it without trying to crop us out.

### Layout (1x4 classic strip, 600 x 1800 export, ~2 in x 6 in print)

- **Paper color:** Cream `#F4EAD8`. Not white. Real photo paper.
- **Gutter:** 32px between photos, 32px outer edges, 190px bottom branding zone.
- **Branding zone:** bottom 190px of the strip (~10.5% of total height).
  - Lens dot mark (Direction B at ~40px tall) flush left of the wordmark.
  - "tinybooth" wordmark in Manrope 700 at 46px, Ink color, `letter-spacing: -1px`.
  - Below it, "TINYBOOTH.COM" in Manrope 500 at 22px, Ink at 55% opacity, `letter-spacing: 2px`.
  - Centered as a group within the bottom zone.
- **Color:** always Ink on Cream. Do not tint to event colors. The watermark is TinyBooth, not the event. The event color shows up on the photo borders if the host picked one.
- **Opacity:** 100%. We are not hiding it. It looks like a printed credit on a wedding program, not a slapped-on badge.

### Other layouts

- **2x2 grid (square print):** branding zone runs across the bottom in the same height ratio. Same elements.
- **1x3:** same.
- **Single shot (4x6 / 5x7):** branding sits inside a thin 18px white margin on the bottom edge only. Wordmark only, no URL, to preserve photo space.

### Paid removal

Paid hosts can swap the TinyBooth watermark for their own event branding (event logo + event name) in the same zone. The watermark zone never disappears, only its contents change. This keeps the strip composition consistent and lets us add "powered by tinybooth" as a 12px tag in the lower-right corner at 30% opacity for paid strips. Optional, host can disable it.

---

## 7. IG-story share format

Mock at `assets/ig-story-share-mock.svg`. 1080 x 1920, 9:16.

### Layout

1. **Background:** Cream gradient, top `#F4EAD8` to bottom `#EAD9BC`. Subtle, not flashy. This is the warm anchor.
2. **Photo card:** centered, ~70% width, rotated -2.5°. Looks like a Polaroid laid on a table without being a Polaroid skeuomorph. White card with the photo inset and a 100px chunky bottom border.
3. **Caption:** event name in Caveat 56px, handwritten on the photo's bottom border. Limited to ~20 chars, truncate with ellipsis.
4. **Branding bar:** bottom 200px.
   - Lens mark + "tinybooth" wordmark, centered, Manrope 700 60px.
   - Sub-tag: "MAKE YOUR OWN AT TINYBOOTH.COM" in Manrope 500 26px, Ink at 60%, `letter-spacing: 3px`.
5. **Safe zones:** keep all critical content within Instagram's center 1080 x 1620 box. Avoid the top 250px (avatar / username) and bottom 250px (reply bar).

### Why this works

- It does not look like an ad. It looks like a digital photograph someone made and saved.
- The Cream background means the photo always pops, even if the photo itself is dim or low-contrast (a real concern at events).
- The wordmark is small enough that the photo is the hero, big enough that someone scrolling past can read it in 0.4 seconds.

### Paid removal

Per PROMPT.md, this is the brand vector. **Paid hosts do not get to remove the IG-version watermark.** We let them swap the bottom tag for their event hashtag (e.g. "TAG #SAMS30TH"), but the lens mark + "tinybooth" stays. This is non-negotiable in exchange for free distribution.

---

## 8. Voice and tone

Semi-playful, not childish. Direct without being curt. We assume the user is an adult at a party and we do not try to be their best friend.

Rules:
- Lowercase product name in body copy. Sentence case in UI labels.
- Contractions are fine. "Don't" beats "do not."
- One joke per screen, max. Usually zero.
- No exclamation marks except in the random message library.
- No emoji in UI strings. Emoji is fine inside user-generated content (captions, messages).
- Numbers are numbers. "4 photos" not "four photos."

### Examples

| Surface | Copy |
|---|---|
| Primary CTA, home | `Start a booth` |
| Secondary CTA, home | `Join an event` |
| Empty state, gallery | `No strips yet. Take a photo, get a strip.` |
| Empty state, events dashboard | `You haven't made an event yet. Start one when you have a date.` |
| Loading, after capture | `Cooking your strip` |
| Error, camera permission denied | `We can't get to your camera. Open Settings, find TinyBooth, flip Camera on.` |
| Error, upload failed | `That didn't go through. Try again, or save it for later.` |
| Confirmation, photo printed | `Sent to the printer. Should be out in a sec.` |
| Paywall, watermark removal | `Your strips, your name. Drop the TinyBooth credit and add your own.` |
| Paywall, custom messages | `Add your own one-liners to the random message pool.` |
| Free tier nudge (rare, never blocking) | `Free forever. The TinyBooth credit lives on the strip.` |
| Random message, after photo | `looking devastatingly normal today` |
| Random message, after photo | `the council has approved this strip` |
| Random message, after photo | `fourth one is the best one. always is.` |
| Random message, after photo | `do not show your mom` |
| Onboarding, single sentence | `Take a photo. Get a strip. That's the whole app.` |

### What the voice is not

- Not "Hey friend!" Not "Oops!" Not "Let's go!" Not "Yay!"
- Not "Embark on your photo journey."
- Not "Crafted with love by the TinyBooth team."
- Not lecturing about features the user did not ask about.

---

## 9. Things to avoid

Hard nos. If you find yourself reaching for any of these, stop.

- **No party emoji.** No confetti, no balloons, no party-popper, no champagne, no sparkles. No emoji rain animations.
- **No rainbow gradients.** No 6-color radial gradients. Coral-to-pink at most. Background gradients stay within one hue family.
- **No drop shadows on text.** No outer glows. No text strokes.
- **No Comic Sans, Bubblegum Sans, Fredoka One, Lobster, or any "kids menu" font.** No script fonts except Caveat in the one place specified.
- **No App Store icon clichés.** No glossy highlight on the lens. No skeuomorphic camera body. No film-grain overlay on the icon.
- **No tagline puns.** "Strike a pose" is banned. "Say cheese" is banned. "Picture perfect" is banned.
- **No "AI-powered."** Not in copy, not in marketing, not in feature names. We do not say it even if we use it under the hood.
- **No purple `#7c3aed`.** The Tailwind default violet. Override it everywhere it shows up in TinyWall. Use Lilac `#B488D6` instead.
- **No pure black `#000000`.** Use Carbon `#0F1216`. Black on tablets at venues looks like a dead screen.
- **No pure white `#FFFFFF`** as the app background. Use Paper `#FBF7EE`. White is for the inside of a photo card, not the canvas.
- **No mascot.** No little camera character with eyes. No avatar that waves. The brand has no face.
- **No countdown beeps with cartoon sounds.** Camera shutter only. One sound effect, period.
- **No "We" voice in marketing.** The product talks, not the team.
- **No stock photos of laughing diverse coworkers.** If we need photography, it is candid event photos taken on TinyBooth.

---

## Open questions for review

1. Do we want to keep the squircle as the App Store icon (Direction A) for continuity, or fully switch to the lens-only mark (Direction B) and accept that existing users will see a "different" icon at next update?
2. Coral as primary vs Mint as primary. Coral is more current and reads warmer at venues. Mint is closer to the original brand. I picked Coral. Want to test Mint?
3. Watermark on paid IG shares: lock to "always TinyBooth, swap tag only" as proposed, or let paid hosts fully replace it? My take: lock it. The IG share is the only free distribution channel and we earn it back by not gating the rest.
4. Should the per-event `EventTheme.buttonColor` default change from `#7c3aed` to `#E85D5D` (Coral) so unconfigured events match the brand?
