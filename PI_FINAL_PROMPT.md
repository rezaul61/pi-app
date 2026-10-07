# PI — Verified Social Intelligence Network
## Complete System Prompt & Technical Specification

---

## IDENTITY

PI is a verified social intelligence network for students, teachers, researchers, professionals, entrepreneurs, developers, creators, and institutions. It is NOT a clone of Facebook, LinkedIn, Instagram, X, or Discord. It has its own original visual language, interaction patterns, and identity system.

**Core promise:** Identity you can trust. Knowledge that compounds. A network built for people who think.

---

## TECH STACK

- **Framework:** Next.js 16+ (App Router, RSC-first)
- **Database:** PostgreSQL via Drizzle ORM
- **Styling:** Tailwind CSS v4 with CSS custom property design tokens
- **Icons:** Lucide React
- **Validation:** Zod
- **Auth:** Custom scrypt-hashed passwords, httpOnly session cookies, route handler auth (NOT server actions for auth — server actions break behind reverse proxies)
- **File Storage:** Local `/uploads` (swappable for S3/Cloudflare R2)

---

## DATABASE SCHEMA

### Core Tables
- `users` — id, name, username, email, pass_hash, headline, bio, location, institution, website, accent, avatar_url, cover_url, primary_role, roles (text[]), interests (text[]), goals (text[]), is_verified, is_admin, verified_at, onboarded, theme, fx, opp_alerts, created_at
- `sessions` — token (PK), user_id, user_agent, created_at, expires_at

### Network
- `connections` — id, requester_id, addressee_id, status (pending/accepted/declined), created_at
- `follows` — follower_id, following_id (composite PK)
- `blocks` — blocker_id, blocked_id (composite PK)

### Content
- `posts` — id, author_id, community_id, kind (post/article/research/achievement/publication/job/project/event/poll), title, content, media_url, visibility (public/network), tags (text[]), meta (jsonb), created_at
- `comments` — id, post_id, author_id, content, created_at
- `reactions` — post_id, user_id (composite PK), type (insightful/appreciate/curious)
- `poll_votes` — post_id, user_id (composite PK), option_index

### Communities
- `communities` — id, slug, name, tagline, description, category, accent, created_by, created_at
- `community_members` — community_id, user_id (composite PK), role (member/expert/moderator)
- `events` — id, community_id, title, description, starts_at, location, online, created_by

### Messaging
- `conversations` — id, created_at, last_message_at
- `participants` — conversation_id, user_id (composite PK), last_read_at
- `messages` — id, conversation_id, sender_id, content, created_at
- `important_messages` — id, conversation_id, message_id, marked_by, label, created_at

### Other
- `notifications` — id, user_id, actor_id, type, body, href, read_at, created_at
- `vault_items` — id, user_id, kind, title, note, url, post_id, tags (text[]), created_at
- `opportunities` — id, kind, title, org, description, location, remote, funding, deadline, eligibility (text[]), tags (text[]), apply_url, created_at
- `saved_opportunities` — user_id, opportunity_id (composite PK)
- `reports` — id, reporter_id, target_type, target_id, reason, detail, status, created_at

---

## AUTH SYSTEM

Auth uses **route handlers** (NOT server actions) because server actions break behind reverse proxies (e.g., Vercel, e2b, Railway) due to CSRF origin mismatch.

### Routes
- `POST /api/auth/login` — form post, validates with Zod, rate-limited (5/min), CSRF-checked, creates session, redirects to /home
- `POST /api/auth/register` — creates user with scrypt-hashed password, creates session, redirects to /onboarding
- `POST /api/auth/onboarding` — saves role, interests, goals, accent, redirects to /home
- `POST /api/auth/logout` — destroys session, clears cookie, redirects to /login

### Session
- httpOnly cookie named `pi_session`
- 7-day expiry with sliding renewal (extends when < 3.5 days remain)
- scrypt password hashing with per-user salt
- `getViewer()` — cached server-side viewer resolver

### Security
- CSRF origin verification on all auth routes
- Rate limiting (in-memory, swap for Redis in production)
- Zod input validation
- Security headers: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin

### Redirect Origin Resolution
All auth route redirects use a `requestOrigin()` helper that reads the browser's `Origin` header (NOT `req.url`) to ensure redirects work correctly behind reverse proxies.

---

## GUARD LAYER (Application-Level RLS)

