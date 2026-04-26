# TinyWall Codebase Audit

## Executive Summary

TinyWall is a Next.js 14 web app that enables guests at events to scan a QR code and upload photos to a live TV display wall in real-time. The current implementation is a proof-of-concept (PoC) that was deployed for a single personal event. It uses Neon Postgres for the database, Vercel Blob for photo/video storage, and is hosted on Vercel.

Database backup files are stored at `/Users/dorkycam/projects/tinybooth/data/backups/tinywall-prod-20260426-015624-*.csv` and schema dump.

---

## 1. Tech Stack

### Framework & Core
- **Next.js**: 14.2.23 (App Router)
- **React**: 18.3.1
- **TypeScript**: 5.7.0 (strict mode)
- **Package Manager**: Yarn

### Database
- **Primary**: PostgreSQL via Neon (cloud-hosted)
- **ORM**: Prisma 6.4.0
- **Backup Connection Strings**:
  - Pooled: `POSTGRES_PRISMA_URL` (pooler.c-5.us-east-1.aws.neon.tech)
  - Non-pooled: `POSTGRES_URL_NON_POOLING` (direct c-5.us-east-1.aws.neon.tech)
  - Host: ep-shiny-poetry-amk5awkg[-pooler].c-5.us-east-1.aws.neon.tech
  - Database: neondb
  - User: neondb_owner
  - Neon Project ID: shiny-river-59275274

### File Storage
- **Photos/Videos**: Vercel Blob (public access)
  - Token available in `.env` as `BLOB_READ_WRITE_TOKEN`
  - Images: Stored after resize to max 1920px width, converted to WebP (80% quality)
  - Videos: Stored unprocessed (up to 100MB, max 15 seconds duration)
  - Path pattern: `{eventSlug}/{timestamp}-{randomId}.webp` or `{eventSlug}/{timestamp}-{randomId}-{originalName}`
  - Remote patterns configured in `next.config.mjs`: `*.public.blob.vercel-storage.com`

### UI Framework
- **Ant Design**: 5.23.0 (component library)
- **Styling**: Tailwind CSS (via Ant Design integration)
- **QR Code Generation**: qrcode.react 4.2.0

### Real-time & API
- **GraphQL**: Apollo Server 4.11.0 + Next.js integration
  - Single endpoint at `/api/graphql`
  - Supports both GET (playground) and POST (queries/mutations)
- **Real-time Updates**: Polling (3-second interval) from TV display to fetch new posts
- **File Processing**: Sharp 0.33.5 (image resizing, format conversion, EXIF rotation)

### Utilities
- **Content Moderation**: bad-words 4.0.0 (profanity filtering)
- **Environment**: .env and .env.local support via Vercel CLI

---

## 2. Data Model

### Prisma Schema Summary

```prisma
model Event {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  settings    Json     @default("{}")        # EventSettings JSON blob
  dateCreated DateTime @default(now())
  posts       Post[]
  @@index([slug])
}

model Post {
  id          String   @id @default(cuid())
  eventId     String                        # FK to Event
  event       Event    @relation(fields: [eventId], references: [id])
  caption     String?                       # Optional short caption (~100 chars max)
  dateCreated DateTime @default(now())
  photos      Photo[]
  @@index([eventId, dateCreated])
}

model Photo {
  id          String   @id @default(cuid())
  postId      String                        # FK to Post
  post        Post     @relation(fields: [postId], references: [id])
  url         String                        # Vercel Blob public URL
  mediaType   String   @default("image")    # "image" or "video"
  width       Int      @default(0)          # Image/video dimensions
  height      Int      @default(0)
  order       Int      @default(0)          # Sort order within a post
  dateCreated DateTime @default(now())
  @@index([postId])
}
```

### EventSettings (JSON in Event.settings)

