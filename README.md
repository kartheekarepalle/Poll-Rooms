# 🗳️ Poll Rooms — Real-Time Polls

A production-ready real-time polling web application. Create a poll, share a link, and watch votes come in live — no sign-up required.

> **Live Demo:** [https://poll-rooms-vert.vercel.app](https://poll-rooms-vert.vercel.app)  
> **GitHub Repo:** [https://github.com/kartheekarepalle/Poll-Rooms](https://github.com/kartheekarepalle/Poll-Rooms)

---

## ✨ Features

- **Instant poll creation** — question + 2-10 options
- **Unique shareable links** — UUID-based; share with anyone
- **Real-time results** — HTTP polling every 2s pushes vote updates to all viewers
- **Anonymous voting** — no account required
- **Anti-abuse fairness** — IP + browser fingerprint + rate limiting
- **Responses viewer** — see who voted, which option they picked, with masked IPs
- **Beautiful UI** — animated gradients, glass morphism, floating particles
- **Animated charts** — Recharts horizontal bar chart with smooth transitions
- **Premium UX** — confetti success modal, winner trophy highlight, tab switcher
- **Edge case handling** — validation, error states, 404, network failures

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Client (Browser)                │
│  Next.js App Router  •  Tailwind CSS  •  ShadCN UI  │
│  Recharts  •  HTTP Polling (2s interval)              │
└──────────────────┬──────────────────────────────────┘
                   │  REST API
┌──────────────────▼──────────────────────────────────┐
│            Next.js API Routes (Server)              │
│  POST /api/polls            — Create poll           │
│  GET  /api/polls/[id]       — Fetch poll + options  │
│  POST /api/polls/[id]/vote  — Cast vote             │
│  GET  /api/polls/[id]/responses — Vote responses    │
└──────────────────┬──────────────────────────────────┘
                   │  Supabase Client (anon key)
┌──────────────────▼──────────────────────────────────┐
│              Supabase (PostgreSQL)                   │
│  polls · options · votes                            │
│  RLS policies · Unique constraints                  │
└─────────────────────────────────────────────────────┘
```

### Real-Time Strategy

The client uses an HTTP polling approach (`useRealtimePoll` hook) that fetches updated vote counts every 2 seconds. When a vote is cast, the API route increments `votes` on the relevant option row in Supabase. All connected clients see the updated counts within 2 seconds — simple, reliable, and works on all serverless platforms.

---

## 🛡️ Fairness Mechanisms

### 1. IP-Based Vote Restriction (Server-Side)
- Extracts voter IP from `x-forwarded-for` header
- Checks `votes` table for existing vote from same IP on same poll
- Database has a `UNIQUE INDEX ON votes(poll_id, voter_ip)` as a final guard against race conditions
- **Prevents:** same user voting multiple times from the same network
- **Limitation:** users behind the same NAT/VPN share an IP

### 2. Browser Fingerprint Restriction (Client + Server)
- Generates a fingerprint from `navigator.userAgent`, screen resolution, timezone, etc.
- Stored in `localStorage` to immediately disable the voting UI on revisit
- Server also checks `UNIQUE INDEX ON votes(poll_id, fingerprint)`
- **Prevents:** same browser from voting twice even with IP changes
- **Limitation:** incognito mode or different browsers bypass this

### 3. Rate Limiting (Server-Side)
- In-memory rate limiter: max 5 poll creations per minute per IP
- Max 5 vote attempts per 10 seconds per IP
- **Prevents:** automated spam and brute-force voting attempts
- **Limitation:** resets on server restart; use Redis for distributed rate limiting in production

---

## 📁 Project Structure

```
poll-rooms/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── polls/
│   │   │       ├── route.ts              # POST: create poll
│   │   │       └── [id]/
│   │   │           ├── route.ts          # GET: fetch poll
│   │   │           ├── vote/
│   │   │           │   └── route.ts      # POST: cast vote
│   │   │           └── responses/
│   │   │               └── route.ts      # GET: vote responses
│   │   ├── poll/
│   │   │   └── [id]/
│   │   │       └── page.tsx              # Poll voting/results page
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx                      # Home page (create poll)
│   ├── components/
│   │   ├── ui/                           # ShadCN-style primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   └── skeleton.tsx
│   │   ├── create-poll-form.tsx
│   │   ├── floating-particles.tsx         # Animated background particles
│   │   ├── poll-options.tsx
│   │   ├── poll-responses.tsx              # Responses viewer tab
│   │   ├── poll-results.tsx
│   │   ├── poll-skeleton.tsx
│   │   ├── poll-success-modal.tsx          # Confetti success modal
│   │   └── share-link.tsx
│   ├── hooks/
│   │   └── use-realtime-poll.ts          # HTTP polling hook (2s interval)
│   ├── lib/
│   │   ├── fingerprint.ts               # Browser fingerprint + localStorage
│   │   ├── store.ts                  # Supabase-backed data operations
│   │   ├── supabase.ts               # Supabase client (anon key)
│   │   └── utils.ts                      # cn() helper
│   └── types/
│       └── index.ts                      # TypeScript interfaces
├── supabase/
│   └── schema.sql                        # Database schema + RLS + indexes
├── .env.local.example
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 🗄️ Database Schema

### Tables

| Table     | Columns                                                             |
|-----------|---------------------------------------------------------------------|
| `polls`   | `id` (UUID PK), `question` (TEXT), `created_at` (TIMESTAMPTZ)      |
| `options` | `id` (UUID PK), `poll_id` (FK), `text` (TEXT), `votes` (INT)      |
| `votes`   | `id` (UUID PK), `poll_id` (FK), `option_id` (FK), `voter_ip`, `fingerprint`, `created_at` |

### Key Indexes
- `idx_options_poll_id` — fast option lookup by poll
- `idx_votes_poll_ip` — **UNIQUE** — one vote per IP per poll
- `idx_votes_poll_fingerprint` — **UNIQUE** — one vote per fingerprint per poll
- `idx_votes_poll_id` — fast vote lookup by poll

---

## 🚨 Edge Cases Handled

| Edge Case                | How It's Handled                                          |
|--------------------------|-----------------------------------------------------------|
| < 2 options              | Client + server validation rejects                       |
| Empty question           | Client + server validation rejects                       |
| Invalid poll UUID        | Regex validation returns 400                              |
| Poll not found           | Returns 404 with friendly message                        |
| Double voting (IP)       | Server check + DB unique constraint returns 409          |
| Double voting (browser)  | localStorage check disables UI + server fingerprint check |
| Concurrent votes         | Optimistic concurrency on `vote_count` update            |
| Long option text         | Max 200 chars enforced client + server                   |
| Duplicate options        | Set-based deduplication check                            |
| Rate limiting            | In-memory limiter per IP (5 polls/min, 5 votes/10s)     |
| Network failure          | Toast error messages, graceful fallback                  |

---

## 🚀 Deployment Guide

### 1. Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste the contents of `supabase/schema.sql`
3. Click **Run** to create tables, indexes, RLS policies, and Realtime config
4. Go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
```

### 3. Local Development

```bash
npm install
npm run dev
```

### 4. Vercel Deployment

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import repo
3. Add the 2 environment variables above in Vercel project settings
4. Deploy — Vercel auto-detects Next.js

### 5. Test Live App

1. Open deployed URL → create a poll
2. Copy share link → open in another browser/tab
3. Vote on one tab → watch results update live on the other
4. Try voting again → see "already voted" message

---

## 🛠️ Tech Stack

| Layer          | Technology                        |
|----------------|-----------------------------------|
| Framework      | Next.js 16 (App Router)           |
| Language       | TypeScript                        |
| Styling        | Tailwind CSS v4                   |
| UI Components  | ShadCN UI (manual)                |
| Charts         | Recharts                          |
| Database       | Supabase (PostgreSQL)             |
| Real-time      | HTTP Polling (2s)                 |
| Icons          | Lucide React                      |
| Toasts         | Sonner                            |
| Deployment     | Vercel                            |

---

## ⚠️ Known Limitations

1. **Rate limiting is in-memory** — resets on server restart, doesn't work across multiple serverless instances. Use Redis/Vercel KV for production.
2. **IP detection** depends on proxy headers — may be inaccurate behind certain CDNs without proper configuration.
3. **Browser fingerprint** is basic — determined users can bypass via incognito or different browsers.
4. **No poll expiration** — polls live forever. Add a `closes_at` column for time-limited polls.
5. **No admin panel** — poll creators can't delete or edit polls after creation.

---

## 🔮 Future Improvements

- [ ] CAPTCHA integration (hCaptcha/Turnstile) for additional bot protection
- [ ] Poll expiration / auto-close after deadline
- [ ] Optional authenticated voting via Supabase Auth
- [ ] Admin dashboard for poll creators
- [ ] Multiple choice voting (select N of M)
- [ ] Redis-based distributed rate limiting
- [ ] OpenGraph preview images per poll
- [ ] Export results as CSV/JSON
- [ ] Dark mode toggle
- [ ] WebSocket connection status indicator with auto-reconnect

---

## 📜 License

MIT
