# CLAUDE.md — BidTrust Build Handoff (v2)

> **Purpose:** This is the operating manual for Claude Code building BidTrust from scratch.
> Read this file completely before writing any code. The companion document
> `BidTrust_Master_Runbook_v6.md` is the feature catalog — this file tells you HOW to build,
> in WHAT ORDER, with WHAT conventions.
>
> **Precedence:** This file wins on build order, conventions, and technical architecture.
> The Runbook wins on feature behavior and business rules — EXCEPT where Appendix A of this
> file explicitly overrides it (the Runbook contains known errors; Appendix A is the errata).
> Never resolve a conflict silently: if you find one not listed in Appendix A, stop and flag it.

---

## 1. PROJECT CONTEXT (30-second version)

BidTrust is a home services marketplace: homeowners post jobs, verified contractors bid
(reverse auction), payments flow through escrow, disputes get mediated. Think Angi/Thumbtack
but with anonymized bidding, real escrow, and trust scoring.

**Build status: GREENFIELD.** We are starting the codebase over. A previous backend exists
on Railway (reference only — see §10). Do NOT assume any prior code carries forward unless
explicitly told to port it. The Runbook marks features "✅ BUILT" — read that as
"exists in the OLD reference codebase", never as "exists in this repo" (see §2).

**Two non-negotiable business rules that shape everything:**

1. **ANONYMIZATION** — Contractor real identities are hidden until a bid is accepted.
   Pre-award, all UI/API responses show "Licensed Contractor A", "Certified Plumber B".
   All messages are content-filtered for phone numbers, emails, URLs, social handles.
   This rule touches: API serializers, Socket.io payloads, notifications, emails,
   the message pipeline, frontend components, and search results. Full spec in §7.1.

2. **ESCROW** — No money moves peer-to-peer. Funds are captured into the platform's
   Stripe balance at project funding, held, and transferred to the contractor's Connect
   account per approved milestone, minus the platform fee. Disputes freeze everything.
   Full spec in §7.3 — note this DIFFERS from the Runbook's "manual capture" design,
   which does not survive Stripe's ~7-day authorization expiry (Appendix A, item 1).

If a feature request ever conflicts with these two rules, stop and flag it.

---

## 2. GROUND TRUTH — READING THE RUNBOOK CORRECTLY

The Runbook (v6, 2026-03-15) describes the OLD system as if it were this one. Translate:

| Runbook says | In this repo it means |
|---|---|
| ✅ BUILT | Exists in the old `bid4service` codebase. Reference for API shape and model fields only. Build fresh here. |
| 🔨 BUILD NOW | In launch scope IF it appears in a slice in §6 of this file. Otherwise it waits. |
| 📋 PHASE 2 / 🔮 PHASE 3+ | Do not build. See §11. |
| "187 endpoints live" / "36 models deployed" | Old system inventory. This repo starts at zero. |
| `NEXT_PUBLIC_API_URL=https://web-production-3651c...` | Old backend URL. Never point the new frontend at it. Local dev targets `http://localhost:5000`. |
| "OAuth 2.0 (7 providers) ✅" | Old system. New build: Google only at launch (§6, Slice 1). |

The launch scope is exactly Slices 0–12 in §6. A Runbook feature tagged 🔨 BUILD NOW that
is not in a slice (e.g., Feature 103 funnel analytics, Feature 115 referrals) is NOT in
launch scope — flag it if asked.

---

## 3. TECH STACK (locked — do not substitute)

### Monorepo layout
```
bidtrust/
├── apps/
│   ├── api/          # Express + TypeScript backend
│   └── web/          # Next.js 14 App Router frontend
├── packages/
│   ├── db/           # Prisma schema + client (shared)
│   ├── shared/       # Zod schemas, types, constants, anonymizer (shared FE/BE)
│   └── config/       # ESLint, TS configs
├── turbo.json        # Turborepo
└── CLAUDE.md         # this file
```

