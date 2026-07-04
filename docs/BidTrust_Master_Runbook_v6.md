# BidTrust Master Runbook v6.0

## The Definitive Implementation Guide: Next-Generation Home Improvement Ecosystem

**Document Version:** 6.0 — Complete Platform Blueprint  
**Last Updated:** March 15, 2026  
**Status:** Backend 95% Built on Railway | Frontend Rebuild Required | 150+ Feature Expansion  
**Classification:** Claude Code Single Source of Truth  

---

## HOW TO USE THIS DOCUMENT

This is the **only document you need**. It contains everything required to build, launch, and scale BidTrust.

**Tier System — Check before coding anything:**
- **✅ BUILT** — Code exists and is deployed. Don't rebuild unless fixing bugs.
- **🔨 BUILD NOW** — Immediate sprint priority (Weeks 1-14). Frontend rebuild + critical backend gaps.
- **📋 PHASE 2** — Months 5-8 after launch. Trust, compliance, intelligence.
- **🔮 PHASE 3+** — Months 9-24. Ecosystem expansion, emerging tech, international.

**Revenue tags** appear throughout: **💰 REVENUE** marks features that generate platform income. **🧲 RETENTION** marks features that keep users coming back. **📈 GROWTH** marks features that drive new user acquisition.

---

# ═══════════════════════════════════════════════════════════════
# SECTION A: GROUND TRUTH — WHAT EXISTS TODAY
# ═══════════════════════════════════════════════════════════════

## A.1 Current Production Stack

| Component | Technology | Status |
|-----------|-----------|--------|
| Backend | Node.js + Express + TypeScript | ✅ 95% complete, Railway (port 5000) |
| Database | PostgreSQL + Prisma ORM | ✅ 30+ models, Railway |
| Auth | JWT + OAuth 2.0 (7 providers) | ✅ Google, Facebook, LinkedIn, Apple, Twitter, GitHub, Microsoft |
| Payments | Stripe Connect + Escrow | ✅ Milestone holds, destination charges |
| Admin | AdminJS | ✅ Auto-generated from Prisma |
| Maps | Leaflet + ArcGIS Satellite | ✅ 3 search modes working |
| Frontend | Next.js 14 (App Router) | ⚠️ Needs near-complete rebuild |
| File Storage | S3-compatible cloud storage | ✅ Photos, documents, credentials |
| Version Control | GitHub + hourly auto-backup | ✅ `~/auto-git-backup.sh` via cron |

**Key URLs:**
- Backend: `https://web-production-3651c.up.railway.app`
- GitHub: `https://github.com/prk2001/bid4service.git`
- Frontend env: `NEXT_PUBLIC_API_URL` points to Railway backend

## A.2 Implemented Database Models (36 Prisma Models ✅)

These are **built and deployed**. Extend when needed — don't recreate.

```
CORE:           User, Profile, ProviderProfile, Address, ServiceArea
JOBS:           Job, JobPhoto, JobDocument
BIDDING:        Bid, BidItem
PROJECTS:       Project, Milestone, ProgressUpdate, ChangeOrder
COMMUNICATION:  Message, Conversation, ConversationParticipant
REVIEWS:        Review, ReviewResponse, ReviewPhoto
FINANCIAL:      Payment, Transaction, Escrow, PaymentMethod, PayoutAccount
SYSTEM:         Notification, NotificationPreference
SUPPORT:        SupportTicket, TicketResponse, FAQ
TAXONOMY:       Category, Subcategory
TRUST:          Verification, Document
AUTH:           Session, RefreshToken
```

## A.3 Implemented API Endpoints (187 Total ✅)

All live at `https://web-production-3651c.up.railway.app/api/v1/`

```
AUTH (18):       register, login, logout, refresh-token, forgot-password, reset-password,
                 verify-email, resend-verification, me, update-password, enable-2fa, verify-2fa,
                 disable-2fa, delete-account, sessions, sessions/:id, OAuth×7 providers

USERS (20):      profile (GET/PUT), profile/photo, users/:id/public-profile,
                 providers (list/get/update), providers/:id/stats, /jobs, /bids, /earnings,
                 service areas, availability, verification endpoints

JOBS (22):       CRUD, my-jobs, search, nearby, explore, category/:cat,
                 photos (add/remove), documents (add/remove), close, reopen,
                 bids on job, save/unsave, saved list, report, similar

BIDS (16):       CRUD, accept, reject, withdraw, counter, my-bids,
                 by-job, by-provider, history, message, stats, shortlist

MESSAGES (14):   conversations CRUD, messages in conversation,
                 send, read receipts, unread-count, attachments, search

PAYMENTS (18):   methods CRUD, checkout (escrow hold), milestone release,
                 transactions, escrow status, refund, earnings,
                 payout-accounts, stripe-webhook, invoices, receipts

REVIEWS (14):    CRUD, response (add/update), photos, by-user,
                 by-provider, stats, report, helpful (get/vote)

PROJECTS (16):   CRUD, milestones (add/update), progress updates,
                 change-orders (submit/list/approve), complete, timeline

NOTIFICATIONS (8): list, mark-read, read-all, unread-count,
                    preferences (get/update), push-subscribe/unsubscribe

SUPPORT (12):    tickets CRUD, respond, close, reopen,
                 FAQs (list/get/by-category/search), contact form

ADMIN (25):      dashboard, stats, users CRUD + suspend/unsuspend/verify,
                 jobs moderate/remove, reviews moderate/remove,
                 disputes list/resolve, transactions, categories CRUD,
                 tickets assign, reports

CATEGORIES (6):  list, get, subcategories, popular, tree, search
```

---

# ═══════════════════════════════════════════════════════════════
# SECTION B: BUILD NOW — FRONTEND REBUILD + CRITICAL BACKEND
# ═══════════════════════════════════════════════════════════════

## B.1 Frontend Tech Stack

```
Framework:        Next.js 14 (App Router) + TypeScript
Styling:          Tailwind CSS + shadcn/ui (Radix primitives)
State:            React Query (TanStack Query) for server state
Forms:            React Hook Form + Zod validation
API Client:       Axios (configured with interceptors for auth)
Maps:             Leaflet (preserve existing implementation)
Real-time:        Socket.io client
Payments:         Stripe.js + Stripe Elements
Animations:       Framer Motion (optional, progressive enhancement)
```

**Frontend .env.local:**
```env
NEXT_PUBLIC_API_URL=https://web-production-3651c.up.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_GOOGLE_MAPS_KEY=... (optional, Leaflet works without)
```

## B.2 Frontend Build Plan (14 Weeks)

### Phase 1: Foundation (Weeks 1-2)

**Auth Pages:**

| Page | Route | Key Components | API |
|------|-------|---------------|-----|
| Login | `/login` | LoginForm, SocialLoginButtons, RememberMe | POST /auth/login |
| Register Customer | `/register` | RegisterForm, RoleSelect, TermsCheckbox | POST /auth/register |
| Register Provider | `/register/provider` | BusinessForm, ServicePicker, AreaPicker | POST /auth/register |
| Forgot Password | `/forgot-password` | EmailInput, SuccessMessage | POST /auth/forgot-password |
| Reset Password | `/reset-password` | NewPasswordForm, StrengthMeter | POST /auth/reset-password |
| Email Verification | `/verify-email` | StatusDisplay, ResendButton | POST /auth/verify-email |

**Layout Components:**
- `MainLayout` — Header (Logo, NavLinks, UserMenu, NotificationBell) + Footer
- `DashboardLayout` — Sidebar (role-aware: Customer/Provider/Admin) + content area
- `MobileNav` — Top hamburger + bottom tab bar (Home, Search, Post Job, Messages, Profile)
- `Breadcrumb` — Auto-generated from route segments

**UI Component Library** (`/components/ui/`):

Build all of these. They're used everywhere:
```
Button (Primary/Secondary/Outline/Ghost/Destructive × sm/md/lg)
Input (Text/Email/Password+toggle/Number/Search+icon)
Select (Single/Multi+search/Creatable)
Textarea (character count, auto-resize)
DatePicker (single, range)
FileUpload (drag-drop zone, file list, progress bars, 5MB max)
ImageUpload (preview, crop via react-easy-crop, multi-image)
Modal (sm/md/lg/xl/fullscreen, backdrop close)
Toast (Success/Error/Warning/Info, auto-dismiss 5s, stackable)
Badge (status colors: Open/InProgress/Completed/Disputed/etc.)
Avatar (photo + fallback initials, sm/md/lg)
Card (optional header/footer, hover effect)
Tabs (horizontal, lazy-loaded panels)
Pagination (page numbers + prev/next)
Spinner, Skeleton, EmptyState, ErrorBoundary
ConfirmDialog, Tooltip, Dropdown
StarRating (display + interactive, half-stars)
PriceInput ($ prefix, comma formatting)
AddressInput (autocomplete + geocoding)
MapComponent (Leaflet wrapper, markers, clusters, popups)
PhoneInput (country code selector)
```

### Phase 2: Customer Core (Weeks 3-4)

**Customer Dashboard** (`/dashboard`):
- Stats cards: Active Jobs, Pending Bids, Active Projects, Spent This Month
- Recent Jobs (last 5, link to full list)
- Recent Messages (last 3 conversations)
- Quick Actions: Post New Job, Browse Providers, View Messages
- API: GET /jobs/my-jobs, GET /messages/unread-count, GET /payments/transactions

**Job Posting Wizard** (`/jobs/new`) — 8 Steps:

Step 1 — Category: Grid of categories with icons → subcategory dropdown. API: GET /categories/tree

Step 2 — Location: AddressInput (autocomplete) + MapComponent (pin placement) + property type dropdown (House/Condo/Townhouse/Commercial). Geocoded coordinates stored with job.

Step 3 — Details: Title (10-100 chars), Description (rich text, 50-5000 chars), Trade-specific scope checklist (checkboxes generated from subcategory). AI suggestion sidebar: "Most kitchen remodels also include backsplash — add this?"

Step 4 — Media: Photo uploader (drag-drop, max 10, 5MB each), Video uploader (max 1, 100MB), Document uploader (PDFs, max 5). API: POST /jobs/:id/photos, POST /jobs/:id/documents

Step 5 — Schedule: DatePicker (preferred start), Urgency selector (Flexible/Within 2 Weeks/Urgent/Emergency), Schedule preferences (Weekdays only/Weekends OK/Anytime)

Step 6 — Budget: Range slider (min/max), Payment preference (Fixed Price/Hourly/Milestone-based). AI budget suggestion based on category + location + scope.

Step 7 — Requirements: Min verification tier (Any/Silver/Gold/Platinum), Required insurance (toggle), Required license type (dropdown), Min years experience (number).

Step 8 — Review & Submit: Full summary with Edit button per section, Terms checkbox, Submit. API: POST /jobs