Every database query flows through a guard layer — never raw table access from pages/actions:
- `blockClause()` — SQL fragment excluding blocked users from results
- `visibilityClause()` — enforces public vs network-only post visibility
- `isParticipant()` — DM access guard
- `connectionStatus()` — relationship state resolver
- `ownsPost()` — ownership check for mutations

---

## DESIGN SYSTEM

### PI Visual DNA
Five pillars: Mathematics (π, geometry, precision), Glass (depth, translucency), Network (nodes, connections), Intelligence (data hierarchy), Human (warmth, identity).

### Color Tokens (CSS Custom Properties)
```
--c-bg          Deep midnight background
--c-bg-2        Secondary surface
--c-s1–s4       Glass surface levels (increasing translucency)
--c-line        Subtle border
--c-line-2      Stronger border
--c-ink         Primary text (soft pearl)
--c-ink-2       Secondary text
--c-ink-3       Tertiary text
--c-acc         Electric violet (#8b5cf6)
--c-acc-2       Indigo (#6366f1)
--c-acc-3       Sophisticated cyan (#22d3ee)
--c-signal      Verification green (#3ddab4)
--c-warn        Warning amber (#f4b860)
--c-danger      Danger rose (#f4719a)
```

### Dark Mode (Flagship)
Deep midnight background, graphite surfaces, controlled glow, glass cards. NOT pure black.

### Light Mode (Pearl + Aurora)
Warm white, light grey, translucent surfaces, subtle violet/cyan reflections, soft shadows. NOT an inverted dark mode.

### Orbit Glow (Theme-Adaptive)
- Dark mode: white/violet gradient glow on orbit lines
- Light mode: green/teal gradient glow on orbit lines
- Controlled via CSS custom properties (--orb-ring-color, --orb-ring-glow, --orb-particle)

### Glass Levels
- Glass 01: Minimal transparency
- Glass 02: Standard card
- Glass 03: Elevated card with backdrop blur
- Glass 04: Hero/modal with full blur

### Motion Tokens
- Instant: 120ms
- Quick: 200ms
- Standard: 300ms
- Emphasis: 450ms
- Ambient: 8–20s (aurora gradients)
- Easing: cubic-bezier(0.22, 0.68, 0.26, 1) — the "PI ease"

### Effects Profiles
- Premium: Full glass, blur, ambient aurora
- Balanced: Reduced blur and motion
- Performance: Minimal effects
- Respects `prefers-reduced-motion`

---

## PI ORB — The Signature Logo

The PI Orb is a 3D atomic structure:
- A solid shaded gradient **sphere** in the center (radial gradient with highlight at 35% 25%)
- Three **elliptical orbits** tilted at different 3D angles (rotateX/rotateY with preserve-3d)
- Small **cyan pill-shaped particles** traveling along each orbit with glow shadows
- Orbits have visible **border + box-shadow glow** that adapts to dark/light mode

### Orbit States (speed varies per state)
- `idle` — slow elegant rotation (12s, 15s, 10s)
- `loading` — faster rotation (4s, 5s, 3.5s)
- `searching` — fast, discovery-like (3s, 4s, 2.5s)
- `analyzing` — medium, thoughtful (5s, 6s, 4s)
- `verifying` — signal-green toned (6s, 7s, 5s)
- `synchronizing` — uniform speed all orbits (4s, 4s, 4s)
- `done` — slow settling (15s, 18s, 14s)
- `calm` — near-still (20s, 24s, 18s)

### Used everywhere:
- Login hero (size 320)
- Sidebar logo (size 40)
- Mobile topbar logo (size 32)
- Loading screens
- Empty states
- Error pages
- Network visualization
- Command palette (when searching)
- Message send button (when sending)

---

## BADGE SYSTEM

### Role Badge
- Organic glass blob shape (pi-blob CSS class with custom border-radius)
- Animated gradient background (slowly shifting, 240% background-size)
- Shows ONLY the **primary role** as a single letter: S, T, R, P, E, D, C, I
- Never shows multiple letters (e.g., no "S·R")
- Each role has its own gradient tint
- **Hover tooltip** reveals full role name + "Verified" label

### Where badges appear
- Next to user names in feeds, network cards, messages, comments
- On profile pages (larger size)
- NOT on avatar edges — the badge sits inline with the name text

### Avatar Shape
- Border-radius: 42% (more rounded than squarish, but not a full circle)
- Gradient background with initials when no photo
- Glass highlight overlay for 3D depth

---

## APP SHELL