### Backend (`apps/api`)
| Concern | Choice | Notes |
|---|---|---|
| Runtime | Node 20 LTS + TypeScript strict | `"strict": true` from day 1 |
| Framework | Express 4 | Simple, known, Railway-friendly |
| ORM | Prisma | Schema in `packages/db` |
| DB | PostgreSQL 15 | Railway-hosted |
| Auth | JWT (access 15min + refresh 7d rotation) | httpOnly cookies; reuse detection — see §7.2 |
| OAuth | Passport: Google only at launch | Others are Phase 2, behind flags |
| Payments | Stripe Connect — capture at funding + separate transfers | See §7.3. NOT manual capture. |
| Validation | Zod at every route boundary | Schemas live in `packages/shared` |
| File upload | Multer → S3 (presigned URLs for reads) | 5MB images, 100MB video; MIME allowlist enforced server-side |
| Real-time | Socket.io | Private room per conversation; JWT-authenticated handshake |
| Jobs/cron | node-cron initially → BullMQ + Redis when needed | Don't add Redis until a feature needs it. Every cron must be idempotent (safe to run twice). |
| Email | Resend | Templates in `apps/api/src/emails/` |
| Logging | pino (structured JSON) | Request ID on every log line |
| Errors | Central error middleware; AppError class | Never leak stack traces in prod |

### Frontend (`apps/web`)
| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 14 App Router + TypeScript | Server Components by default; `"use client"` only when needed |
| Styling | Tailwind CSS + shadcn/ui | Install shadcn components as needed, don't scaffold all |
| Server state | TanStack Query v5 | One `queryClient`, keys in `lib/query-keys.ts` |
| Forms | React Hook Form + Zod resolvers | Reuse Zod schemas from `packages/shared` |
| HTTP | Axios instance in `lib/api.ts` | Interceptor: refresh on 401 (single-flight — queue concurrent 401s behind one refresh call), redirect on refresh-fail |
| Maps | Leaflet + react-leaflet | ArcGIS satellite tile layer; port the old repo's 3-mode map logic (§10) |
| Payments UI | Stripe Elements | Never touch raw card data |
| Real-time | socket.io-client, single connection in a provider | |

### Explicitly NOT in stack (do not add without asking)
- tRPC, GraphQL, Redux, MongoDB, Firebase, Clerk, Supabase, microservices,
  Docker-compose for local dev (plain `npm run dev` + Railway Postgres connection
  string is fine).

---

## 4. CODING CONVENTIONS