**My Jobs** (`/dashboard/jobs`):
- Filter by status: All/Open/In Progress/Completed/Cancelled
- Sort by: Date Posted/Bids Received/Budget
- Job cards: Title, Category badge, Status badge, Bid count, Budget, Date

**Job Detail** (`/jobs/:id`):
- Header: Title, Category, Status, Date, Budget range
- Photo gallery with lightbox
- Description + scope details
- Location map (approximate pin only — no exact address until awarded)
- Bids section (customer view): Anonymized provider list, bid amounts, ratings, verification badges, comparison view, Accept/Reject buttons
- **ANONYMIZATION RULE (CRITICAL):** Real provider names NEVER shown to other bidders or poster until bid accepted. Display: "Licensed Contractor A", "Certified Plumber B", etc. Only the poster sees the real name of their accepted provider.

### Phase 3: Provider Core (Weeks 5-6)

**Provider Dashboard** (`/provider/dashboard`):
- Stats: Active Bids, Win Rate, Revenue This Month, Average Rating
- Recommended Jobs (AI-matched)
- Active Projects list
- Earnings chart (30-day trend)

**Browse Jobs** (`/provider/jobs`):
- Three search modes (preserve existing):
  1. Search My Area — GPS-based, jobs within service area
  2. Custom Search — Address + radius slider (5-100mi)
  3. Browse Map — Full-screen Leaflet, pan/zoom, job markers with popups
- Filter sidebar: Category, Budget range, Urgency, Distance, Date posted
- Sort: Newest/Highest Budget/Closest/Best Match

**Submit Bid** (`/jobs/:id/bid`):
- Line-item builder: rows with Name/Quantity/Unit Price/Total, categorized as Materials/Labor/Permits/Overhead/Profit
- Milestone timeline: Add milestones with Name/Duration/Payment %
- Warranty terms dropdown (1/2/3/5 years)
- Message to homeowner (content-filtered for contact info)
- Platform fee preview
- API: POST /bids

**Provider Profile** (`/provider/profile`):
- Business info, service categories, service area (map polygon/radius/ZIP list)
- Portfolio (before/after photos)
- Certifications (upload + expiry dates)
- Availability calendar
- Payout account (Stripe Connect onboarding)

### Phase 4: Communication & Projects (Weeks 7-8)

**Messaging** (`/messages`):
- Left panel: conversation list (sorted recent, unread badges)
- Right panel: chat bubbles, timestamps, read receipts
- Attachments (images, PDFs, 5MB max)
- Anonymized names pre-award, real names post-award
- Content filtering: server scans for phone/email/social. Flagged = blocked + "under review"
- Real-time via Socket.io

**Projects** (`/projects/:id`):
- Timeline view (Gantt or vertical)
- Milestone cards: Name, Status, Due date, Amount, Approve/Dispute buttons
- Progress Updates: photo + text entries
- Change Orders: submit/approve/reject/negotiate
- Completion: Contractor marks done → 48hr homeowner review → payment release or dispute

### Phase 5: Payments & Reviews (Weeks 9-10)

**Payment Flow:**
1. Award bid → Checkout shows escrow amount + fee
2. Add/select payment method (Stripe Elements)
3. PaymentIntent with `capture_method: manual`
4. Milestone approval → capture proportional amount → Transfer to provider minus fee
5. Dispute → freeze until resolution

**Fee Structure:**
| Job Value | Fee | Revenue Note |
|-----------|-----|-------------|
| Under $500 | 10% | 💰 High margin on volume |
| $500–$5,000 | 7% | 💰 Core revenue tier |
| Over $5,000 | 5% | 💰 Large project retention |
| Premium subscribers | –2% reduction | 🧲 Subscription incentive |

**Reviews:**
- Double-blind (published after both submit or 14-day deadline)
- Provider dimensions: Quality 30%, Timeliness 25%, Communication 20%, Professionalism 15%, Value 10%
- Homeowner dimensions: Communication 25%, Payment Reliability 25%, Realism 20%, Access 15%, Respect 15%
- "Verified" badge on escrow-completed reviews
- Anti-gaming: velocity analysis, text similarity, IP fingerprinting, double-blind

### Phase 6: Admin & Polish (Weeks 11-14)

**Admin Dashboard** (`/admin`): GMV, users, projects, disputes, charts, activity feed
**Admin Pages:** User management, job moderation, review moderation, dispute resolution, support tickets, transactions, categories, reports
**Polish:** Mobile responsive audit, accessibility (WCAG 2.1 AA), performance optimization, SEO, error tracking (Sentry)

---

# ═══════════════════════════════════════════════════════════════
# SECTION C: COMPLETE PLATFORM ARCHITECTURE
# ═══════════════════════════════════════════════════════════════

## C.1 Core Business Rules