```typescript
interface EventSettings {
  theme: {
    buttonColor: string;              # Hex color
    secondaryButtonColor: string;
    textColor: string;
    subtextColor: string;
    backgroundColor: string;
  };
  allowChooseFromLibrary: boolean;    # Allow selecting from camera roll
  allowVideo: boolean;                # Allow video uploads
  allowCaptions: boolean;             # Allow caption input
  maxPhotosPerPost: number;           # Max files per upload (default 10)
  slideShowSpeed: number;             # Slideshow interval in seconds (default 3.5)
}
```

### Default EventSettings

```typescript
{
  theme: {
    buttonColor: "#7c3aed",           // Purple
    secondaryButtonColor: "#333333",
    textColor: "#fafafa",
    subtextColor: "#aaaaaa",
    backgroundColor: "#0a0a0a",       // Dark background
  },
  allowChooseFromLibrary: true,
  allowVideo: true,
  allowCaptions: true,
  maxPhotosPerPost: 10,
  slideShowSpeed: 3.5,
}
```

### Current Database State (as of 2026-04-26)

- **Events**: 4
- **Posts**: 48
- **Photos**: 71
- **Backup Location**: `/Users/dorkycam/projects/tinybooth/data/backups/tinywall-prod-20260426-015624-*.csv`

---

## 3. Upload Flow

### Guest Upload Route: `/{slug}/post`

1. **Initial Page Load** (Server Component):
   - Fetches event by slug, returns 404 if not found
   - Passes event data to `PostFlow` client component
   - Merges stored settings with defaults

2. **Client-side State Machine** (`PostFlow`):
   - **WELCOME**: First-time visitors see event name and confirmation screen
   - **CAPTURE**: Camera/photo library picker (after welcome or on return visits)
   - **PREVIEW**: Multi-file preview + optional caption input
   - **UPLOADING**: Upload in progress
   - **Persistence**: Uses localStorage key `visited-{slug}` to skip welcome on repeat visits

3. **Photo Selection** (Client):
   - Via `<input type="file" multiple accept="image/*,video/*">` (HTML5 File API)
   - Can select multiple files (images and/or videos)
   - Enforces max files per post (configurable, default 10)
   - Filters out videos if `allowVideo` is false