### General
- TypeScript strict everywhere. No `any` — use `unknown` and narrow.
- Every API route: Zod-validate input → service function → typed response. Controllers stay thin.
- Services contain business logic. Controllers never call Prisma directly.
- All money values: **integer cents** in DB and API (`amountCents Int`). No `Decimal`, no
  floats, anywhere money is stored or transmitted. Format to dollars only in UI.
  (The Runbook's §E models use `Decimal` — that is overridden; Appendix A item 2.)
- All timestamps UTC in DB; convert in UI.
- IDs: cuid() (Prisma default).
- Pagination: offset-based (`?page=1&limit=20`, max limit 100) everywhere except messages,
  which use cursor-based (`?before=<messageId>&limit=50`) — chat histories are long and
  concurrent inserts break offset pages.

### Naming
- Files: kebab-case (`bid-service.ts`). React components: PascalCase files (`BidCard.tsx`).
- API routes: plural nouns, REST verbs (`GET /api/v1/jobs/:id/bids`).
- Booleans: `is`/`has`/`can` prefix.

### Error handling pattern (backend)
```ts
// utils/app-error.ts
export class AppError extends Error {
  constructor(public statusCode: number, message: string, public code?: string) {
    super(message);
  }
}
// usage in service:
if (!job) throw new AppError(404, 'Job not found', 'JOB_NOT_FOUND');
```
Central middleware converts AppError → JSON `{ error: { code, message } }`. Unknown
errors → 500 + pino log, generic message to client.

### API response envelope
```ts
// success
{ "data": <payload>, "meta"?: { page, totalPages, total } }
// error
{ "error": { "code": "JOB_NOT_FOUND", "message": "Job not found" } }
```

### Concurrency (state machines are race conditions waiting to happen)
- Every status transition on Job, Bid, Milestone, Escrow, Dispute goes through a
  guarded update inside a transaction:
  ```ts
  const { count } = await tx.bid.updateMany({
    where: { id: bidId, status: 'PENDING' },   // expected current state
    data: { status: 'ACCEPTED' },
  });
  if (count === 0) throw new AppError(409, 'Bid is no longer pending', 'INVALID_STATE');
  ```
  Never read-then-write a status across two queries. This is what prevents two
  simultaneous bid-accepts, double milestone approval, and double capture.
- Side effects that follow a transition (Stripe calls, emails, sockets) run AFTER the
  transaction commits, never inside it.

### Testing (required, not optional)
- Vitest for unit tests (services, utils). Supertest for API integration tests.
- **Minimum bar:** every service function that touches money, escrow, disputes, or
  anonymization gets tests before the PR is done. Everything else: best effort.
- Every state machine gets a race test: fire the same transition twice, assert exactly
  one succeeds and one returns 409.
- Test DB: separate Postgres schema, reset between suites.

### Git discipline
- Conventional commits (`feat:`, `fix:`, `chore:`).
- One vertical slice per branch/PR. Never mix slices.

---

## 5. DATABASE SCHEMA — BUILD ORDER

Full field reference is in the Runbook §A.2 + §E (with Appendix A corrections). Build in
these waves so migrations stay clean:

**Wave 1 (Slice 1-2):** `User, Profile, Session, RefreshToken, Category, Subcategory, Address`
**Wave 2 (Slice 3-4):** `Job, JobPhoto, JobDocument, ServiceArea, ProviderProfile, Bid, BidItem`
**Wave 3 (Slice 5-6):** `Conversation, ConversationParticipant, Message, Project, Milestone, ProgressUpdate, ChangeOrder`
**Wave 4 (Slice 7):** `Payment, Transaction, Escrow, PaymentMethod, PayoutAccount, StripeEvent, AuditLog`
**Wave 5 (Slice 8-9):** `Review, ReviewResponse, ReviewPhoto, Dispute`
**Wave 6 (Slice 10+):** `Notification, NotificationPreference, Verification, Document, License, InsurancePolicy, UserTrustScore, SupportTicket, TicketResponse, FAQ, Referral, Subscription`

Note vs. the Runbook: `AuditLog` moves up to Wave 4 — Slice 7's rule "every money mutation
writes an AuditLog row" is unimplementable without it. `StripeEvent` (webhook idempotency
ledger, §7.3) is new.

Key enums (define in Wave 1 file, extend later):
```prisma
enum UserRole { CUSTOMER PROVIDER ADMIN }
enum JobStatus { DRAFT OPEN BIDDING AWARDED IN_PROGRESS COMPLETED CANCELLED DISPUTED }
enum BidStatus { PENDING SHORTLISTED ACCEPTED REJECTED WITHDRAWN COUNTERED }
enum EscrowStatus { PENDING FUNDED PARTIAL_RELEASED RELEASED DISPUTED REFUNDED }
enum MilestoneStatus { PENDING IN_PROGRESS SUBMITTED APPROVED PAID DISPUTED }
enum DisputeStatus { OPEN COOLING_PERIOD EVIDENCE_COLLECTION UNDER_REVIEW RESOLVED ESCALATED ARBITRATION }
enum VerificationTier { BRONZE SILVER GOLD PLATINUM ELITE }
```
(`FUNDED` replaces the old `HELD` — funds are captured, not authorization-held; §7.3.
`ARBITRATION` included from day 1 so the Dispute state machine never needs a migration
mid-dispute; Appendix A item 3.)

**Dispute model correction** (overrides Runbook §E; Appendix A item 3): anchor disputes to
`projectId` (required) + optional `milestoneId`, NOT `jobId @unique` — a project can have
sequential disputes and a job-unique constraint blocks the second one forever. Money fields
are `settlementAmountCents Int?`.

**Bid model:** include `anonymousLabel String` (e.g. `"A"`), assigned at bid creation,
immutable, never reused within a job even after withdrawal (§7.1).

**Indexes to add from the start** (these queries are hot):
- `Job`: `@@index([status, categoryId])`, `@@index([latitude, longitude])`
- `Bid`: `@@index([jobId, status])`, `@@index([providerId])`, `@@unique([jobId, anonymousLabel])`
- `Message`: `@@index([conversationId, createdAt])`
- `Transaction`: `@@index([userId, createdAt])`
- `StripeEvent`: `@@unique([eventId])`

---

## 6. BUILD ORDER — VERTICAL SLICES WITH ACCEPTANCE CRITERIA