**Anonymization (The #1 Rule):**
- Pre-award: All providers appear as role-based designations ("Licensed Contractor A")
- Post-award: Only the winning provider's real name visible to the poster
- Other bidders on the same job NEVER see each other's real names
- Automated content filtering blocks phone numbers, emails, URLs, social handles in all messages
- Violation: flagged message blocked, sender warned, repeated violations = account suspension

**Escrow (The #2 Rule):**
- All payments flow through platform escrow. No direct payments.
- Stripe Connect with manual capture (hold, don't charge until milestone approval)
- 48-hour auto-release if homeowner doesn't respond to milestone completion
- Dispute filing freezes ALL remaining milestone payments
- Platform fee deducted at capture time, not hold time

**Trust Scoring:**
```
Trust Score (0-100) = (completion_rate × 0.30) + (avg_rating × 0.50) + (verification_tier × 0.20) - dispute_penalties
```
- Updated after each project completion or review
- Affects: matching priority, bid limits, featured placement, fee discounts

## C.2 Matching Algorithm

```
Match Score = (Proximity × 0.15) + (Skill Match × 0.25) + (Availability × 0.20) +
              (Rating Alignment × 0.15) + (Price Alignment × 0.15) + (Past Performance × 0.10)
```

**Constraints:**
- Max 5 active bids per contractor per trade (anti-spam)
- Radius expands dynamically: 25mi → 50mi → 100mi if no matches
- 20% of recommendations reserved for "rising stars" (<10 reviews, high potential)
- Homeowner personality match factored in (hands-off vs. detail-oriented)

## C.3 Verification Tiers

| Tier | Requirements | Badge | Limits | 💰 Revenue |
|------|-------------|-------|--------|-----------|
| Bronze | Email + phone | 🥉 | Receive leads only | Free |
| Silver | License + background check | 🥈 | Bid up to $10K | $25 verification fee |
| Gold | Insurance + 5 completed jobs | 🥇 | Bid up to $50K, priority matching | $50 verification fee |
| Platinum | Bonded + 20 jobs + 4.8+ rating | 💎 | Unlimited, featured placement | Included in $99/mo sub |
| Elite | Enterprise + specialty certs | ⭐ | Exclusive high-value projects | Included in $299/mo sub |

## C.4 Revenue Architecture

### Transaction Fees (Target: 40% of revenue) 💰
- 5-10% of project value on every completed project
- Payment processing: 2.9% + $0.30 (passed through to customer)
- ACH discount: 0.8% (incentivize lower-cost payment rails)

### Contractor Subscriptions (Target: 25% of revenue) 💰
| Tier | Monthly | Features |
|------|---------|---------|
| Starter | Free | 3 bids/month, basic profile |
| Professional | $99 | Unlimited bids, priority matching, AI tools, reduced fees |
| Business | $299 | Team management, analytics, API access, dedicated support |
| Enterprise | Custom | White-label, success manager, custom integrations |

### Insurance Commissions (Target: 20% of revenue) 💰
- 15-30% commission on all insurance products sold through platform
- Customer protection tiers: $9.99-$99.99/month
- Provider coverage facilitation: commission on policy placements

### Premium Features (Target: 10% of revenue) 💰
- AI cost estimation: free basic, $5 per detailed report
- Visibility boosts: $25-$100 for featured job listing
- Verified material receipts: $2 per receipt processed
- Priority support: included in paid subscriptions

### Ancillary Revenue (Target: 5% of revenue) 💰
- Financing origination: 1-3% of loan amount
- Supplier referral commissions: 1-2% of material purchases
- Market reports: $99-$499 per anonymized report
- API access fees: $29-$99/month for integrators
- Equipment rental facilitation: 5% of rental value

---

# ═══════════════════════════════════════════════════════════════
# SECTION D: 150 FEATURES — COMPLETE CATALOG
# ═══════════════════════════════════════════════════════════════

Every feature below includes: what it does, why it matters, how it makes money (or retains users), implementation priority, and technical notes.

---

## MODULE 1: TRUST & VERIFICATION (Features 1-10)

### Feature 1: Real-Time License & Insurance Monitoring
**What:** Continuous API monitoring of contractor licenses and insurance policies — not just at onboarding but daily. Instant suspension if license revoked or insurance lapses mid-project. Push alert to affected homeowners.
**Why:** Competitors verify once at signup. We verify continuously. This is a true safety differentiator.
**💰 Revenue:** Charge $10/month for "Verified Active" badge display. Insurance carriers pay referral fees when we route renewals.
**🧲 Retention:** Homeowners trust the platform more. Contractors stay because the badge drives leads.
**Priority:** 📋 PHASE 2
**Tech:** State licensing API subscriptions (CA CSLB, TX TDLR, FL DBPR). Background job runs daily. Failed checks trigger suspension workflow + homeowner notification email.

### Feature 2: Contractor Financial Health Score
**What:** Business viability indicator (Green/Yellow/Red) based on: years in business, payment history on platform, insurance lapse rate, open projects vs. capacity, review trends.
**Why:** Homeowners can't tell if a contractor is financially stable. A contractor about to go bankrupt might cut corners or abandon a project.
**💰 Revenue:** Include in premium homeowner tier ($24.99/mo+). Contractors pay $15/month to display their Green score as a trust signal.
**Priority:** 📋 PHASE 2
**Tech:** Aggregate existing platform data (projects, payments, reviews) into a scoring model. No external data needed initially. Add credit bureau integration in Phase 3.

### Feature 3: Neighbor Reference Network
**What:** When a contractor bids, platform auto-identifies past projects within 1 mile. Shows homeowner: "3 of your neighbors hired this contractor" (with permission).
**Why:** Hyperlocal social proof is the most powerful trust signal. People trust their neighbors' choices.
**📈 Growth:** Word-of-mouth amplifier. Neighbors talk. One good project generates 3-5 more.
**Priority:** 📋 PHASE 2
**Tech:** Geocode all completed projects. Query by radius on bid submission. Opt-in permission stored on review model. Privacy-safe: no addresses shown, just count + ratings.

### Feature 4: Skills Assessment Testing
**What:** Trade-specific knowledge tests: multiple choice + photo-based problem identification. "Can you identify the code violation in this photo?" Scored and badged.
**Why:** Differentiates skilled tradespeople from general handymen. Homeowners get quality assurance.
**💰 Revenue:** $25 per assessment (one-time). "Assessed" badge drives 15% more leads (our data shows verified contractors win more bids).
**🧲 Retention:** Contractors invest in their profile — switching cost increases.
**Priority:** 📋 PHASE 2
**Tech:** Test content created per trade (start with 5 major trades). Photo-based questions use existing project photos. Auto-graded. Retake allowed after 30 days.

### Feature 5: Live Job Site Verification
**What:** Random unannounced video check-ins by platform QA on active projects. Opt-in for contractors. Verified Active badge + priority placement.
**Why:** Catches ghost contractors, ensures work quality, builds unprecedented trust.
**💰 Revenue:** $15/month opt-in for contractors. Homeowners on Comprehensive insurance tier ($49.99/mo) get guaranteed verified projects.
**Priority:** 🔮 PHASE 3
**Tech:** Video call integration (Twilio). Random selection algorithm (weighted by project value and contractor history). QA checklist per trade.

### Feature 6: Verified Material Receipts
**What:** Contractors upload purchase receipts. OCR parses them and matches against bid line items. Homeowner sees: "Materials verified: $4,200 of $4,500 budgeted purchased from Home Depot."
**Why:** Prevents material cost inflation (common complaint). Builds trust in contractor billing.
**💰 Revenue:** $2 per receipt processed (charged to project, not individual). Included free in Professional+ subscriptions.
**Priority:** 📋 PHASE 2
**Tech:** OCR (Tesseract or AWS Textract). Parse store name, items, quantities, prices. Fuzzy match against bid line items. Display match percentage.

### Feature 7: Anonymous Contractor-to-Contractor Reviews
**What:** Contractors rate other contractors they've worked with as subs or on adjacent projects. Invisible to homeowners but factors into matching quality.
**Why:** Peer assessment catches things homeowner reviews miss: reliability, trade skill, professionalism with other trades.
**🧲 Retention:** Creates professional reputation layer. Contractors engage more deeply.
**Priority:** 🔮 PHASE 3
**Tech:** Separate review model (PeerReview) with visibility=CONTRACTOR_ONLY. Weighted into matching algorithm at 5%.

### Feature 8: Contractor Response Time SLA
**What:** Contractors commit to response time guarantees (e.g., "I respond within 4 hours"). Platform tracks actual performance. Violations lower match priority.
**Why:** #1 homeowner complaint industry-wide is contractor ghosting. This creates accountability.
**📈 Growth:** "Guaranteed response times" is a powerful marketing message vs. competitors.
**Priority:** 🔨 BUILD NOW (backend tracking, display in Phase 2)
**Tech:** Track time between message received and first response. Rolling 30-day average. Display on profile. Threshold violations trigger automated warning email.

### Feature 9: Contractor Workload Monitor
**What:** Track active projects per contractor. Warn homeowners during bid evaluation: "This contractor has 8 active projects — above their typical capacity of 4."
**Why:** Overcommitted contractors miss deadlines and cut corners. Transparency protects homeowners.
**🧲 Retention:** Homeowners trust platform recommendations more.
**Priority:** 📋 PHASE 2
**Tech:** Count active projects per contractor (status = IN_PROGRESS). Historical capacity = average concurrent projects over last 12 months. Display ratio on bid card.

### Feature 10: Third-Party Quality Audits
**What:** Platform-employed inspectors randomly audit 5% of completed projects. Results calibrate contractor ratings and validate review system.
**Why:** Keeps reviews honest. Inflated ratings get corrected. Published as platform trust metric.
**💰 Revenue:** Audit cost ($150/project) covered by platform insurance margin. Builds brand trust worth far more than cost.
**Priority:** 🔮 PHASE 3
**Tech:** Random selection weighted by project value. Inspection checklist per trade. Results stored as QualityAudit model. Adjustment factor applied to contractor rating.

---

## MODULE 2: HOMEOWNER EXPERIENCE (Features 11-22)

### Feature 11: Property Digital Twin
**What:** Persistent 3D model of homeowner's property, built from photos/LiDAR over time. Every completed project updates the twin. Future contractors see existing conditions without site visits.
**Why:** Massive time saver for repeat customers. Contractors bid more accurately. Reduces scope surprises.
**💰 Revenue:** Premium feature: free basic (photos only), $9.99/mo for full 3D twin with measurements.
**🧲 Retention:** Once your home is digitized, you never want to leave the platform.
**Priority:** 🔮 PHASE 3
**Tech:** Apple LiDAR (iPhone Pro) + photogrammetry. Stored as 3D mesh in S3. Viewer built with Three.js.

### Feature 12: Project Concierge (White-Glove)
**What:** For projects >$25K, assign a dedicated human project manager. They coordinate between parties, attend key milestones, handle all platform logistics.
**Why:** High-value projects have highest stakes. Concierge prevents disputes and ensures completion.
**💰 Revenue:** $500-$2,000 per project (2-5% of project value). Upsold at contract signing. High margin — one person manages 5-8 projects simultaneously.
**Priority:** 📋 PHASE 2
**Tech:** Assignment system in admin. Dedicated chat channel. Concierge dashboard with all their active projects.

### Feature 13: Multi-Property Portfolio Management
**What:** Landlords/investors manage 10+ properties from one dashboard. Bulk job posting, contractor pools per property, maintenance schedules, expense tracking, tax reporting.
**Why:** Property investors are repeat customers with high LTV. No competitor serves them well.
**💰 Revenue:** Portfolio subscription: $49/month (up to 10 properties) + $5/additional property. Tax report generation: $25/year per property.
**🧲 Retention:** Once properties are loaded, switching cost is enormous.
**Priority:** 📋 PHASE 2
**Tech:** Property model linked to User. Dashboard aggregates jobs/projects/expenses across properties. CSV export for tax prep.

### Feature 14: Home Improvement Roadmap Planner
**What:** AI builds a 5-10 year improvement plan based on home age, condition, climate, and goals. Prioritized by ROI, urgency, and seasonal timing.
**Why:** Turns one-time users into lifetime customers. "Your roof has 3 years left — start budgeting now."
**💰 Revenue:** Free basic roadmap (acquisition tool). Detailed roadmap with cost estimates: $19.99. Updates with actual market data: $4.99/month.
**📈 Growth:** Shareable roadmaps drive referrals. "See what my house needs" shared on social media.
**Priority:** 📋 PHASE 2
**Tech:** Rules engine based on home age, component lifecycle data, local climate factors. RSMeans integration for cost estimates.

### Feature 15: AR Project Previewer
**What:** Point phone at a room, see proposed changes overlaid in real-time. Swap cabinet colors, visualize wall removal, try different flooring.
**Why:** Reduces decision paralysis (homeowners often delay because they can't visualize). Contractors bid more accurately against clear expectations.
**💰 Revenue:** Free with limitations (3 previews/month). Unlimited: included in Professional subscription. Premium material catalogs from suppliers pay to be included (affiliate revenue).
**Priority:** 🔮 PHASE 3
**Tech:** ARKit (iOS) / ARCore (Android). Material texture library. Supplier API integrations for actual product images.

### Feature 16: Move-In Project Bundle
**What:** New homeowner checklist: lock rekey, deep clean, HVAC inspection, pest inspection, gutter clean, smoke detectors. One-click posts all as bundle.
**Why:** Captures customers at highest-intent moment (just bought a house). Bundle pricing drives volume.
**💰 Revenue:** Bundle facilitation fee: flat $25 per bundle (in addition to per-project fees). Contractors bid on individual items or package.
**📈 Growth:** Real estate agent partnership channel (see Feature 100).
**Priority:** 📋 PHASE 2
**Tech:** Bundle template with pre-filled job posts. Single checkout for multiple jobs. Contractor can bid on individual or all.

### Feature 17: Aging-in-Place Progressive Planner
**What:** For homeowners 55+, staged modification plan: Year 1 (lever handles, non-slip flooring), Year 3 (walk-in shower, grab bars), Year 5 (stairlift, wider doorways). Connects to VA/Medicaid funding.
**Why:** $80B market. Baby boomers aging in place. Platform becomes trusted advisor.
**💰 Revenue:** Free planning (acquisition). Grant application assistance: $99 (platform prepares documentation). Contractor matching premium for certified CAPS contractors.
**📈 Growth:** Partnerships with Area Agencies on Aging, VA, and senior organizations.
**Priority:** 📋 PHASE 2
**Tech:** Questionnaire-driven plan generation. Funding database by state. CAPS contractor badge in matching.

### Feature 18: Home Sale Preparation Package
**What:** When homeowner lists house, platform generates prioritized punch list: "Fix these 5 things for $3,200 and increase sale price by $12,000."
**Why:** Every home sale involves repairs. Real estate agents become referral partners.
**💰 Revenue:** $19.99 for AI-generated report. Contractor matching fees on resulting projects. Real estate agent referral commission: 1% of platform transactions.
**📈 Growth:** Real estate agent partnerships drive massive new user acquisition.
**Priority:** 📋 PHASE 2
**Tech:** Zillow/Redfin API for comparable sales data. Rules engine for ROI calculations per improvement type. Agent referral tracking.

### Feature 19: Seasonal Maintenance Subscription
**What:** Recurring annual packages: spring (gutters, AC tune-up, deck), fall (furnace, weatherization, chimney). Subscribe once, platform dispatches verified contractors.
**Why:** Recurring revenue. Keeps homeowners engaged year-round. Contractors get predictable work.
**💰 Revenue:** Annual subscription: $199-$499 (platform keeps 15% facilitation fee on top of per-project fees). Auto-renewal = predictable revenue.
**🧲 Retention:** Subscription = guaranteed return. Churn drops dramatically.
**Priority:** 📋 PHASE 2
**Tech:** Subscription model with seasonal job auto-creation. Contractor matching based on past performance for that homeowner.

### Feature 20: Home Value Impact Calculator
**What:** "This $40K kitchen remodel will increase your home value by ~$28K (70% ROI) based on comps in your ZIP."
**Why:** Justifies spending. Moves homeowners from "thinking about it" to "let's do it."
**💰 Revenue:** Free basic (acquisition tool). Detailed report with comparables: $9.99.
**📈 Growth:** "What's my renovation worth?" drives organic search traffic.
**Priority:** 📋 PHASE 2
**Tech:** Zillow/Redfin API for comparables. RSMeans for cost estimates. Remodeling Magazine Cost vs. Value data.

### Feature 21: Disaster Preparedness Assessment
**What:** Location-based risk profile (hurricane/earthquake/wildfire/flood) with preventive improvement recommendations. Paired with insurance premium reduction estimates.
**Why:** Proactive rather than reactive. Positions platform as home protection advisor.
**💰 Revenue:** Free assessment (acquisition). Insurance partner referral on recommended coverage. Contractor matching on recommended improvements.
**Priority:** 🔮 PHASE 3
**Tech:** FEMA flood maps, USGS earthquake data, wildfire risk APIs. Improvement recommendations mapped to risk reduction.

### Feature 22: Vacation Home / Second Home Management
**What:** Remote contractor coordination (lockbox codes), seasonal opening/closing bundles, weather monitoring, caretaker matching.
**Why:** 7.5M Americans own second homes. They can't be on-site for maintenance.
**💰 Revenue:** $29/month management subscription + per-project fees. Caretaker matching: $50/placement.
**Priority:** 🔮 PHASE 3
**Tech:** Property type flag. Remote access credential vault (encrypted). Seasonal bundle templates.

---

## MODULE 3: CONTRACTOR GROWTH & TOOLS (Features 23-37)

### Feature 23: AI Takeoff from Photos 
**What:** Contractor photographs a room, AI calculates: sq ft of walls/ceiling/floor, linear ft of trim, outlets, windows, doors. Generates material quantity takeoff in seconds.
**Why:** Currently takes 30-60 minutes manually. This alone justifies a subscription.
**💰 Revenue:** Included in Professional subscription ($99/mo). Per-use: $5 for Starter tier.
**🧲 Retention:** Contractors become dependent on the tool. Massive switching cost.
**Priority:** 🔮 PHASE 3
**Tech:** Computer vision model trained on room photos. Measurement extraction using reference objects. Output: quantity takeoff spreadsheet.

### Feature 24: Smart Bid Auto-Composer
**What:** Contractor walks site, takes photos, speaks notes. AI generates complete line-item bid with local pricing and timeline. Ready for review in 10 minutes instead of 2 hours.
**Why:** Bid preparation is the highest-friction point for contractors. Reducing it drives more bids, which means more revenue.
**💰 Revenue:** Included in Professional+ subscriptions. More bids = more transactions = more platform fees.
**Priority:** 🔮 PHASE 3
**Tech:** Whisper API for transcription. AI takeoff (Feature 23) for quantities. RSMeans + platform historical data for pricing. Template engine for output.

### Feature 25: Smart Template Library
**What:** Contractors build reusable bid templates by project type. Templates learn from past bids — AI adjusts for current prices and specific scope.
**Why:** Reduces bid prep time by 60-80% for experienced contractors.
**💰 Revenue:** Free (drives bid volume). Template marketplace: contractors sell proven templates to others for $5-$25. Platform takes 30%.
**Priority:** 📋 PHASE 2
**Tech:** Template model linked to contractor + category. Variable fields auto-fill from job details. Historical bid data trains pricing suggestions.

### Feature 26: Client Communication Autopilot
**What:** Contractor sets rules: "Send daily photo update at 4pm", "Weekly budget summary on Fridays", "Auto-respond within 2 hours with ETA."
**Why:** Communication is the #1 factor in reviews. Automation ensures consistency without contractor effort.
**🧲 Retention:** Contractors who use autopilot get 0.3 higher average ratings. They stay.
**Priority:** 📋 PHASE 2
**Tech:** Background job scheduler per project. Template engine for auto-messages. Photo compilation for daily updates.

### Feature 27: Job Costing Retrospective
**What:** After completion, platform compares actual costs to bid line by line. "You estimated 40 hours labor but used 52. Drywall material was 10% under."
**Why:** Contractors improve estimating accuracy over time. Historical accuracy rate on profile.
**💰 Revenue:** Free (drives bid quality). "Accuracy Score" badge encourages continued use.
**Priority:** 📋 PHASE 2
**Tech:** Compare bid line items to actual expenses (from receipt uploads + payment records). Generate variance report.

### Feature 28: Contractor Business Intelligence Suite
**What:** Deep analytics: close rate by lead source, optimal bid pricing per ZIP, seasonal revenue forecast, customer acquisition cost, LTV per segment.
**Why:** No competitor offers business-grade analytics to solo contractors.
**💰 Revenue:** Included in Business subscription ($299/mo). This is the #1 reason contractors upgrade.
**Priority:** 📋 PHASE 2
**Tech:** Analytics dashboard pulling from existing platform data. Charts via Recharts. Export to CSV/PDF.

### Feature 29: Automated Marketing Engine
**What:** Platform manages Google Local Services Ads, Facebook ads, and Nextdoor posts on behalf of contractors.
**Why:** Most contractors don't know how to market. This drives platform supply growth.
**💰 Revenue:** Ad management fee: 15-20% of ad spend. Or included in Business subscription as a perk.
**📈 Growth:** More contractors = more supply = better homeowner experience = more demand.
**Priority:** 🔮 PHASE 3
**Tech:** Google LSA API, Facebook Ads API. Templated ad creation from contractor profile data. Performance tracking dashboard.

### Feature 30: Crew Scheduling & Dispatch
**What:** Multi-crew contractors manage daily assignments, travel routing, material pickup stops, shift scheduling.
**Why:** Operational efficiency for growing contractors. Replaces separate scheduling software.
**💰 Revenue:** Included in Business subscription ($299/mo). Replaces $30-$50/mo standalone tools.
**🧲 Retention:** Deep operational integration = very high switching cost.
**Priority:** 🔮 PHASE 3
**Tech:** Calendar model per crew member. Route optimization API (Google Directions or OSRM). Drag-and-drop scheduling UI.

### Feature 31: Apprentice & Mentorship Marketplace
**What:** Licensed contractors list apprenticeship positions. Aspiring tradespeople apply through platform.
**Why:** Addresses skilled labor shortage. Builds future platform supply pipeline.
**💰 Revenue:** Job posting fee: $50/listing. Apprentice subscription: $9.99/month for learning resources.
**📈 Growth:** Trade schools become partnership channel. Apprentices become contractors on platform.
**Priority:** 🔮 PHASE 3
**Tech:** Separate job board for apprenticeships. Mentor matching algorithm. Learning resource library (video + articles).

### Feature 32: Equipment Sharing Co-op
**What:** Contractors list idle equipment for short-term rental to other verified platform contractors.
**Why:** Reduces overhead, increases utilization. Creates community.
**💰 Revenue:** 10% facilitation fee on all rentals. Insurance add-on for equipment damage: $5-$15/rental.
**Priority:** 🔮 PHASE 3
**Tech:** Equipment listing model (type, availability, daily rate, location). Booking calendar. Payment through existing escrow system.

### Feature 33: Fleet & Vehicle Management
**What:** GPS tracking, fuel logging, maintenance scheduling, equipment inventory per vehicle, mileage for taxes.
**Why:** Contractors with trucks need this. Currently use separate apps.
**💰 Revenue:** Included in Business subscription. Standalone: $15/month per vehicle.
**Priority:** 🔮 PHASE 3
**Tech:** GPS integration (OBD-II reader or phone GPS). Vehicle model with maintenance schedule. Mileage log with tax categorization.

### Feature 34: Daily Revenue Tracker
**What:** Real-time money flow: "Today: $2,400 earned across 3 projects. $1,800 pending. Monthly run rate: $48K."
**Why:** Cash flow visibility is critical for self-employed. Gamified with daily/weekly targets.
**🧲 Retention:** Contractors check this daily. Habit-forming engagement.
**Priority:** 🔨 BUILD NOW (simple dashboard widget using existing payment data)
**Tech:** Aggregate from Payment and Transaction models. Display on provider dashboard. No new data needed.

### Feature 35: Automated Lien Filing Assistance
**What:** When contractor isn't paid, platform generates state-specific preliminary notice and mechanics lien documents.
**Why:** Most contractors don't know their lien rights or miss deadlines. This protects them.
**💰 Revenue:** $49 per lien document package. Legal review add-on: $149 (partner attorney network).
**Priority:** 📋 PHASE 2
**Tech:** State-specific template engine (CA, TX, FL, NY first). Deadline calculator from project dates. E-signature integration.

### Feature 36: Contractor Group Health Insurance
**What:** Platform negotiates group health insurance rates. Solo contractors access plans normally reserved for 50+ employee companies.
**Why:** Health insurance is #1 concern for self-employed. Massive retention lever.
**💰 Revenue:** Insurance broker commission: $50-$100/month per enrolled contractor. At 10,000 contractors: $500K-$1M annual revenue.
**🧲 Retention:** This alone prevents contractors from leaving.
**Priority:** 📋 PHASE 2
**Tech:** Partnership with insurance broker (Stride Health or similar). Enrollment integration. Premium billing through platform or direct.

### Feature 37: Contractor Tax Optimization Dashboard
**What:** Real-time deductible expense tracking: mileage, tools, insurance, phone, home office. Quarterly estimated tax calculations. QuickBooks integration.
**Why:** Most contractors overpay taxes by 15-20% due to missed deductions.
**💰 Revenue:** Free basic tracking (retention). QuickBooks sync: $9.99/month. Year-end tax package: $49.
**Priority:** 📋 PHASE 2
**Tech:** Expense categorization from existing transaction data. IRS mileage rate calculator. Quarterly estimate based on YTD income.

---

## MODULE 4: AI & AUTOMATION (Features 38-47)

### Feature 38: AI Scope Creep Detector
**What:** Monitors change orders and daily logs against original contract. Alerts when cumulative changes exceed 15% of original value.
**Why:** Scope creep is the #1 cause of budget overruns and disputes.
**🧲 Retention:** Both parties trust the platform as an honest broker.
**Priority:** 📋 PHASE 2
**Tech:** Sum change order values vs. original contract. Trigger alert at configurable threshold. Dashboard widget showing scope expansion percentage.

### Feature 39: Automated Punch List Generator
**What:** At completion, AI compares final photos to approved plans. Generates specific punch list items.
**Why:** Reduces subjectivity in final walkthrough. Both parties have clear, objective completion criteria.
**💰 Revenue:** Included in Comprehensive insurance tier. Per-use: $15 for uninsured projects.
**Priority:** 🔮 PHASE 3
**Tech:** Computer vision comparison model. Trained on before/after project photo pairs. Output: numbered list with photo annotations.

### Feature 40: Predictive Project Risk Scoring
**What:** Before project starts, AI scores risk (1-100) based on: contractor history, complexity, weather, permits, homeowner history, supply chain.
**Why:** High-risk projects get extra monitoring or insurance requirements. Prevents disputes before they start.
**💰 Revenue:** Risk score drives dynamic insurance pricing (higher risk = higher premium = higher commission).
**Priority:** 📋 PHASE 2
**Tech:** ML model trained on historical project outcomes. Features: contractor metrics, job category, season, location, budget accuracy of past projects.

### Feature 41: Natural Language Contract Editing
**What:** "Change start date to April 15 and add $500 allowance for lights." AI modifies contract, highlights changes, sends for approval.
**Why:** Eliminates friction for routine amendments. No lawyer needed.
**💰 Revenue:** Free basic edits (retention). Complex amendments: $10 per edit with AI review.
**Priority:** 🔮 PHASE 3
**Tech:** LLM (Claude API) parses instruction, modifies contract template fields, generates redlined version. Human approval required.

### Feature 42: AI Inspector Prep
**What:** Before municipal inspection, AI reviews project photos against local code. Generates pre-inspection checklist.
**Why:** Failed inspections cost $200-$500+ in re-inspection fees and 1-2 week delays.
**💰 Revenue:** $15 per pre-inspection report. Contractors on Professional+ get unlimited.
**Priority:** 🔮 PHASE 3
**Tech:** Code requirement database per jurisdiction. Computer vision checks against photo evidence. Checklist output.

### Feature 43: Sentiment-Based Project Health Monitor
**What:** NLP analyzes messages between parties. Detects rising tension early. Platform intervenes with mediation resources.
**Why:** Catches problems when they're fixable. Reduces dispute rate.
**🧲 Retention:** Homeowners feel protected. Contractors feel supported.
**Priority:** 📋 PHASE 2
**Tech:** Sentiment analysis on message content (each message scored -1 to +1). Rolling average tracked. Alert triggered when trend crosses threshold.

### Feature 44: Smart Scheduling Negotiator
**What:** When parties can't agree on timing, AI proposes optimal windows considering: other projects, weather, materials, inspections, homeowner schedule.
**Why:** Scheduling conflicts are the #2 complaint after communication.
**Priority:** 📋 PHASE 2
**Tech:** Calendar integration (Google Calendar API). Weather API. Material delivery tracking. Constraint solver suggests top 3 windows.

### Feature 45: Automated Progress Reports
**What:** Weekly auto-generated PDF: photos, milestone status, budget burn, upcoming schedule, weather outlook. Branded with platform + contractor logos.
**Why:** Professional communication without contractor effort. Homeowner loves it.
**💰 Revenue:** Free (drives satisfaction and reviews). Branded report = marketing for platform.
**Priority:** 📋 PHASE 2
**Tech:** PDF generation from project data. Photo compilation. Template engine. Auto-email on Friday afternoons.

### Feature 46: Permit Prediction Engine
**What:** Homeowner describes project in plain language. AI determines which permits are required in their jurisdiction with 95% accuracy.
**Why:** Permit confusion is the #1 barrier to starting projects. This removes it.
**💰 Revenue:** Free basic prediction (acquisition tool). Full permit application preparation: $49.
**📈 Growth:** "Do I need a permit?" is a massive SEO keyword driving organic traffic.
**Priority:** 📋 PHASE 2
**Tech:** Rules engine per jurisdiction. Input: project type, scope, property details. Output: required permits, estimated fees, typical timeline.

### Feature 47: Code Compliance Photo AI
**What:** During rough-in, AI analyzes photos for common violations: electrical box fill, plumbing trap sizing, missing fire blocking.
**Why:** Catches obvious problems before expensive drywall goes up.
**💰 Revenue:** $10 per analysis. Free for Comprehensive insurance subscribers.
**Priority:** 🔮 PHASE 3
**Tech:** Computer vision model trained on code violation examples. Trade-specific (electrical, plumbing, structural). Not a replacement for inspection — a pre-check.

---

## MODULE 5: FINANCIAL INNOVATION (Features 48-60)

### Feature 48: Material Escrow (Three-Party)
**What:** Materials and labor in separate escrow. If contractor abandons, homeowner owns materials already on-site.
**Why:** Prevents double-paying for materials — common in abandonment situations.
**Priority:** 📋 PHASE 2
**Tech:** Separate escrow buckets in payment model. Material escrow releases on delivery confirmation. Labor escrow releases on milestone approval.

### Feature 49: Dynamic Deposit Sizing
**What:** AI calculates optimal deposit based on project size, material needs, contractor cash flow, and homeowner risk profile.
**Why:** Flat 25% deposits don't fit every project. Smart sizing reduces friction.
**Priority:** 📋 PHASE 2
**Tech:** Algorithm considers: material pre-order costs, project duration, contractor trust score, homeowner payment history.

### Feature 50: Group Buying Power
**What:** Neighbors doing similar projects form a "project group" and negotiate bulk pricing from a single contractor.
**Why:** 20-30% savings on mobilization costs. Contractor gets multiple jobs at once.
**💰 Revenue:** Group facilitation fee: flat $50 per group + standard transaction fees. Contractor pays premium for "bulk lead."
**📈 Growth:** Neighborhood virality. One participant tells five neighbors.
**Priority:** 📋 PHASE 2
**Tech:** Group model linking multiple jobs. Shared contractor pool. Group chat. Combined scheduling.

### Feature 51: Contractor Revenue-Based Financing
**What:** Capital advances repaid as percentage of future platform earnings. No fixed payments during slow months.
**Why:** Aligns platform and contractor incentives. Builds loyalty.
**💰 Revenue:** 1.1-1.3x repayment factor (10-30% return on capital deployed).
**Priority:** 🔮 PHASE 3
**Tech:** Underwriting model based on platform history. Automatic repayment deduction from payouts. Dashboard showing balance and projections.

### Feature 52: Tax Deduction Optimizer
**What:** Identifies deductible project costs: home office improvements, energy credits, medical necessity mods, rental expenses. Generates tax-ready docs.
**Why:** Homeowners miss thousands in deductions annually.
**💰 Revenue:** $19.99 per tax report. Or included in homeowner subscription.
**Priority:** 📋 PHASE 2
**Tech:** Rules engine for federal + state deductions by project type. IRS form references. PDF generation.

### Feature 53: Seasonal Pricing Transparency
**What:** Show homeowners when prices are lowest for their project. "Exterior painting is 20% cheaper in October. Save ~$1,200."
**Why:** Helps budget-conscious homeowners. Smooths contractor demand across seasons.
**💰 Revenue:** Free (acquisition + conversion). Drives off-season project volume = more revenue year-round.
**Priority:** 📋 PHASE 2
**Tech:** Historical price analysis from platform data by category + month + ZIP. Display on job creation page.

### Feature 54: Project Cost Autopsy
**What:** After completion, AI generates analysis: "You paid 12% above median, but quality score is 95th percentile. Value: Fair."
**Why:** Educates homeowners. Validates contractor pricing. Reduces post-project regret.
**💰 Revenue:** Free (retention + review encouragement).
**Priority:** 📋 PHASE 2
**Tech:** Compare project cost to anonymized platform data for same category/ZIP. Factor in quality scores.

### Feature 55: Micro-Payment Milestones
**What:** For small projects ($500-$2K): 50/50 split. For <$500: single payment on completion with platform guarantee.
**Why:** Traditional 3-5 milestones don't work for small jobs. Reduces friction.
**Priority:** 🔨 BUILD NOW
**Tech:** Conditional logic in project creation: if budget < $500, single milestone. If $500-$2K, two milestones. If >$2K, custom milestones.

### Feature 56: Bid Bond Facilitation
**What:** For large projects (>$50K), platform facilitates surety bid bonds through integrated partners. Instant quotes.
**Why:** Removes major barrier for contractors pursuing larger work.
**💰 Revenue:** Bond facilitation fee: 0.5-1% of bond amount. Commission from surety partners.
**Priority:** 🔮 PHASE 3
**Tech:** Surety partner API integration. Bond application pre-filled from contractor profile. Approval workflow.

### Feature 57: Insurance Claim-to-Project Pipeline
**What:** When homeowner files a home insurance claim, platform auto-generates a project with insurance estimate attached. Contractors bid knowing the budget.
**Why:** Streamlines the most frustrating experience in home repair. Captures high-intent, high-value customers.
**💰 Revenue:** Standard transaction fees + insurance referral commission for claims coordination.
**📈 Growth:** Insurance agent partnerships drive massive volume after storms.
**Priority:** 📋 PHASE 2
**Tech:** Claim import template. Insurance estimate OCR parsing. Pre-filled job post from claim data.

### Feature 58: Price Transparency Index (Public)
**What:** For every category/ZIP, publish anonymized price ranges. "Kitchen remodels in 78704: $18K-$45K."
**Why:** Builds platform authority. Massive SEO value. Drives organic traffic.
**💰 Revenue:** Free public data (SEO/acquisition). Detailed market reports: $99-$499 for industry subscribers.
**📈 Growth:** "How much does a kitchen remodel cost in [city]?" — #1 home improvement search query category.
**Priority:** 📋 PHASE 2
**Tech:** Aggregate completed project data by category + ZIP. Anonymize. Generate static pages per category/city.

### Feature 59: Financing Marketplace
**What:** Integrated lenders: personal loans (6-18%), HELOC, home equity, BNPL (Affirm/Klarna), PACE for energy projects.
**Why:** 40% of homeowners delay projects due to financing. Removing the barrier drives conversion.
**💰 Revenue:** Loan origination referral fee: 1-3% of loan amount. At $50M in financed projects: $500K-$1.5M revenue.
**Priority:** 📋 PHASE 2
**Tech:** Lender partner APIs (Affirm, SoFi, etc.). Soft credit pull pre-qualification. Rate comparison UI. Contractor direct payment option.

### Feature 60: Contractor Factoring (BidTrust Capital)
**What:** Instant payment on verified completion at 95% of invoice. Platform assumes collection risk.
**Why:** Cash flow is contractors' #1 problem. This solves it immediately.
**💰 Revenue:** 3-5% factoring fee. At $10M factored monthly: $300K-$500K/month revenue.
**Priority:** 📋 PHASE 2
**Tech:** Auto-verification of milestone completion (photos + homeowner non-dispute within 48hrs). Payment advance from platform reserve. Collection from homeowner on normal timeline.

---

## MODULE 6: SAFETY, COMPLIANCE & LEGAL (Features 61-75)

### Feature 61: Regulatory Compliance Engine
**What:** State-by-state contractor licensing matrix with automated API verification. CA CSLB, TX TDLR, FL DBPR, plus manual queue for non-API states.
**Priority:** 📋 PHASE 2
**Tech:** State API integrations. Daily verification cron job. Suspension workflow on failure.

### Feature 62: Lien Waiver Automation
**What:** State-specific templates auto-generated at each milestone. E-signature workflow. Recording coordination.
**💰 Revenue:** Included in transaction flow (no separate charge — reduces disputes which cost more).
**Priority:** 📋 PHASE 2

### Feature 63: EPA Lead-Safe Certification Tracking
**What:** Pre-1978 property detection, Certified Renovator badge, documentation workflow.
**Priority:** 📋 PHASE 2

### Feature 64: OSHA Compliance Module
**What:** OSHA 10/30 verification, safety checklists, incident reporting, PPE photo detection.
**Priority:** 📋 PHASE 2

### Feature 65: 1099 Tax Reporting Automation
**What:** Auto-generate 1099-NEC for payments >$600. W-9 collection at onboarding. Sales tax via Stripe Tax.
**Priority:** 🔨 BUILD NOW

### Feature 66: Noise & Disruption Scheduler
**What:** Integrates with building rules and noise ordinances. Auto-generates neighbor courtesy notices.
**💰 Revenue:** $5 per courtesy notice generation and delivery.
**Priority:** 🔮 PHASE 3

### Feature 67: Asbestos/Lead Probability Scorer
**What:** AI scores hazmat probability based on home age, materials visible in photos, county records. Routes to certified abatement.
**💰 Revenue:** $15 per assessment. Abatement contractor referral fee.
**Priority:** 🔮 PHASE 3

### Feature 68: Utility Locate Coordination
**What:** Auto-submit 811 utility locate request before any digging project. Track completion, block start until clearance.
**Priority:** 📋 PHASE 2
**Tech:** 811 API integration. Project start gate.

### Feature 69: Workers' Comp Claim Prevention AI
**What:** Analyze job site photos for injury risk factors. Send safety reminders.
**Priority:** 🔮 PHASE 3

### Feature 70: Fire Safety Compliance Checker
**What:** Verify fire stopping, smoke detector placement, CO detector requirements per code.
**Priority:** 🔮 PHASE 3

### Feature 71: Mechanic's Lien Risk Assessor
**What:** Check contractor lien history before hiring. Alert homeowners to lien exposure during projects.
**💰 Revenue:** $5 per lien check. Included in homeowner insurance tiers.
**Priority:** 📋 PHASE 2

### Feature 72: Automatic Preliminary Notice Filing
**What:** Auto-generate and serve preliminary notices in states that require them (CA 20-day, TX monthly).
**💰 Revenue:** $15 per notice. Included in Professional subscription.
**Priority:** 📋 PHASE 2

### Feature 73: Contract Compliance Monitoring
**What:** AI reads signed contract and monitors adherence. Flags violations for both parties.
**Priority:** 🔮 PHASE 3

### Feature 74: Small Claims Court Document Generator
**What:** When disputes exceed platform resolution, generate filing paperwork, evidence packet, timeline narrative.
**💰 Revenue:** $49 per document package.
**Priority:** 🔮 PHASE 3

### Feature 75: HOA Compliance Module
**What:** Upload CC&Rs. Platform cross-references project scope against HOA rules. Auto-generates ARB submissions.
**💰 Revenue:** $25 per ARB package preparation.
**📈 Growth:** HOA boards become referral partners.
**Priority:** 📋 PHASE 2

---

## MODULE 7: COMMUNICATION & COLLABORATION (Features 76-83)

### Feature 76: Multi-Party Project Chat
**What:** For complex projects: GC + subs + homeowner + designer + inspector. Threaded channels per trade.
**Priority:** 📋 PHASE 2

### Feature 77: Asynchronous Video Updates
**What:** 60-second daily walkthrough video. AI generates text summary and highlights.
**💰 Revenue:** Free basic. AI summary: included in Professional subscription.
**Priority:** 📋 PHASE 2

### Feature 78: Document Co-Signing Workspace
**What:** Shared space for contracts, change orders, lien waivers, completion certs. Status tracking for all parties.
**Priority:** 🔨 BUILD NOW (integrate with existing document management)

### Feature 79: Expectation Alignment Scorecard
**What:** Before contract signing, both parties answer 10 questions about expectations. Platform highlights misalignments.
**Why:** Prevents disputes by catching misalignment before work starts.
**Priority:** 📋 PHASE 2

### Feature 80: Progress Verification Checkpoints
**What:** At 25/50/75% completion, structured check-in. Score drops trigger proactive mediation.
**Priority:** 📋 PHASE 2

### Feature 81: Change Order Impact Simulator
**What:** "Adding recessed lighting: +$2,200 cost, +3 days, requires electrical permit, may affect insurance." Full cascade before approval.
**Priority:** 📋 PHASE 2

### Feature 82: Mandatory Photo Documentation Standard
**What:** Minimum photo requirements per project phase. Non-compliance affects contractor rating.
**Priority:** 🔨 BUILD NOW (define standards, enforce in Phase 2)

### Feature 83: Contractor Exit Interview
**What:** When contractor goes inactive, capture why. Aggregated data drives improvements.
**🧲 Retention:** Identifies churn reasons before they become trends.
**Priority:** 📋 PHASE 2

---

## MODULE 8: MARKETPLACE EXPANSION (Features 84-95)

### Feature 84: DIY Assist Mode
**What:** Hire a contractor for consultation only: video walkthrough, material list, step-by-step guidance, on-call troubleshooting. $50-$150/hr.
**Why:** Captures the massive DIY market that currently goes to YouTube.
**💰 Revenue:** Platform takes 20% of consultation fee. At 1,000 consultations/month × $100 avg: $20K/month.
**📈 Growth:** DIYers who get stuck convert to full-service projects.
**Priority:** 📋 PHASE 2

### Feature 85: Material Resale Marketplace
**What:** Post-project leftover materials listed for sale. Reduces waste, saves money.
**💰 Revenue:** 10% transaction fee on all sales.
**Priority:** 🔮 PHASE 3

### Feature 86: Design Consultation Marketplace
**What:** Interior designers and architects offer paid consultations. Better designs = fewer change orders.
**💰 Revenue:** 15% platform fee on consultations.
**Priority:** 📋 PHASE 2

### Feature 87: Home Inspection Integration
**What:** Inspection report auto-imports as project list. Each deficiency = potential job post with one click.
**💰 Revenue:** Per-click conversion fee: $10 per job posted from inspection report. Inspector referral fee: $25 per report.
**📈 Growth:** Captures customers at highest-intent moment.
**Priority:** 📋 PHASE 2

### Feature 88: ADU / Tiny Home Workflow
**What:** Dedicated workflow: zoning check, pre-approved plans, utility coordination, ADU-specific financing.
**Why:** ADUs are fastest-growing housing segment. No platform serves them well.
**💰 Revenue:** Premium project fee (ADUs are $80K-$300K projects). ADU plan marketplace: $99-$999.
**Priority:** 📋 PHASE 2

### Feature 89: Commercial Tenant Improvement
**What:** Small businesses: landlord approval workflows, ADA commercial compliance, fire marshal, occupancy permits.
**💰 Revenue:** Higher transaction fees (commercial projects are larger). B2B subscription tier.
**Priority:** 🔮 PHASE 3

### Feature 90: Expert Q&A Marketplace
**What:** Contractors answer homeowner questions for $5-$25 per answer. "Is this crack serious?" + photo.
**💰 Revenue:** Platform takes 30% of answer fee. At 5,000 questions/month × $15 avg × 30%: $22.5K/month.
**📈 Growth:** Low-friction entry point. Question-askers become project-posters.
**Priority:** 📋 PHASE 2

### Feature 91: Project Journals (Public)
**What:** Homeowners document renovation journeys: photo timelines, costs, lessons. Hosted on platform.
**💰 Revenue:** Free (massive SEO value). Sponsored material mentions by suppliers: $500-$2,000 per feature.
**📈 Growth:** Organic content. Each journal drives 10-50 organic visits/month forever.
**Priority:** 📋 PHASE 2

### Feature 92: Short-Term Rental Optimization
**What:** Renovate specifically for Airbnb/VRBO: smart locks, noise monitors, durable materials, guest-proofing.
**💰 Revenue:** Specialized contractor matching premium. Smart home device affiliate revenue.
**Priority:** 🔮 PHASE 3

### Feature 93: Multi-Unit / Condo Association Module
**What:** HOA boards manage building-wide projects: roof replacement, elevators, common areas. Assessment coordination.
**💰 Revenue:** Enterprise pricing for HOA boards. Large project = large transaction fees.
**Priority:** 🔮 PHASE 3

### Feature 94: Farm / Ranch / Rural Property
**What:** Well/septic, long driveways, outbuildings, fencing (miles not feet), off-grid solar, propane.
**Priority:** 🔮 PHASE 3

### Feature 95: Estate & Probate Services
**What:** Condition assessment, repair-or-sell analysis, estate sale coordination, clean-out, minimum viable repair.
**💰 Revenue:** $99 assessment report. Contractor matching on resulting projects.
**📈 Growth:** Estate attorney partnerships.
**Priority:** 🔮 PHASE 3

---

## MODULE 9: DATA & INTELLIGENCE (Features 96-105)

### Feature 96: Neighborhood Renovation Wave Detection
**What:** AI detects when multiple homes start similar projects (post-hail roofing wave, HOA mandate). Pre-positions capacity.
**Priority:** 📋 PHASE 2

### Feature 97: Material Defect Tracking
**What:** Aggregate reports when product issues appear across projects. Alert future buyers.
**Priority:** 🔮 PHASE 3

### Feature 98: Contractor Capacity Heatmap
**What:** Real-time availability by trade/geography. "Electricians booked 3 weeks out in your area."
**Priority:** 📋 PHASE 2

### Feature 99: Building Code Change Tracker
**What:** Monitor NEC, IPC, IRC changes. Alert affected contractors with summaries.
**💰 Revenue:** Free alerts (retention). CE credit integration: $25 per credit.
**Priority:** 🔮 PHASE 3

### Feature 100: A/B Testing Engine for Profiles
**What:** Contractors test different photos, bios, portfolio arrangements. Platform measures performance.
**💰 Revenue:** Included in Professional subscription.
**🧲 Retention:** Contractors invest in optimization = switching cost.
**Priority:** 📋 PHASE 2

### Feature 101: Smart Notification Throttling
**What:** ML learns engagement patterns per user. Auto-optimizes channel, frequency, timing.
**🧲 Retention:** Reduces notification fatigue. Increases engagement.
**Priority:** 📋 PHASE 2

### Feature 102: Market Entry Advisor
**What:** "Demand for HVAC in ZIP 78745 is high, competition moderate. Estimated time to first project: 2 weeks."
**💰 Revenue:** Included in Business subscription. Drives contractor expansion = more supply.
**Priority:** 📋 PHASE 2

### Feature 103: Conversion Funnel Optimization
**What:** Track: job started → completed → bids received → hired → completed → reviewed. Auto-retarget dropoffs.
**📈 Growth:** 10% improvement in funnel conversion = 10% revenue increase.
**Priority:** 🔨 BUILD NOW

### Feature 104: Platform Health Self-Healing
**What:** Auto-detect supply/demand imbalances. Increase marketing spend, offer signup bonuses, expand matching radius.
**Priority:** 📋 PHASE 2

### Feature 105: Competitive Intelligence Dashboard
**What:** Monitor HomeAdvisor/Angi, Thumbtack, Houzz pricing. Dynamic recommendations.
**Priority:** 🔮 PHASE 3

---

## MODULE 10: PARTNERSHIPS & ECOSYSTEM (Features 106-120)

### Feature 106: Real Estate Agent Integration
**What:** Agents recommend BidTrust to buyers/sellers. Referral dashboard, commission, branded landing pages.
**💰 Revenue:** Agent referral commission: 1% of project transaction fees. At $5M agent-referred projects: $50K.
**📈 Growth:** Each agent refers 5-20 clients/year.
**Priority:** 📋 PHASE 2

### Feature 107: Insurance Agent Referral Network
**What:** Insurance agents recommend BidTrust for claims. Mutual referral for coverage on improvements.
**💰 Revenue:** Referral fees both directions.
**Priority:** 📋 PHASE 2

### Feature 108: Municipal Partnership Portal
**What:** Cities use BidTrust for code violation remediation. Homeowner gets violation → matched with contractor → work done → violation cleared.
**💰 Revenue:** Municipal SaaS fee: $5K-$25K/month per city. Standard transaction fees on resulting projects.
**📈 Growth:** City endorsement = massive trust signal.
**Priority:** 🔮 PHASE 3

### Feature 109: Insurance Adjuster Marketplace
**What:** Licensed public adjusters with ratings, reviews, transparent fees.
**💰 Revenue:** 5% referral fee on adjuster fees.
**Priority:** 📋 PHASE 2

### Feature 110: White-Label API for Property Managers
**What:** Embed BidTrust's bidding/escrow/project management into Buildium, AppFolio, Yardi.
**💰 Revenue:** API access fee: $299-$999/month per integration + transaction fees. B2B enterprise channel.
**Priority:** 🔮 PHASE 3

### Feature 111: Supplier Integration (Home Depot, Ferguson, etc.)
**What:** Real-time inventory, pricing, delivery scheduling from major suppliers.
**💰 Revenue:** Supplier referral commission: 1-2% of materials purchased through platform links.
**Priority:** 📋 PHASE 2

### Feature 112: Trade School Partnerships
**What:** Students get free access, mentorship, job shadowing, path to verification on licensing.
**📈 Growth:** Pipeline for future contractor supply.
**Priority:** 🔮 PHASE 3

### Feature 113: Charity Build Coordination
**What:** Habitat for Humanity and local nonprofits post projects. Contractors volunteer. Platform waives fees.
**📈 Growth:** "Community Builder" badge. PR value. Goodwill.
**Priority:** 📋 PHASE 2

### Feature 114: Real Estate Developer Module
**What:** Flippers and small builders: multi-project dashboard, shared contractors, draw schedules, bulk material purchasing.
**💰 Revenue:** Enterprise subscription: $499/month. Higher transaction volume.
**Priority:** 🔮 PHASE 3

### Feature 115: Referral Reward System
**What:** $50 homeowner referral, $100 contractor referral, $25 social share, $10 photo review.
**📈 Growth:** Viral loop. Each referral generates 1.5x more referrals.
**Priority:** 🔨 BUILD NOW
**Tech:** Unique referral codes. UTM tracking. Credit ledger per user.

### Feature 116: Project Showcase Galleries
**What:** Before/after galleries. Privacy-controlled sharing to Instagram, Pinterest, Houzz.
**📈 Growth:** User-generated content for marketing. SEO value.
**Priority:** 📋 PHASE 2

### Feature 117: Neighborhood Trend Map
**What:** Hyperlocal view of active/completed projects. "5 kitchen remodels this quarter in your neighborhood."
**Priority:** 📋 PHASE 2

### Feature 118: Smart Home Readiness Assessment
**What:** During renovation, recommend infrastructure while walls are open: ethernet, smart switch wiring, doorbell prep.
**💰 Revenue:** Smart home device affiliate revenue ($10-$50 per device sold through recommendation).
**Priority:** 📋 PHASE 2

### Feature 119: Energy Audit Integration
**What:** Before/after energy audits quantify ROI. "New insulation saved 35%, ~$1,800/year."
**💰 Revenue:** Audit partner referral fee. Drives energy-efficient project volume.
**Priority:** 🔮 PHASE 3

### Feature 120: Warranty Marketplace
**What:** Manufacturer + workmanship + extended warranties. Track, claim, transfer on home sale.
**💰 Revenue:** Extended warranty commission: 15-25% of premium. Claim coordination fee.
**Priority:** 📋 PHASE 2

---

## MODULE 11: SPECIALIZED & EMERGING (Features 121-150)

### Feature 121-125: Specialized Trade Workflows
**121 — Electrical:** NEC 2023 compliance, load calculations, EV charger analysis
**122 — Plumbing:** Fixture unit calcs, pipe sizing, material recommendation engine  
**123 — HVAC:** Manual J/S/D integration, duct design visualization, SEER2 comparison
**124 — Roofing:** Drone measurement (DJI/Skydio), damage detection, pitch measurement
**125 — Pool/Spa:** Barrier code compliance, anti-entrapment verification, chemical handling docs

**💰 Revenue per trade tool:** $15/use or included in Professional subscription. Differentiates platform for specialty trades.

### Feature 126-130: Emergency & Weather
**126 — 24/7 Emergency Dispatch:** Geo-fenced contractor network, <30min security, <2hr water/fire
**127 — Storm Damage Response:** Pre-storm staging, post-storm drones, FEMA assistance
**128 — Weather Intelligence:** NOAA integration, trade-specific thresholds, auto-reschedule
**129 — Seasonal Demand Forecasting:** Predict spikes by trade/region/season for capacity planning
**130 — Emergency Rate Caps:** Prevent price gouging during disasters

**💰 Revenue:** Emergency dispatch premium: 15% service fee (higher than standard). Weather intelligence included in subscriptions.

### Feature 131-135: Sustainability & Green
**131 — Green Certification Tracking:** LEED, Energy Star, Passive House, NGBS integration
**132 — Carbon Footprint Calculator:** Embodied + operational carbon per project
**133 — Green Financing:** PACE, EEM, utility rebates, tax credits auto-lookup by ZIP
**134 — Material Lifecycle Database:** Recycled content, local sourcing, cradle-to-cradle
**135 — Circular Economy Features:** Deconstruction planning, reclaimed material marketplace, Habitat ReStore

**💰 Revenue:** Green certification report: $25. Supplier referral on sustainable materials. PACE lender origination fee.

### Feature 136-140: IoT & Hardware
**136 — Smart Sensor Integration:** Water leak, HVAC, electrical, structural, air quality monitoring
**137 — Predictive Maintenance AI:** Predict failures before they happen, auto-dispatch
**138 — Home Health Score (0-100):** Structural + Systems + Environmental + Maintenance + Efficiency
**139 — FLIR Thermal Imaging:** AI analysis for insulation, moisture, electrical hotspots
**140 — Digital Measuring Tools:** Bluetooth laser measures auto-sync to app, populate estimates

**💰 Revenue:** Sensor monitoring subscription: $9.99-$49.99/month. Device affiliate revenue. Thermal scan service: $25/report.

### Feature 141-145: International & Accessibility
**141 — Canada Localization:** Provincial licensing, WSIB, GST/HST, bilingual
**142 — UK Localization:** Gas Safe, NICEIC, Building Regulations, VAT, CIS
**143 — Australia Localization:** White Card, state licensing, bushfire ratings
**144 — ADA/Accessibility Compliance:** CAPS matching, grab bar placement tools, grant navigation (VA HISA/SAH, Medicaid)
**145 — Real-Time Translation:** 15+ languages for messages, calls, contracts (Whisper + LLM)

**💰 Revenue per country:** Full platform revenue model replicated. International TAM: 3-5x US market.

### Feature 146-150: Governance & Community
**146 — Algorithmic Bias Auditing:** Quarterly automated testing, annual third-party audit
**147 — AI Transparency Reports:** Annual public report on matching, pricing, dispute outcomes by demographic
**148 — Community Advisory Board:** 12 members, quarterly meetings, veto on high-risk AI deployments
**149 — Contractor Wellness Resources:** 988 Crisis integration, financial counseling, burnout detection, substance abuse support
**150 — Environmental Justice:** Pro bono project allocation, reduced fees for low-income, contractor travel subsidies for underserved areas

**💰 Revenue:** These don't generate direct revenue. They prevent regulatory risk, build brand trust, and attract values-aligned users who have higher LTV.

---

# ═══════════════════════════════════════════════════════════════
# SECTION E: DATABASE ADDITIONS
# ═══════════════════════════════════════════════════════════════

## Pending Prisma Models (Add to existing schema)

```prisma
model Dispute {
  id                  String        @id @default(cuid())
  jobId               String        @unique
  projectId           String?
  initiatedBy         String
  respondentId        String
  type                DisputeType
  reason              String
  status              DisputeStatus @default(OPEN)
  evidenceUrls        String[]
  counterEvidenceUrls String[]
  adminNotes          String?
  resolution          String?
  resolvedAt          DateTime?
  aiSummary           String?
  settlementAmount    Decimal?
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
}

enum DisputeType {
  PAYMENT
  QUALITY
  DELAY
  SCOPE
  DAMAGE
}

enum DisputeStatus {
  OPEN
  COOLING_PERIOD
  EVIDENCE_COLLECTION
  UNDER_REVIEW
  RESOLVED
  ESCALATED
  ARBITRATION
}

model UserTrustScore {
  userId      String   @id
  score       Float
  factors     Json     // { completion_rate, avg_rating, verification_tier, dispute_penalty }
  updatedAt   DateTime @updatedAt
}

model InsurancePolicy {
  id              String   @id @default(cuid())
  userId          String
  type            String   // GENERAL_LIABILITY, WORKERS_COMP, COMMERCIAL_AUTO, etc.
  carrier         String
  policyNumber    String
  coverageAmount  Decimal
  expiresAt       DateTime
  documentUrl     String
  verified        Boolean  @default(false)
  verifiedAt      DateTime?
  createdAt       DateTime @default(now())
}

model License {
  id              String   @id @default(cuid())
  userId          String
  state           String
  licenseNumber   String
  licenseType     String
  status          String   @default("PENDING") // PENDING, VERIFIED, EXPIRED, REVOKED
  expiresAt       DateTime?
  verifiedAt      DateTime?
  verifiedVia     String?  // API, MANUAL
  createdAt       DateTime @default(now())
}

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  action      String   // PAYMENT_RELEASED, DISPUTE_OPENED, USER_SUSPENDED, etc.
  entityType  String   // User, Project, Payment, Dispute
  entityId    String
  details     Json
  ipAddress   String?
  createdAt   DateTime @default(now())
}

model Referral {
  id              String   @id @default(cuid())
  referrerId      String
  referredEmail   String
  referredUserId  String?
  code            String   @unique
  status          String   @default("PENDING") // PENDING, SIGNED_UP, QUALIFIED, REWARDED
  rewardAmount    Decimal?
  rewardedAt      DateTime?
  createdAt       DateTime @default(now())
}

model Subscription {
  id          String   @id @default(cuid())
  userId      String
  tier        String   // STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE
  stripeSubId String?
  status      String   @default("ACTIVE")
  startedAt   DateTime @default(now())
  expiresAt   DateTime?
  cancelledAt DateTime?
}

model LienWaiver {
  id          String   @id @default(cuid())
  projectId   String
  milestoneId String?
  type        String   // CONDITIONAL, UNCONDITIONAL, PARTIAL, FINAL
  state       String
  status      String   @default("PENDING") // PENDING, SIGNED, RECORDED
  documentUrl String?
  signedAt    DateTime?
  createdAt   DateTime @default(now())
}

model WarrantyRecord {
  id              String   @id @default(cuid())
  projectId       String
  type            String   // MANUFACTURER, WORKMANSHIP, EXTENDED
  provider        String
  description     String?
  startDate       DateTime
  endDate         DateTime
  serialNumber    String?
  documentUrl     String?
  claimFiled      Boolean  @default(false)
  createdAt       DateTime @default(now())
}

model EmergencyRequest {
  id                      String   @id @default(cuid())
  userId                  String
  projectId               String?
  type                    String   // WATER, FIRE, ELECTRICAL, STRUCTURAL, SECURITY, HVAC
  severity                Int      // 1-5
  description             String
  dispatchedContractorId  String?
  responseTimeMinutes     Int?
  resolutionType          String?  // TEMPORARY, PERMANENT
  status                  String   @default("REPORTED") // REPORTED, DISPATCHED, IN_PROGRESS, RESOLVED
  createdAt               DateTime @default(now())
}

model ComplianceCheck {
  id            String   @id @default(cuid())
  entityType    String   // CONTRACTOR, PROJECT
  entityId      String
  checkType     String   // LICENSE, INSURANCE, PERMIT, INSPECTION, LIEN_WAIVER, BACKGROUND
  status        String   @default("PENDING") // PENDING, PASSED, FAILED, EXPIRED
  jurisdiction  String?
  documentUrl   String?
  validUntil    DateTime?
  verifiedAt    DateTime?
  createdAt     DateTime @default(now())
}

model PermitApplication {
  id              String   @id @default(cuid())
  projectId       String
  jurisdiction    String
  permitType      String
  applicationNum  String?
  status          String   @default("DRAFTING")
  submittedAt     DateTime?
  approvedAt      DateTime?
  inspectionDate  DateTime?
  documents       Json?
  feesPaid        Decimal?
  createdAt       DateTime @default(now())
}
```

---

# ═══════════════════════════════════════════════════════════════
# SECTION F: NEW API ENDPOINTS
# ═══════════════════════════════════════════════════════════════

```
DISPUTES:
  POST   /disputes                    # File dispute
  GET    /disputes/:id                # Get dispute details
  PUT    /disputes/:id                # Update dispute (add evidence)
  POST   /disputes/:id/counter        # Submit counter-evidence
  POST   /disputes/:id/resolve        # Admin resolve
  GET    /disputes/project/:pid       # Get dispute for project

COMPLIANCE:
  GET    /compliance/jurisdictions     # Supported jurisdictions
  POST   /compliance/checks           # Initiate check
  GET    /compliance/checks/:id       # Get status
  POST   /compliance/permits          # Submit permit
  GET    /compliance/permits/:id      # Check status

INSURANCE:
  GET    /insurance/products           # Available products
  POST   /insurance/policies           # Purchase/enroll
  GET    /insurance/policies/:id       # Policy details
  POST   /insurance/claims             # File claim
  GET    /insurance/claims/:id         # Claim status

REFERRALS:
  POST   /referrals/generate           # Generate referral code
  GET    /referrals/stats              # Referral dashboard
  POST   /referrals/redeem             # Apply referral code

SUBSCRIPTIONS:
  GET    /subscriptions/plans          # Available plans
  POST   /subscriptions               # Subscribe
  PUT    /subscriptions/:id            # Change plan
  DELETE /subscriptions/:id            # Cancel

WARRANTIES:
  POST   /warranties                   # Register warranty
  GET    /warranties/project/:pid      # Project warranties
  POST   /warranties/:id/claim         # File claim

EMERGENCY:
  POST   /emergencies                  # Report emergency
  GET    /emergencies/:id              # Status
  PATCH  /emergencies/:id/dispatch     # Assign contractor
  POST   /emergencies/:id/resolve      # Resolve

MARKETPLACE:
  GET    /marketplace/materials         # Material resale listings
  POST   /marketplace/materials         # List materials for sale
  GET    /marketplace/experts           # Expert Q&A availability
  POST   /marketplace/questions         # Ask expert question
  GET    /marketplace/consultations     # Design consultation listings
```

---

# ═══════════════════════════════════════════════════════════════
# SECTION G: IMPLEMENTATION ROADMAP
# ═══════════════════════════════════════════════════════════════

## Immediate: Weeks 1-14 (Frontend Rebuild)
**Revenue: $0 → First transaction**
- Weeks 1-2: Foundation (auth, layout, UI library)
- Weeks 3-4: Customer core (dashboard, job wizard, bid management)
- Weeks 5-6: Provider core (discovery, bidding, profile)
- Weeks 7-8: Communication + Projects (messaging, milestones)
- Weeks 9-10: Payments + Reviews (escrow, Stripe, double-blind reviews)
- Weeks 11-14: Admin + Polish (moderation, mobile, accessibility, SEO)

## Phase 2: Months 5-8 (Trust + Revenue Expansion)
**Revenue target: $50K MRR**
- Contractor subscriptions launch (Features: Smart Templates, Communication Autopilot, BI Suite)
- Homeowner insurance tiers launch
- Referral system (Feature 115)
- Financing marketplace (Feature 59)
- Contractor factoring (Feature 60)
- Compliance engine (Features 61-65)
- Project concierge for >$25K projects
- Price Transparency Index (SEO play)
- Real estate agent + insurance agent partnerships

## Phase 3: Months 9-12 (Intelligence + Marketplaces)
**Revenue target: $200K MRR**
- AI cost estimation
- DIY Assist Mode
- Expert Q&A marketplace
- Material resale marketplace
- Design consultation marketplace
- Emergency dispatch system
- Weather intelligence
- IoT sensor platform beta
- International pilot (Canada)

## Phase 4: Months 13-18 (Ecosystem Maturity)
**Revenue target: $500K MRR**
- Voice interface
- AR project previewer
- Property digital twin
- Advanced trade workflows
- Hardware integrations
- White-label API
- Municipal partnerships
- Full international expansion

## Phase 5: Months 19-24 (Scale)
**Revenue target: $1M+ MRR**
- Blockchain contract anchoring
- Predictive maintenance at scale
- Contractor group health insurance
- Revenue-based financing at scale
- Community advisory board
- AI governance framework

---

# ═══════════════════════════════════════════════════════════════
# SECTION H: REVENUE SUMMARY
# ═══════════════════════════════════════════════════════════════

## Revenue Streams at Scale (Year 3 Target)

| Stream | Annual Revenue | % of Total |
|--------|---------------|-----------|
| Transaction fees (5-10%) | $40M | 38% |
| Contractor subscriptions | $26M | 25% |
| Insurance commissions | $15M | 14% |
| Premium features (AI, tools) | $5M | 5% |
| Financing origination | $4M | 4% |
| Marketplace fees (Q&A, DIY, materials) | $3M | 3% |
| Supplier referral commissions | $3M | 3% |
| Data/market reports | $2M | 2% |
| Warranty commissions | $2M | 2% |
| API/white-label | $2M | 2% |
| Emergency premiums | $1M | 1% |
| Other (referrals, ads, events) | $1M | 1% |
| **TOTAL** | **$104M** | **100%** |

## Key Low-Cost-to-User Revenue Plays

These make money WITHOUT costing users much:

1. **Supplier referral commissions (1-2%)** — Users buy materials at the same or lower prices. Suppliers pay us for the referral. Zero cost to user.
2. **Insurance commissions (15-30%)** — Users pay market-rate insurance. We earn broker commission. Zero markup to user.
3. **Financing origination (1-3%)** — Lenders pay us for qualified leads. Users get competitive rates. Zero extra cost.
4. **Smart home device affiliates** — Recommend devices during renovation. Users buy at retail price. Manufacturer pays us 5-10%.
5. **Data/market reports** — Anonymized platform data sold to industry. Users are the product (anonymized). Zero cost to user.
6. **SEO content (journals, price index)** — User-generated content drives organic traffic. Zero cost. Massive long-term value.
7. **Trade school partnerships** — Schools pay for pipeline access. Students get free platform access. Win-win.
8. **Municipal partnerships** — Cities pay SaaS fee. Homeowners get streamlined violation resolution. Zero user cost.
9. **Real estate agent partnerships** — Agents pay referral fee from their commission. Homeowner pays nothing extra.
10. **Warranty commissions** — Extended warranty sold at competitive rates. Platform earns underwriting margin.

---

# ═══════════════════════════════════════════════════════════════
# SECTION I: ENVIRONMENT & FILE STRUCTURE
# ═══════════════════════════════════════════════════════════════

## Environment Variables

```env
# Backend (Railway)
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...
RESEND_API_KEY=re_...
S3_BUCKET=bidtrust-uploads
S3_REGION=us-east-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
# + LinkedIn, Apple, Twitter, GitHub, Microsoft OAuth credentials
SENTRY_DSN=...
REDIS_URL=... (when added)
```

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://web-production-3651c.up.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_SENTRY_DSN=...
```

## File Structure

```
bid4service/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers (one file per module)
│   │   ├── routes/          # Express route definitions
│   │   ├── middleware/       # Auth, validation, error handling, rate limiting
│   │   ├── services/        # Business logic layer
│   │   ├── models/          # Prisma model extensions
│   │   ├── utils/           # Helpers, constants, validators
│   │   └── config/          # Database, Stripe, S3, email config
│   ├── prisma/
│   │   └── schema.prisma    # Database schema (36+ models)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   │   ├── (auth)/      # Login, register, forgot-password
│   │   │   ├── dashboard/   # Customer dashboard pages
│   │   │   ├── provider/    # Provider dashboard pages
│   │   │   ├── admin/       # Admin dashboard pages
│   │   │   ├── jobs/        # Job listing, detail, creation
│   │   │   ├── projects/    # Project management pages
│   │   │   ├── messages/    # Messaging interface
│   │   │   └── (marketing)/ # Public pages (landing, how-it-works, pricing)
│   │   ├── components/
│   │   │   ├── ui/          # Primitives (Button, Input, Modal, etc.)
│   │   │   ├── forms/       # Complex forms (JobForm, BidForm, ReviewForm)
│   │   │   ├── layouts/     # MainLayout, DashboardLayout, AdminLayout
│   │   │   └── features/    # Feature-specific (MapExplorer, ChatWindow, BidComparison)
│   │   ├── hooks/           # useAuth, useApi, useRealtime, useDebounce
│   │   ├── lib/             # API client (axios), utils, constants
│   │   ├── stores/          # Zustand or React Query config
│   │   └── types/           # TypeScript interfaces matching API responses
│   ├── public/              # Static assets, images, icons
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

**END OF DOCUMENT**

*This is the single source of truth for all BidTrust development. When implementing any feature, check the tier (✅/🔨/📋/🔮) first. When in doubt, search this document. Update as implementation progresses.*

*Version 6.0 — March 15, 2026*