4. **Upload Logic** (Hybrid):
   - **Images** (processed):
     - Sent to `/api/upload` POST endpoint
     - Sharp processes: auto-rotate (EXIF), resize max 1920px width, convert to WebP
     - Uploaded to Vercel Blob by server route
     - Returns array with URL, mediaType, width, height
   - **Videos** (unprocessed):
     - Uploaded directly to Vercel Blob via client-side `@vercel/blob/client` upload
     - First requests token from `/api/upload/token` endpoint
     - Token restricts to video/* MIME types, max 100MB
     - Client validates: file size, duration (max 15 seconds)
   - **Rate Limits**: Max 10 files per request (enforced in `/api/upload`)

5. **Post Creation** (GraphQL Mutation):
   - After all files uploaded, calls `createPost` mutation with:
     - eventId
     - caption (optional, sanitized)
     - photos (array of { url, mediaType, width, height })
   - Sanitization:
     - Captions: stripped of HTML, URLs, truncated to 100 chars
     - Profanity checked via bad-words, cleaned if detected
   - Returns post ID on success

6. **Auth**: None. Guests upload without accounts or authentication.

7. **Storage Details**:
   - Vercel Blob with public access (URLs are public, anyone can view)
   - Images: WebP format, ~80% quality
   - Path: `{eventSlug}/{Date.now()}-{randomId}.webp`
   - Videos: Original format (mp4, webm, mkv, avi, quicktime)
   - Path: `{eventSlug}/{Date.now()}-{randomId}-{originalName}`

---

## 4. TV/Wall Display

### Route: `/{slug}`

1. **Initial Page Load** (Server Component):
   - Fetches event by slug
   - Fetches all posts (or last 2 hours if total posts >= 100)
   - Passes initial data to `PhotoGrid` client component
   - Time window cutoff: `2 hours ago` when post count >= 100

2. **Full-Viewport Grid** (`PhotoGrid`):
   - Fills entire browser window (no scroll)
   - Dark background theme
   - Grid cell size: ~280px (responsive, recalculates on resize)
   - Square base cells:
     - Portrait photos: span 2 rows
     - Landscape photos: span 2 columns
   - Post rotation (carousel):
     - If more posts than grid capacity, randomly swaps tiles every 5 seconds
     - Only keeps visible-on-screen posts in memory

3. **Photo Tile** (`PhotoTile`):
   - Single or multi-photo post (up to 10 photos)
   - Multi-photo posts: slideshow (rotates every `slideShowSpeed` seconds, configurable)
   - Displays caption if present (100 chars max)
   - Responsive image/video rendering

4. **QR Code Overlay** (Fixed Position):
   - Bottom-right corner, semi-transparent dark background with blur
   - Small QR code (120px)
   - Links to `/{slug}/post`
   - Always visible for guests to scan

5. **Real-time Updates** (Client-side Polling):
   - Polls GraphQL endpoint every 3 seconds
   - Query: `posts(eventId, since?)` with optional time window filter
   - Merges new posts with existing ones
   - New posts are appended and animate in

6. **Empty State**:
   - If no posts yet, shows event name + "Scan the QR code to post the first photo!"
   - Displays large QR code in center

---

## 5. QR Code Flow

1. **Generation**:
   - Created on-the-fly in `CreateEventForm` (landing page, after event creation)
   - Also rendered in `QROverlay` (TV display, bottom-right)
   - Uses `qrcode.react` library with QRCodeSVG component
   - Points to: `{NEXT_PUBLIC_BASE_URL}/{slug}/post`
   - SVG format (scalable)

2. **Display**:
   - TV display: 120px QR in corner
   - Event creation confirmation: 200px QR for copying/printing

3. **How Guests Use**:
   - Scan QR with phone camera or QR app
   - Opens URL: `https://wall.tinybooth.com/{slug}/post`
   - Lands on upload page

---

## 6. Admin / Event-Creation Flow

### Landing Page: `/`

1. **`CreateEventForm`** (Client Component):
   - Text input for event name
   - Collapsed settings panel with defaults
   - Settings editable before or after event creation:
     - Theme colors (5 color pickers)
     - Toggles: allowChooseFromLibrary, allowVideo, allowCaptions
     - Numeric: maxPhotosPerPost (slider 1-20)
     - Slider: slideShowSpeed (1-10s, 0.5s increments)

2. **Event Creation**:
   - Calls `createEvent` mutation with name
   - Generates slug: `{slugified-name}-{4-char-random-suffix}` (unique, deterministic via cuid)
   - Optionally calls `adminUpdateEventSettings` immediately after to save theme/feature toggles
   - Returns event ID, slug, URLs
   - Success message displays:
     - TV URL: `/{slug}` (shareable, for displaying on screen)
     - Guest URL: `/{slug}/post` (shareable, QR-able)
     - Printable QR code (200px, dark-on-light for contrast)
   - "Create Another Event" button clears form

### Admin Panel: `/admin`

1. **Auth Gate** (Client):
   - Client-side password protection (not secure, but prevents accidental access)
   - Password stored in `.env.local` as `ADMIN_PASSWORD="purpleCARROTS410!"`
   - Auth state stored in localStorage (key from `AUTH_STORAGE_KEY`)
   - Clears on browser close (sessionStorage-like behavior)

2. **Event List** (`AdminEventList`):
   - Fetches all events via `adminEvents` query
   - Lists events with basic metadata
   - (Component details not fully reviewed; GraphQL mutations available: updateEvent, deleteEvent, updateSettings)

3. **Event Detail** (`AdminEventDetail`):
   - (Component details not fully reviewed)
   - Likely allows editing event name, settings, viewing posts, deleting events/posts

4. **Admin Mutations**:
   - `adminUpdateEvent(id, name)` - rename event
   - `adminUpdateEventSettings(id, settings)` - update theme/features
   - `adminDeleteEvent(id)` - delete event + all posts + delete blobs from Vercel
   - `adminUpdatePost(id, caption)` - edit post caption
   - `adminDeletePost(id)` - delete individual post + its blobs

---

## 7. API Routes Inventory

### GraphQL Endpoint
- **Path**: `/api/graphql`
- **Methods**: GET (playground), POST (queries/mutations)
- **Server**: Apollo Server 4
- **Context**: Provides Prisma client (`db`)

### REST Endpoints
- **POST `/api/upload`**:
  - Accepts multipart form data: `{ eventSlug: string, photos: File[] }`
  - Max 10 files per request
  - Returns: `{ photos: [ { url, mediaType, width, height } ] }`
  - Processes images: auto-rotate, resize, convert to WebP
  - Uploads to Vercel Blob

- **POST `/api/upload/token`**:
  - Client-side upload token request (Vercel Blob integration)
  - Accepts JSON body for file metadata
  - Returns: `{ token: string, ... }`
  - Enforces video MIME types, 100MB max size

### GraphQL Query & Mutation Reference

**Queries**:
- `event(slug: String!)`: Get event by slug + all posts + photos
- `posts(eventId: ID!, since?: DateTime, limit?: Int)`: Get posts for event
- `adminEventById(id: ID!)`: Get event by ID (admin)
- `adminEvents`: Get all events (admin)

**Mutations**:
- `createEvent(name: String!)`: Create new event
- `createPost(eventId: ID!, caption?: String, photos: [PhotoInput!]!)`: Create post
- `adminUpdateEvent(id: ID!, name: String!)`: Rename event
- `adminUpdateEventSettings(id: ID!, settings: EventSettingsInput!)`: Update settings
- `adminDeleteEvent(id: ID!)`: Delete event + all data + blobs
- `adminUpdatePost(id: ID!, caption?: String)`: Edit caption
- `adminDeletePost(id: ID!)`: Delete post

---

## 8. Environment Variables

### Database (Postgres via Neon)
- `POSTGRES_PRISMA_URL` - Pooled connection URL
- `POSTGRES_URL_NON_POOLING` - Direct connection URL
- `POSTGRES_URL` - Alias for pooled
- `POSTGRES_HOST` - Pooler hostname
- `POSTGRES_PGHOST` - Pooler hostname
- `POSTGRES_DATABASE` - Database name (neondb)
- `POSTGRES_USER` - Username (neondb_owner)
- `POSTGRES_PASSWORD` - Password
- `POSTGRES_NEON_PROJECT_ID` - Neon project ID

### File Storage (Vercel Blob)
- `BLOB_READ_WRITE_TOKEN` - Authentication token for Vercel Blob

### App Config
- `NEXT_PUBLIC_BASE_URL` - Public URL for QR codes and links (http://localhost:3000 or https://wall.tinybooth.com)
- `ADMIN_PASSWORD` - Admin panel password (plaintext in .env)
- `AUTH_STORAGE_KEY` - localStorage key for admin auth state
- `NODE_ENV` - Node environment (development/production)

### Not Directly Used but Available
- `VERCEL_OIDC_TOKEN` - Vercel CI/CD token
- `POSTGRES_DATABASE_URL`, `POSTGRES_DATABASE_URL_UNPOOLED`, `POSTGRES_URL_NO_SSL` - Aliases

---

## 9. Known Limitations & PoC Notes

### PoC Quality Issues
1. **Admin Auth**: Client-side password only (not cryptographically secure)
   - Should use proper authentication (Clerk, Auth.js, Supabase)
   - Password stored plaintext in .env

2. **No Account Model**: All uploads are anonymous
   - No way to track who uploaded what
   - No email/SMS verification

3. **No Rate Limiting**:
   - Guests can upload unlimited times
   - No IP-based or user-based throttling
   - Potential for spam/abuse

4. **Photo Retention**: No automatic cleanup
   - Photos stored indefinitely in Vercel Blob
   - No expiration policy (Prompt mentions 7-day free, longer for paid)
   - Manual deletion required

5. **Slug Uniqueness**: Random suffix adds uniqueness but not collision-proof
   - Two events created simultaneously could theoretically collide
   - No uniqueness constraint validation before creation

6. **Real-time Updates**: Polling every 3 seconds (not true real-time)
   - Network overhead; not ideal for many concurrent viewers
   - No WebSockets or Server-Sent Events

7. **Video Support**: Experimental, not fully tested
   - 100MB size limit (could be excessive or insufficient)
   - 15-second duration limit
   - No transcoding or adaptive bitrate

8. **No Pagination/Infinite Scroll**: Fetches all posts each poll
   - Performance degrades with large post counts
   - Time window cutoff (2 hours when >= 100 posts) helps but is rigid

9. **Settings Storage**: Entire EventSettings JSON in single column
   - Not normalized
   - No versioning or migration path for schema changes
   - Type safety relies on runtime merging with defaults

10. **No Search/Filtering**: Can't search by event name or date
    - All events listed in admin dashboard
    - No sorting options visible in code

11. **No Backup Strategy**: No automated backups of Vercel Blob
    - Only database has backup (manual)
    - Photos/videos only backed up by user (if downloaded)

---

## 10. What We Need to Change for...

### Multi-Event Support (Cross-Product)
- **Already Supported**: Data model has Event + slug uniqueness
- **To Add**:
  - Dashboard to list user's own events (tied to account)
  - Ownership/sharing model (who can edit event?)
  - Event-level settings propagation to TinyBooth app

### No-Account Guest Upload
- **Already Supported**: Current design is account-free
- **To Add**:
  - Email/SMS capture (optional, for sending photos post-event)
  - Cookie/device tracking (optional, to know repeat guests)
  - Optional "Save my email" checkbox on upload screen

### Real-Time Updates at Scale
- **Current**: Polling every 3s
- **To Change**:
  - Implement WebSockets (ws or Socket.IO) or Server-Sent Events (SSE)
  - Alternative: Longer polling interval + fewer requests
  - Use Redis for pub/sub if multiple servers
  - Consider SignalR (if moving to Node/TypeScript backend)

### Photo Retention Windows
- **Current**: Indefinite
- **To Add**:
  - Add `expiresAt: DateTime` field to Photo/Post model
  - Cron job or scheduled Lambda to delete expired photos from Blob + DB
  - Admin settings: "Free tier: 7 days, Paid: 30 days, etc."
  - Display countdown on TV display ("Expires in X days")

### Monetization
- **Needed**:
  - User account model (email/auth)
  - Billing integration (Stripe)
  - Product/plan model (free, premium, etc.)
  - Usage tracking (GB stored, API calls, concurrent viewers)
  - Admin dashboard showing usage + limits
  - Feature flags per plan (watermark, higher limits, custom branding, etc.)

### Admin Features
- **Needed**:
  - Proper user authentication
  - Event ownership verification
  - Post moderation (approve/reject before display)
  - Analytics (view counts, engagement, guest stats)
  - Export/download all photos as ZIP
  - Scheduled deletion with confirmation
  - Bulk operations (delete multiple posts)

---

## 11. File Storage & External Assets

### Vercel Blob Usage
- **Bucket Name**: Vercel Blob (managed by Vercel, bucket name not visible to us)
- **Access**: Token-based (`BLOB_READ_WRITE_TOKEN`)
- **Current Object Count**: ~71 photos (based on Photo table count)
  - Actual count on Blob may differ if some photos were deleted from DB but not Blob
  - No direct query to Vercel API available in current code
- **Path Pattern**: `{eventSlug}/{timestamp}-{randomId}(-{originalName})?`
- **Example Paths from DB**:
  - Photos stored with URLs like: `https://[projectid].public.blob.vercel-storage.com/...`

### How to Audit Blob Storage
```bash
# No direct CLI tool provided in codebase
# Would need to:
# 1. Use Vercel web dashboard
# 2. Use Vercel API: https://vercel.com/docs/storage/vercel-blob/api-reference
# 3. Or iterate through Photo records and check if URLs are reachable
```

### Backup Strategy
- Database: CSV backups created (Event, Post, Photo records)
- Blob assets: NOT downloaded locally (could be large, private)
- Note: To restore, would need to:
  - Restore DB from CSV
  - Re-upload photos to Vercel Blob (or migrate to different storage)

---

## 12. Component & Hook Structure

### Key Components
- `CreateEventForm` - Event creation + settings UI
- `PhotoGrid` - TV display grid layout + polling
- `PhotoTile` - Individual post tile with slideshow
- `QROverlay` - QR code in corner
- `PostFlow` - Guest upload state machine
- `CameraCapture` - Camera/photo library picker
- `PhotoPreview` - Multi-file preview + caption input
- `WelcomeScreen` - First-time visitor intro
- `AdminAuthGate` - Client-side password gate
- `AdminEventList` - List all events (limited review)
- `AdminEventDetail` - Edit event (limited review)

### Hooks (Located in `/src/hooks/`)
- `useLocalStorage` - Persist state to localStorage
- `usePolling` - Interval-based polling for new data
- (Others not reviewed)

---

## 13. Code Quality Notes

### Strengths
- TypeScript strict mode enforced
- JSDoc comments on exported functions
- Component organization (one per file, extracted helpers)
- Prisma with type safety
- GraphQL for structured API

### Areas for Improvement
- Admin password in plaintext
- No error boundaries
- Limited input validation (relies on GraphQL schema)
- Test coverage not evident
- No logging/monitoring visible
- No CI/CD pipeline visible (GitHub Actions could be added)

---

## 14. Deployment & Hosting

- **Platform**: Vercel (Next.js native)
- **Domain**: wall.tinybooth.com (GoDaddy DNS likely points to Vercel)
- **Database**: Neon Postgres (cloud, east-us-1 region)
- **Storage**: Vercel Blob (co-located with Vercel)
- **Configuration**: Via `.env` and `.env.local` (pushed to Vercel during deploy)

---

## Summary Table

| Aspect | Details |
|--------|---------|
| **Framework** | Next.js 14.2, React 18, TypeScript strict |
| **Database** | Neon Postgres (POSTGRES_PRISMA_URL) |
| **ORM** | Prisma 6.4 |
| **API** | GraphQL (Apollo Server) + REST (/api/upload) |
| **File Storage** | Vercel Blob (images as WebP, videos as-is) |
| **Real-time** | Polling (3s interval) |
| **Auth** | None for guests; client-side password for admin |
| **Current Data** | 4 events, 48 posts, 71 photos |
| **UI Components** | Ant Design 5.23 |
| **Hosting** | Vercel |
| **PoC Status** | Proof-of-concept, single-event tested |

---

## Database Backup Files

All data has been exported to CSV format for portability and easy reconstruction:

- `/Users/dorkycam/projects/tinybooth/data/backups/tinywall-prod-20260426-015624-Event.csv`
- `/Users/dorkycam/projects/tinybooth/data/backups/tinywall-prod-20260426-015624-Post.csv`
- `/Users/dorkycam/projects/tinybooth/data/backups/tinywall-prod-20260426-015624-Photo.csv`
- `/Users/dorkycam/projects/tinybooth/data/backups/tinywall-prod-20260426-015624-schema.sql`

To restore:
```bash
# Restore to a new database
psql -h your-host -U username -d dbname < schema.sql
# Then import CSV data via COPY
```

---

**Document Generated**: 2026-04-26
**Codebase Location**: `/Users/dorkycam/projects/tinybooth/tinybooth-wall/`
**Status**: Read-only audit completed. No modifications made.