Build one slice completely (schema → API → tests → UI) before starting the next.
Each slice lists its Definition of Done. Week labels are sequencing hints, not deadlines.

### Slice 0: Scaffold (Day 1-2)
- Turborepo monorepo, both apps boot, Prisma connects to Railway Postgres,
  ESLint + Prettier + strict TS, pino logging with request IDs, error middleware,
  health endpoint (`GET /api/v1/health` → `{ data: { status: 'ok' } }`),
  CI runs lint+typecheck+test on push.
- **DoD:** `npm run dev` starts both apps; health check returns 200; CI green.

### Slice 1: Auth (Week 1)
- Register (customer + provider roles), login, logout, refresh rotation with reuse
  detection (§7.2), forgot/reset password (Resend email), email verification,
  `GET /auth/me`. Google OAuth only.
- Frontend: all auth pages, `useAuth` hook, protected route wrapper, role-based redirect
  after login (customer → `/dashboard`, provider → `/provider/dashboard`).
- **DoD:** Full auth round-trip works in browser. Refresh token rotates; a replayed old
  refresh token kills the whole session family. Tests cover token expiry, invalid creds,
  duplicate email, refresh reuse.

### Slice 2: Categories + Profiles (Week 1-2)
- Category tree seeded (§8). Profile CRUD for both roles. ProviderProfile: business info,
  service categories, service area (radius from address — polygon drawing is Phase 2).
- **DoD:** Provider can complete profile; customer can view public profile;
  categories render in a picker.

### Slice 3: Job Posting (Week 2-3)
- 8-step wizard (Runbook §B.2 Phase 2 has the full step spec). Photos/docs to S3.
  Draft autosave (job saved as DRAFT after step 1, PATCH on each step).
- Geocoding on address entry (Nominatim free tier is fine to start — cache results;
  their usage policy is 1 req/sec).
- Store exact coordinates, but every non-owner read pre-award gets coordinates rounded
  to ~2 decimal places (≈1km) — exact location is part of the anonymization surface.
- **DoD:** Customer posts a job with photos end-to-end; job appears in My Jobs;
  draft survives page refresh; a non-owner API response never contains the exact address.

### Slice 4: Discovery + Bidding (Week 3-5)
- Job list/search/nearby endpoints with filters. Three map modes (Leaflet, ported per §10).
- Bid submission with line items + milestone proposal. Max 5 active bids per provider
  per category (enforce in service layer). Bid line items must sum to the bid total;
  proposed milestone percentages must sum to 100 — Zod-validate both.
- **ANONYMIZATION starts here:** every customer-facing bid passes through the anonymizer
  (§7.1). `anonymousLabel` assigned at bid creation. Write the serializer test FIRST.
- Accept/reject/withdraw/counter flows. Accept runs as a guarded transaction (§4):
  bid → ACCEPTED, all sibling bids → REJECTED, job → AWARDED, Project + Conversation
  created — atomically. Reveals real name to poster only.
- **DoD:** Provider finds job on map, bids; customer compares anonymized bids, accepts
  one; project is created; two concurrent accepts of different bids on the same job —
  exactly one wins; anonymization test suite passes.

### Slice 5: Messaging (Week 5-6)
- Conversations + messages, Socket.io real-time (JWT-authenticated handshake; server
  joins clients only to conversations they participate in), read receipts, attachments.
- **Content filter on message create** (§7.4): flagged → stored with `isFlagged: true`,
  NOT delivered, sender sees "under review", admin queue entry created.
- The same filter runs on the bid's "message to homeowner" field (Slice 4 retrofit).
- Pre-award: participant names anonymized in conversation payloads AND socket events
  AND notification text. Post-award: real names.