### Desktop: Slim Icon Rail (74px fixed left)
- PI Orb logo at top
- Navigation: Home, PI Insight, Network, Communities, Opportunities, Calendar, PI Vault
- Create button (gradient, rotates 45° when open)
- Settings + User avatar at bottom

### Desktop: Top Bar
- PI Orb (mobile only)
- Search bar (opens ⌘K Command Palette)
- Messages icon + badge
- Notifications icon + badge
- User avatar + dropdown menu

### Mobile: Bottom Nav (5 tabs)
- Home, Network, Create (+), Messages, More
- "More" opens a drawer with: Communities, Opportunities, Vault, Calendar, Insights, Notifications, Profile, Settings

### Logout
- Uses `<form action="/api/auth/logout" method="post">` — no JavaScript required

---

## PAGES & FEATURES

### Home Feed
- Personalized greeting (strips honorifics: "Dr." → first name)
- Quick composer bar (opens modal on click)
- Feed of posts from public + network-visible authors
- Right sidebar: Top opportunity matches + suggested communities
- Goals chips linking to relevant sections

### Post System
- Types: Post, Achievement, Publication, New Job, Article, Research Update, Project, Event, Poll
- Celebratory types (Achievement, Publication, New Job) trigger a **Celebration Effect** — fullscreen overlay with Trophy, Sparkles, floating particles, PI Orb in "verifying" state
- Celebratory posts have a gradient top-border accent in the feed
- Media upload: up to 4 images/videos per post (up to 20MB per file)
- Poll system with vote tracking and percentage bars
- Event posts show date/location/online metadata
- Reactions: Insightful, Appreciate, Curious
- Comments with inline compose
- Save to PI Vault
- Report / Block / Delete (owner)

### Media Gallery
- Single image: full-width contained display
- Multiple images: **swipe-to-stack** system
  - Active image fills the main area with a blurred background layer behind it
  - Swiping LEFT sends the current image to a **stacked deck at the bottom-left corner** (rotated, scaled down, with glass border and shadow)
  - Swiping RIGHT sends it to a **stacked deck at the top-right corner**
  - Clicking any stacked thumbnail brings it back to center
  - Smooth 500ms cubic-bezier transitions
  - Resistance at edges (first/last image)
  - Counter badge (1/3) and animated dot indicators

### Composer Modal
- Rendered via React **portal** to `document.body` (prevents CSS transform/perspective from breaking fixed positioning)
- z-index: 9999
- Kind switcher tabs at top
- Title field (for articles, events, projects)
- Content textarea
- Poll option builder (2-5 options)
- Event date/time/location/online toggle
- Media upload button with thumbnail preview strip
- Topics (tags) input
- Visibility toggle (Everyone / My Network)
- Publish button