- **DoD:** Two browsers chat in real time; a message containing a phone number is blocked
  and appears in admin queue; filter tests cover 10+ evasion patterns (e.g., "five five
  five, one two three four", "call me at 555 dot 1234"); a client socket cannot join a
  conversation it doesn't belong to (test this).

### Slice 6: Projects + Milestones (Week 6-7)
- Project detail, milestone lifecycle (PENDING → IN_PROGRESS → SUBMITTED → APPROVED → PAID),
  progress updates with photos, change orders (submit/approve/reject → adjusts contract
  value AND re-validates the milestone-sum invariant, §7.5).
- 48-hour auto-approve cron: milestone SUBMITTED + no response in 48h → APPROVED, but ONLY
  if the homeowner was notified at submission (require a notification record) and no open
  dispute exists on the project. Every auto-approval writes an AuditLog row. Cron is
  idempotent — uses the same guarded transition as manual approval.
- Milestone sizing rule (Runbook Feature 55, in scope): project < $500 → single milestone;
  $500–$2,000 → two 50/50 milestones; > $2,000 → custom milestones from the accepted bid.
- **DoD:** Full milestone lifecycle clickable in UI; auto-approve tested with mocked
  clock, including the "dispute filed 1 hour before auto-approve" case (must not approve).

### Slice 7: Payments + Escrow (Week 7-9) ⚠️ HIGHEST-RISK SLICE
Architecture (this overrides the Runbook's manual-capture design — Appendix A item 1):
- Stripe Connect **Express** accounts for providers; onboarding via Account Links.
- Award checkout: PaymentIntent for the full project amount, **captured immediately**
  (automatic capture) into the PLATFORM's balance. No `transfer_data` — this is the
  "separate charges and transfers" pattern. Escrow → FUNDED.
  - Why not `capture_method: manual`: card authorizations expire after ~7 days;
    projects run for weeks. A hold is not escrow.
- Milestone approval → `stripe.transfers.create` to the provider's Connect account for
  the milestone amount minus platform fee. Milestone → PAID after transfer succeeds.
  Use an idempotency key of `transfer:<milestoneId>` on the Stripe call.
- Fee tiers on **project contract value** (constants in `packages/shared/fees.ts`):
  < $500 = 10%; $500–$5,000 = 7%; > $5,000 = 5%. Boundary rule: `<50000¢ → 10%`,
  `50000–500000¢ inclusive → 7%`, `>500000¢ → 5%`. Fee is computed once per milestone
  transfer, in cents, remainder handling tested.
- Webhooks: verify signature; insert `eventId` into `StripeEvent` with a unique
  constraint BEFORE processing (duplicate → 200 and skip); return 200 fast, process
  after; handle `payment_intent.succeeded`, `payment_intent.payment_failed`,
  `charge.dispute.created` (card chargeback → freeze escrow like a platform dispute),
  `account.updated` (track provider payout eligibility — block bid acceptance checkout
  if provider's Connect account can't receive transfers yet).
- Refund path for admin: full or partial refund of remaining (untransferred) escrow via
  `stripe.refunds.create`; clawing back an already-transferred milestone requires
  `transfer.reversals` — expose both in the admin resolution flow.
- **Every money mutation writes an AuditLog row and a Transaction row. No exceptions.**
- **DoD:** Full flow in Stripe test mode: fund → FUNDED → milestone approve → transfer →
  provider sees earnings. Webhook replay (same event twice) processes once. Fee math has
  exhaustive unit tests (boundary values: $499.99, $500, $5,000, $5,000.01). Double
  approval of the same milestone produces exactly one transfer.

### Slice 8: Reviews (Week 9-10)
- Double-blind: review stored but `published: false` until counterpart submits or 14-day
  cron publishes. Multi-dimensional ratings — weights (from Runbook §B.2 Phase 5):
  provider: Quality 30%, Timeliness 25%, Communication 20%, Professionalism 15%, Value 10%;
  homeowner: Communication 25%, Payment Reliability 25%, Realism 20%, Access 15%, Respect 15%.
- "Verified" badge if project escrow completed.
- **DoD:** Neither party sees the other's review early (test the API, not just the UI);
  weighted average computes correctly; cron publishes after deadline.

### Slice 9: Disputes (Week 10-11)
- File dispute from project (within 7 days of milestone submission or project completion)
  → Escrow → DISPUTED, freezing all unreleased funds AND pausing the 48h auto-approve.
  Evidence + counter-evidence upload. Status machine per DisputeStatus enum.
  Admin resolution: full refund / partial split / release — each executes the
  corresponding Stripe action (refund of remaining escrow and/or transfer) + AuditLog.
- **DoD:** Filing a dispute blocks milestone approval endpoints (409); the auto-approve
  cron skips disputed projects; admin resolves and money moves correctly in test mode;
  a resolved partial split satisfies `refund + transfers + fees = funded amount` to the cent.

### Slice 10: Notifications (Week 11)
- Notification model + preferences. In-app (Socket.io push + bell dropdown) and email
  (Resend). Events: BID_RECEIVED, BID_ACCEPTED, MILESTONE_SUBMITTED, PAYMENT_RELEASED,
  DISPUTE_OPENED, MESSAGE_FLAGGED, REVIEW_PUBLISHED.
- Notification text obeys anonymization: "Licensed Contractor A sent you a message",
  never the real name pre-award — in the bell, the email subject, and the email body.
- **DoD:** Bid on a job → poster's bell increments in real time + email arrives;
  no pre-award notification anywhere contains a real provider name.

### Slice 11: Admin (Week 12-13)
- Admin role gate. Dashboard stats. User management (suspend/verify), flagged-message
  queue, dispute resolution UI, transaction log, category CRUD.
- **DoD:** Admin resolves a flagged message and a dispute entirely from the UI.

### Slice 12: Polish + Launch (Week 13-14)
- Mobile responsive pass, WCAG 2.1 AA (keyboard nav, ARIA, contrast), SEO meta + sitemap
  for public job pages, Sentry both apps, rate limiting (express-rate-limit: 100 req/15min
  general, 10/15min on auth endpoints), security headers (helmet), CORS locked to the
  frontend origin, launch checklist from Runbook.
- **DoD:** Lighthouse ≥90 accessibility on key pages; pen-test basics pass (no auth
  bypass, no IDOR on jobs/bids/messages/projects/transactions — write IDOR tests
  explicitly per §7.2).

---

## 7. CROSS-CUTTING IMPLEMENTATION RULES

### 7.1 Anonymization (enforced in code, not convention)
- Single source of truth: `packages/shared/anonymize.ts` exports
  `anonymizeProvider(bid, viewerContext)` — every serializer that returns provider info
  to a non-admin MUST route through it. No other module may construct a provider display
  name.
- Viewer contexts and what they see:

  | Context | Sees |
  |---|---|
  | `OWN` (provider viewing self) | Everything of their own |
  | `POSTER_PRE_AWARD` | Label ("Licensed Contractor A"), rating, verification tier, bid content. No name, no photo, no portfolio link, no profile URL, no exact service address. |
  | `POSTER_POST_AWARD` | Real identity of the ACCEPTED provider only; losing bidders stay anonymized forever. |
  | `OTHER_BIDDER` | Nothing — not even anonymized entries of competing bids. |
  | `ADMIN` | Everything. |

- Label mechanics: `anonymousLabel` assigned at bid creation in bid order (A, B, C…),
  stored on the Bid, immutable, never reassigned or reused within a job (a withdrawn
  "B" leaves a gap). Labels must be stable across every surface: REST, sockets,
  notifications, emails.
- Leak surfaces beyond the serializer — each needs a test: Socket.io payloads,
  notification/email text (Slice 10), public profile URLs (a pre-award bid must not
  contain any ID that resolves to the provider's public profile), and S3 object keys /
  filenames on bid attachments (no business name in the key).
- CI guard: grep-based check that no route file references `businessName` /
  `providerProfile` fields outside the anonymizer and admin routes. Crude but effective.

### 7.2 Auth & authorization
- Refresh rotation with **reuse detection**: each refresh issues a new token and marks
  the old one used; presenting a used token revokes the entire token family (that's the
  stolen-token signal). Family = one login session.
- Cookies: `httpOnly`, `Secure` (prod), `SameSite=Lax`. API and web run on different
  origins in prod — CORS with `credentials: true` pinned to the exact frontend origin,
  never `*`.
- Middleware chain: `requireAuth` → `requireRole(...)` → resource-level ownership check
  in the service (`assertJobOwner(userId, jobId)` etc.). Every GET-by-id endpoint gets an
  IDOR test (user B requests user A's resource → 403/404).
- Suspended users: auth middleware rejects, refresh rejects, sockets disconnect.

### 7.3 Escrow invariants (assert these in tests)
1. `sum(milestone amountCents) === project contract value` — at project creation AND
   after every approved change order.
2. Transferred total never exceeds funded amount minus platform fees.
3. Fee deducted exactly once per milestone transfer.
4. DISPUTED escrow rejects all transfer/refund attempts except through admin resolution.
5. Every state change → AuditLog row.
6. Terminal accounting: `refunds + provider transfers + platform fees === funded amount`
   (to the cent) for every completed or resolved project.
7. All Stripe mutations carry deterministic idempotency keys (`transfer:<milestoneId>`,
   `refund:<disputeId>` …) so retries can't double-move money.

### 7.4 Content filter (messages + bid messages)
- Regex layer: phone patterns (`\d{3}[-.\s]?\d{3}[-.\s]?\d{4}` and variants, including
  spelled-out digits), emails, URLs, @handles. Normalize before matching (lowercase,
  strip punctuation/whitespace runs, map "dot"→"." and number-words→digits).
- Flagged: stored `isFlagged: true`, not delivered, sender sees "under review",
  admin queue entry. Admin can release or uphold.
- False-positive escape hatch: admin release delivers the original message.
- Scope: the filter is enforcement for anonymization, so it applies to all PRE-AWARD
  conversations and every bid's "message to homeowner" field. Post-award, the parties
  legitimately exchange contact details — do not filter awarded-project conversations.

### 7.5 Change orders
- Approved change order atomically: adjusts contract value, adds/adjusts milestones,
  re-asserts invariant 7.3(1). If the project is already funded, a value increase
  requires an additional PaymentIntent for the delta before the change order activates;
  a decrease queues a refund of the delta. No change orders while a dispute is open.

### 7.6 Trust score (for launch: computed, displayed nowhere yet)
- Runbook formula's units are undefined (Appendix A item 6). Normalize every factor to
  0–1 before weighting: `completion_rate` (0–1), `avg_rating / 5`,
  `verification_tier / 4` (BRONZE=0 … ELITE=4), then
  `score = 100 × (0.30·completion + 0.50·rating + 0.20·tier) − dispute_penalties`,
  clamped to [0, 100]. Constants in `packages/shared/trust.ts`. Display is Phase 2.

### 7.7 Feature flags
- Simple env-based flags (`FEATURE_REFERRALS=true`) read in `packages/shared/flags.ts`.
  Ship Phase-2 features dark behind flags rather than long-lived branches.

---

## 8. SEED DATA (required for dev)

`packages/db/seed.ts` must create:
- 12 categories with 3-6 subcategories each (Plumbing, Electrical, HVAC, Roofing,
  Painting, Flooring, Landscaping, Carpentry, Drywall, Concrete, Fencing, Handyman)
- 3 test users: `customer@test.com`, `provider@test.com`, `admin@test.com`
  (password `Test1234!`)
- 10 sample jobs across categories, geocoded around one metro (Austin, TX — matches
  existing test data), various statuses
- 5 bids on the first open job (to exercise anonymization labels A–E, including one
  WITHDRAWN bid so the label gap is visible)
- 1 in-progress project with 3 milestones in different states
- Stripe: document in README that the provider test account needs Connect onboarding
  via the test flow
- Seed is idempotent: `npm run db:seed` twice leaves the same state.

---

## 9. ENVIRONMENT SETUP

```env
# apps/api/.env
DATABASE_URL=postgresql://...          # Railway
JWT_SECRET=<64-char random>
JWT_REFRESH_SECRET=<64-char random>
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...        # from `stripe listen` locally
RESEND_API_KEY=re_...
S3_BUCKET=bidtrust-dev
S3_REGION=us-east-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Local dev: `stripe listen --forward-to localhost:5000/api/v1/payments/stripe-webhook`

Deploy targets: API → Railway, Web → Vercel. Migrations run via
`prisma migrate deploy` in the Railway build step — never `db push` in prod.
Stripe stays in test mode until the launch checklist passes.

---

## 10. THE OLD CODEBASE (reference policy)

A prior backend exists at `https://github.com/prk2001/bid4service.git` (Railway,
187 endpoints, 36 models). Policy:
- **Do not copy code from it.** Quality is unverified; we're rebuilding for a reason.
- **Do use it as a reference** for: API surface shape (Runbook §A.3), Prisma model
  fields, and the working Leaflet 3-mode map implementation (port the map logic —
  it's the one piece confirmed good).
- The old prod DB is not migrated. Fresh schema, fresh data.
- Never point any new-code config at the old Railway URL.

---

## 11. WHAT NOT TO BUILD YET

The Runbook lists 150 features. Slices 0–12 above are the launch set. Do NOT start any
of these without explicit instruction, even though they're documented: insurance
products, subscriptions/billing tiers, AI estimation, referrals, factoring, trust-score
display, IoT, emergency dispatch, i18n, permit engine, marketplaces, drone anything,
additional OAuth providers.

When asked to build a Phase 2+ feature: find it in Runbook §D for the spec, put it
behind a feature flag (§7.7), follow the same slice discipline (schema → API → tests →
UI), and apply this file's conventions — Runbook tech notes are suggestions, not specs.

---

## 12. WHEN STUCK OR AMBIGUOUS

1. Check this file → Appendix A → Runbook v6 → then ask.
2. Spec conflict resolution: Appendix A > this file (order/conventions/architecture) >
   Runbook (feature behavior/business rules). New conflicts get flagged, not guessed.
3. Never guess on: money math, anonymization scope, auth boundaries, or Stripe flows. Ask.

---

## APPENDIX A — RUNBOOK v6 ERRATA (binding corrections)

The Runbook is the feature catalog, but it contains errors. These corrections are binding;
do not implement the original Runbook text for any item below.

1. **Escrow ≠ manual capture** (Runbook §C.1, §B.2 Phase 5; old CLAUDE.md §1/Slice 7).
   `capture_method: manual` authorizations expire after ~7 days; projects run for weeks
   or months, so the "hold until milestone approval" design silently loses its hold.
   Corrected design (§6 Slice 7): capture the full amount into the platform balance at
   award ("separate charges and transfers"), then `transfers.create` per approved
   milestone. Also, the Runbook's "destination charges" cannot split one charge across
   multiple milestone-timed transfers — separate charges and transfers is the only
   pattern that supports per-milestone release. `EscrowStatus.HELD` renamed `FUNDED`.

2. **Money columns** (Runbook §E). `Decimal` fields (`settlementAmount`, `coverageAmount`,
   `feesPaid`, `rewardAmount`) violate the integer-cents rule. All money is
   `...Cents Int`.

3. **Dispute model** (Runbook §E). `jobId String @unique` limits a job to one dispute
   ever and anchors to the wrong entity. Corrected: required `projectId`, optional
   `milestoneId`, no unique constraint on either; multiple sequential disputes allowed,
   at most one OPEN dispute per project (partial unique index or service guard).
   `DisputeStatus` includes `ARBITRATION` from day 1 (the old CLAUDE.md enum omitted it,
   the Runbook's included it — the superset wins so no mid-dispute migration).

4. **"48-hour auto-release" ambiguity** (Runbook §C.1). It's milestone auto-APPROVAL
   48h after submission (which then triggers the normal transfer), not a raw payment
   release. Guards: notification must have been sent; no open dispute; idempotent cron.

5. **Fee boundaries** (Runbook §C.4 "Under $500 / $500–$5,000 / Over $5,000"). Boundary
   values were ambiguous. Binding rule in cents: `<50000 → 10%`, `50000–500000 → 7%`,
   `>500000 → 5%`. The "Premium subscribers –2%" modifier is Phase 2 (subscriptions
   aren't in launch scope) — build the fee function to accept a discount parameter,
   wire it to zero.

6. **Trust score units** (Runbook §C.1). `avg_rating × 0.50` mixes a 0–5 scale into a
   0–100 score. Normalized formula in §7.6. Display remains Phase 2.

7. **OAuth providers** (Runbook §A.1 "7 providers ✅"). Launch = Google only. The other
   six are Phase 2, behind flags.

8. **Frontend API URL** (Runbook §B.1). Points at the old Railway backend. The new web
   app only ever talks to the new API.

9. **Runbook tier vocabulary** (Runbook "HOW TO USE"). "✅ BUILT" = old codebase
   inventory, not this repo. Launch scope = Slices 0–12 here, and Runbook 🔨 items not
   in a slice (e.g., Features 103, 115, 65, 78, 82) are NOT launch scope.

10. **AuditLog timing** (Runbook §E places it with Phase-2 models). Required by Slice 6
    (auto-approve logging) and Slice 7 (money mutations) — created in Wave 4.