### Profile Page
- Cover gradient (accent-based)
- Avatar with role badge
- Name, role labels, headline, bio
- Location, institution, website, join date
- Connection/follow/message actions
- Stats: Posts, Connections, Followers
- Interest chips
- Activity feed (user's posts)

### Network Page
- **Network Pulse Visualization**: concentric circle graph
  - User avatar at center
  - Connections distributed on orbit rings
  - SVG connection lines from center to each node
  - Filter toggles: All, Profession, University, Country, Division
  - Filtered view clusters connections into labeled groups with bounding circles
  - Premium gradient background behind visualization
- Connection requests section
- People you may know (horizontal card rows: avatar + name + badge + profession + connect button)
- Your connections list

### Communities
- Community listing with health pulse indicators
- Community detail page with tabs: Discussions, Knowledge, Members, Events, About
- Community header: icon + name + tagline below cover banner (no overlapping)
- Quick composer scoped to community
- Join/Leave toggle

### PI Messages (Messaging Workspace)
- Title: "PI Messages"
- Two-pane layout: conversation list (left) + active thread (right)
- Conversation list:
  - Search bar inline with All/Unread filter tabs (single compact row)
  - Each card: Avatar + Name + Badge + Profession only (no message preview, no interest chips)
  - No "warm/active/quiet" cadence chips visible
- Thread pane:
  - Header: Avatar + Name + Badge + Profession only (no cadence chip)
  - Tabs inline with search: Thread + Marked (count)
  - Search bar compact (max-w-140px, expands on focus)
  - Message bubbles: outgoing = gradient blue, incoming = glass
  - Unread divider: "New since your last visit"
  - **Important Message System**: hover any message → click ★ → add label → message gets gold tag
  - **@i mention**: typing `@i` in composer shows popup of all marked messages for quick re-quoting
  - Important tab: lists all marked messages with jump-to-thread and unmark actions
  - Sidebar (xl+): PI Thread Brief with summary, action cues, shared context, stats, marked messages list
  - No suggested reply buttons (removed to save space)

### Notifications
- Types: connection_request, connection_accepted, comment, message, verify, system, opportunity_alert
- Grouped by Today / Earlier
- Mark-all-read on page visit
- Opportunity alerts show Compass icon

### PI Vault
- Personal knowledge archive
- Items: notes, links, saved posts
- Tag filtering
- Kind filtering (Everything, Notes, Links, Saved Posts)
- Add new item modal
- Glass archive card design

### Opportunities
- Ranked by PI Match percentage (deterministic algorithm based on interests, role, and tags)
- Filter by kind: All, Jobs, Internships, Scholarships, Grants, Conferences
- Each card: match ring indicator, title, org, description, location, funding, deadline, eligibility
- "Why this matches you" expandable section with honest derived reasons
- Save/unsave opportunities

### Automatic Opportunity Alerts
- When opp_alerts is enabled (Settings > Privacy toggle), PI notifies users:
  - When a new high-match opportunity is posted
  - 72 hours before deadline
  - 12 hours before deadline
- Users can toggle this off in Settings > Privacy

### PI Calendar
- Unified timeline of events and opportunity deadlines
- Grouped by month
- Shows: kind chip, urgency tag, title, subtitle, date/time, location

### PI Insight Dashboard
- Network pulse stats (connections, warm threads, vault items, recent asks)
- Knowledge velocity (90-day post mix bar chart)
- Theme clusters from community membership
- Opportunity alignment (top matches with reasons)
- Recommended moves (actionable suggestions based on graph analysis)
- Joined communities list

### Settings
- Profile: name, username, headline, bio, institution, location, website, accent picker, avatar/cover upload
- Appearance:
  - Environment switcher (Midnight/Pearl) — compact two-tab design with labels ON the color blocks
  - Effects profile (Premium/Balanced/Performance)
- Security: change password, active sessions list, revoke other sessions
- Privacy: opportunity alerts toggle, blocked accounts list, data privacy explanation

### Command Palette (⌘K)
- Categorized instant search across: People, Communities, Research, Projects, Opportunities, Institutions
- Keyboard navigation (arrow keys + enter)
- ESC to close
- PI Orb in "searching" state while loading

### Onboarding
- 4-step wizard: Role → Interests (min 2) → Goals (min 1) → Accent color
- Progress bar
- Uses route handler POST (not server action)
- Preview of identity at step 4

### Auth Pages (Login / Register)
- Two-column layout: Brand panel (left, desktop) + Form (right)
- Brand panel: centered PI Orb (size 320) as hero, tagline, feature bullets
- Light/dark mode toggle button (top-right sun/moon icon)
- Demo login: standalone `<form>` with hidden fields (no JavaScript required)
- Error messages via URL query params + error banner

---

## CELEBRATION EFFECT

When a user publishes an Achievement, Publication, or New Job post:
- Fullscreen overlay portal (z-10000)
- Dark backdrop with blur
- Radiant aura (radial gradient of accent colors)
- 20 floating white particles rising with rotation
- Glass card with PI Orb (verifying state) + Trophy icon
- "Congratulations!" title with Sparkles
- Auto-dismisses after 4.5 seconds

---

## PRODUCTION SECURITY

- Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- CSRF origin verification on all POST routes
- Rate limiting on auth routes (5 attempts/minute)
- Zod schema validation on login/register inputs
- scrypt password hashing (64-byte derived key with per-user 16-byte salt)
- httpOnly, SameSite=lax, Secure cookies
- Session sliding renewal
- Guard layer on all database queries (block exclusion, visibility enforcement, participant checks)

---

## FILE STRUCTURE

```
src/
  app/
    layout.tsx                    Root layout (theme, font)
    page.tsx                      Entry redirect
    not-found.tsx                 404 page with PI Orb
    error.tsx                     Error boundary with PI Orb
    globals.css                   Design tokens + animations
    (auth)/
      layout.tsx                  Auth guard + theme toggle
      login/page.tsx
      register/page.tsx
    (app)/
      layout.tsx                  Session guard + AppShell
      loading.tsx                 Loading state with PI Orb
      home/page.tsx
      network/page.tsx            Server component (data fetching)
      network/page.client.tsx     Client component (visualization + filters)
      communities/page.tsx
      communities/[slug]/page.tsx
      messages/page.tsx
      messages/[id]/page.tsx
      notifications/page.tsx
      vault/page.tsx
      opportunities/page.tsx
      calendar/page.tsx
      insights/page.tsx
      u/[username]/page.tsx
      post/[id]/page.tsx
      settings/page.tsx
      onboarding/page.tsx
    api/
      health/route.ts
      search/route.ts
      upload/route.ts
      auth/login/route.ts
      auth/register/route.ts
      auth/onboarding/route.ts
      auth/logout/route.ts
  components/
    pi/
      orb.tsx                     3D atomic PI Orb (all states)
      badge.tsx                   Role badge with hover tooltip
      avatar.tsx                  Identity tile (42% radius)
      primitives.tsx              Button, Card, Chip, Field, Input, etc.
      toast.tsx                   Toast notification system
      modal.tsx                   Portal-based modal
      command.tsx                 ⌘K command palette
      celebration.tsx             Achievement celebration effect
      mark-read.tsx               Auto mark-read on notification page
    auth/
      forms.tsx                   Login/Register forms + BrandPanel
      onboarding.tsx              4-step onboarding wizard
      theme-toggle.tsx            Auth page light/dark toggle
    shell/
      app-shell.tsx               Desktop rail + topbar + mobile nav + create menu
    post/
      post-card.tsx               Feed post with reactions/comments/media
      composer.tsx                Create post modal with media upload
      quick-composer.tsx          Inline composer trigger
      comments.tsx                Comment form
      media-gallery.tsx           Swipe-to-stack media viewer
    messages/
      conversation-list.tsx       Inbox sidebar
      thread.tsx                  Thread pane with @i system
    people/
      person-actions.tsx          Connect/Accept/Follow/Message/Join buttons
      profile-menu.tsx            Report/Block menu
    settings/
      panels.tsx                  Profile/Appearance/Security/Privacy panels
    vault/
      vault-manager.tsx           Vault CRUD interface
    opportunities/
      opportunity-card.tsx        Match card with "why" section
  server/
    session.ts                    Auth primitives (hash, verify, session CRUD, getViewer)
    guards.ts                     Application-level RLS
    csrf.ts                       CSRF origin verification
    rate-limit.ts                 In-memory rate limiter
    request-origin.ts             Proxy-safe redirect URL builder
    actions/
      auth.ts                     Legacy server actions (kept for onboarding compatibility)
      posts.ts                    Post/comment/reaction/poll actions
      people.ts                   Connection/follow/block actions
      messages.ts                 Send message + important message actions
      settings.ts                 Profile/prefs/password actions
      engagement.ts               Vault/opportunity/community actions
    services/
      feed.ts                     Feed queries with guard enforcement
      people.ts                   Profile/connections/suggestions/blocks
      communities.ts              Community CRUD + events
      messages.ts                 Thread queries + thread intelligence
      misc.ts                     Vault, notifications, opportunities, search, network stats
      dashboard.ts                Calendar agenda + PI Insight data
  db/
    schema.ts                     Drizzle ORM table definitions
    index.ts                      Database connection pool
  lib/
    constants.ts                  Roles, interests, goals, reactions, post kinds, accents
    utils.ts                      cn, initials, timeAgo, roleLabel, accentGradient, etc.
    auth-errors.ts                Error code → human message mapping
    validations.ts                Zod schemas for input validation
```

---

## DEPLOYMENT

### Recommended Stack
- **Vercel** (hosting) — free tier
- **Supabase** (PostgreSQL) — free tier
- **Cloudflare R2** (file storage) — free 10GB
- **Custom domain** — ~$10/year

### Deploy Steps
1. Push code to GitHub
2. Create Supabase project → get DATABASE_URL
3. Run `npx drizzle-kit push` with Supabase URL
4. Import repo to Vercel → add DATABASE_URL env var → Deploy
5. Add custom domain in Vercel settings

### For Production
- Remove demo login form from login page
- Swap local file uploads for S3/R2
- Add email verification (Resend/SendGrid)
- Add error monitoring (Sentry)
- Set up automated database backups
- Swap in-memory rate limiter for Redis

---

## DESIGN PRINCIPLES

1. Elegant, not flashy
2. Animated, not distracting
3. Premium, not luxurious for the sake of luxury
4. Intelligent, not complicated
5. Social, but not addictive by design
6. Professional, but not boring
7. Futuristic, but still human

**If an effect looks impressive for five seconds but becomes annoying after five minutes, remove it.**
