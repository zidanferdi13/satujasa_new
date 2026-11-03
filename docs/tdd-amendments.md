# TDD Amendments — Source of Truth for Changes

The TDD was issued in Thread 3 on Day 1. These amendments override it where they differ,
and each one is CEO/PM-decided. If the TDD and this file disagree, **this file wins**.

---

## A1. Revenue formula — CEO ruling (b)

```
revenue = customer_payment − samsat_payment = service_fee (biaya jasa)
```

Invariant, per file, must always hold:
`total_paid = samsat_payment + service_fee` and `revenue = service_fee`

- **Never subtract `serviceFee` from revenue.** `service_fee` *is* revenue. Subtracting it
  double-counts and drives revenue to ~0 on every file.
- If the three quantities ever disagree on a stored file, that is a bug, not rounding.
- Storage: `serviceFee` column or derived value — Developer's call.
- Supersedes the original TDD formula (`customer − samas − service_fee`), which was wrong.

## A2. Terminology — CEO

- Always **SAMSAT** in code identifiers and UI copy. Never "samas".
- Printed document is **Surat Jalan** (cover letter → Surat Jalan in copy).
- Existing identifiers (`samasPayment`, `ON_PROGRESS_SAMAS`, `COMPLETED_SAMAS`,
  `SAMAS_PAYMENT`) may be renamed by Developer via a new migration. Pre-launch, no data, so
  rename is cheap now and expensive later.

## A3. Money is whole rupiah (`Int`)

All money columns are `Int`, never `Float`/`Decimal` fractional:
`File.{estimatedPrice,dpAmount,finalPrice,samasPayment,serviceFee,revenue}`, `Transaction.amount`.
Migration `2_money_whole_rupiah_int` raises instead of rounding fractional data by design.
Recovery: `prisma migrate resolve --rolled-back 2_money_whole_rupiah_int`, fix rows, redeploy.

## A4. Operator identity — Variant A

`User` + `Member(role)` = login identity. `Operator` = staff profile that `File`,
`Transaction`, `ActivityLog` point at, via required unique `Operator.memberId` (cascade).
Recorded limits: `Operator.email` is globally unique (one person cannot operate at two
organizations); the owner has no `Operator` row until A5.

## A5. Owner-as-operator — CEO

The owner may operate, and **operating consumes one operator seat** from the purchased plan.
Basic (1 seat) = owner alone. Pro (3 seats) = owner + 2, or 3 operators.
Basic must never yield two workers. Mechanism is Developer's; the economics are fixed.
Seat count therefore counts `Operator` rows, not `Member(OPERATOR)` rows.

## A6. Auth — no token-trusted role

Role and organizationId are re-read from the database on every request (`currentAccess`).
A deactivated operator loses access on the next request. A user without membership cannot log
in. A password reset must also invalidate existing sessions (`passwordChangedAt` vs token age).

## A7. Password reset

Token 256-bit random, only SHA-256 stored, 60-minute expiry, single-use via atomic claim,
new request invalidates older unused tokens, identical response for unknown emails,
one email per address per 60 s. Links built from a **server-only `APP_URL`** read at runtime —
never `NEXT_PUBLIC_*`, which is frozen into the build.

## A8. Hosting — replaces the Netlify plan

1. **Local trial** on our machine, exposed over a temporary public tunnel (Midtrans sandbox
   notifications need a public URL). Client reviews it.
2. **Gate:** client approval of the demo before any customer launch.
3. **Production:** client's VPS — Next.js behind a reverse proxy, PostgreSQL on the same box.

Netlify and Vercel are both dropped (Vercel Hobby forbids commercial use; Netlify is
unnecessary once we own the VPS). No recurring USD cost; budget is one-time Rp 1.000.000,
domain year one only.

### VPS operations requirements
- Nightly encrypted `pg_dump` + **one copy off the VPS**; 30-day retention; **one restore
  performed before launch**.
- Automatic TLS renewal, no manual step.
- PostgreSQL **not reachable from the internet** (localhost bind, firewall `5432`).
- Process supervision: app restarts after crash or reboot with nobody logged in.
- Cost of every item stays at zero.

## A9. Uptime

99% is an internal target, **not** a promise. No SLA appears in the legal pages or the landing
copy. Measured on the VPS at M8; localhost numbers do not count.

## A10. Test process

- Developer hands off a **commit hash**; QA tests that commit and nothing else.
- QA builds from `git archive` into a separate directory — never in the shared working tree.
- Redirects are verified in a **real browser** only; PPR returns HTTP 200 with a streamed
  `NEXT_REDIRECT`, so curl status codes are not evidence.
- Developer's own verification scripts are supporting evidence, never QA's evidence.
- No `prisma migrate dev` in the repo; throwaway databases only.

## A11. Legal pages

`/kebijakan-privasi` and `/syarat-ketentuan` are required before **Midtrans production**, not
before the sandbox demo. No placeholder content: an empty policy is worse than none.
Identity block: legal name, address, contact email; NPWP only if the client confirms.
Claims must match the implementation — "encrypted at rest" is only true once the M6 encryption
work ships, and deletion promises need `scripts/delete-org-data.ts` behind them.
Data is personal data under UU 27/2022 (PDP); purpose, access scope and retention must be stated.

## A12. No access without payment — CEO ruling (BUG-15)

Registration creates the organization and the owner login only. **No Subscription, operator
limit 0.** No plan is granted anywhere without a PAID payment.

One state for every organization without an active subscription — never paid and lapsed are
identical:

- Owner can log in, sees the "subscribe to start" screen (Basic + Pro cards, WhatsApp for
  Custom). Nothing else is usable.
- Owner can view and export existing data. The data belongs to them; the privacy policy
  promises retention, not deletion on lapse.
- No new berkas. Operators cannot log in. No grace period in the MVP.

"Active" means `status = ACTIVE AND currentPeriodEnd > now`, evaluated at read time. There is
no scheduled job in the MVP, so a row that stayed `ACTIVE` past its end must still read as
expired. Entitlement comes from the active subscription (or its absence), **never** from
`Organization.package`, which defaults to `BASIC` on creation.

Watch the schema default `operatorLimit @default(1)`: registration must write `0` explicitly.

## A13. Subscription periods — CEO ruling (BUG-14)

- **Same-plan renewal:** new period starts at `max(now, end of current period)`. Paid-for days
  are never taken away.
- **Upgrade (Basic → Pro):** starts `now`. The new operator limit applies immediately. Unused
  Basic days are **not** credited — this is the whole of "no proration", and FAQ #4 already
  says it. Checkout must say so in one plain Indonesian sentence before the pay button
  (Designer's wording).
- **Downgrade (Pro → Basic):** not offered while Pro is active. The customer lets Pro lapse,
  then buys Basic, and the owner picks which operator stays active within the new limit.
- `checkoutRefusal()` refuses any target plan lower than the currently active one.

## A14. Access checks that follow from A12/A13

- Only one `ACTIVE` subscription per organization (partial unique index, migration 4).
- An org whose limit dropped below its active operators (e.g. Pro 3 → Basic 1) is over limit:
  operators are blocked and the owner must deactivate down to the limit. Read-time check, no
  data destruction.
- **Demo gate:** the client must walk the real path — register, locked screen, sandbox payment,
  active — before approving the demo. A pre-seeded paid account alone is not sufficient.

## A15. Demo database, tunnel and off-box backups (Researcher ruling, PM-accepted)

**Database.** Demo: project-owned PostgreSQL 17 cluster on the demo machine
(`~/.local/share/biro-jasa/demo-pg`, localhost-only, port **5433**; the system cluster on 5432
is peer-auth only and not ours to touch),
disposable — drop, `prisma migrate deploy`, reseed per run. Production: PostgreSQL **17** on the
client VPS (install from the PGDG apt repository if the distro ships older). **Neon is dropped
entirely** — no URL in `.env.example`, no code path, no "optional sandbox".

**Tunnel (demo only).** Cloudflare Quick Tunnel: `cloudflared tunnel --url http://localhost:3000`.
- The hostname changes on every restart. Start it once per demo window; on restart update the
  Midtrans sandbox notification URL, `APP_URL` and `AUTH_URL`.
- NextAuth v5 behind a tunnel: `AUTH_URL` must be the tunnel URL (or `AUTH_TRUST_HOST=true`),
  otherwise login callbacks redirect to `localhost`.
- Fake data only — a `trycloudflare.com` URL is public to anyone who has it.
- Before the client's M9 demo, switch to a named Cloudflare tunnel on the client's domain.
- Demo machine is aarch64 (Raspberry Pi, 3.7 GB RAM): use the `cloudflared` linux-arm64 build.
  Load-time numbers from this machine count for the demo only; the 3-second target is measured
  on the VPS (A9).

**Off-box backup.** Nightly `pg_dump -Fc`, encrypted, copied off the VPS, 30-day retention.
- Encryption: **public-key** (`gpg`). The VPS holds only the public key, so it can encrypt but
  never decrypt. The private key lives off the VPS: the client keeps one copy, Jihann keeps one
  sealed copy. Losing the VPS must not lose the key; compromising the VPS must not expose old dumps.
- Destination: pending CEO confirmation (PM recommendation: the client's Google Drive via
  `rclone`, dedicated folder; zero cost, 15 GB free, one-time consent by the client).
- Before launch: one real restore of a downloaded dump onto a clean PostgreSQL 17, timed, logged.
- The single box means app and database fail together. The off-box dump is the only copy that
  survives the VPS; it is not optional.

## A16. UI strings and display rules (Designer's `docs/ui-strings-id.md`)

`docs/ui-strings-id.md` is the single source of Indonesian UI copy and the repo copy is
authoritative. Build verbatim; new copy needs Designer approval through the PM.

Hard display rules:
- **No "-" placeholders.** `Rp 0` / `0` when there is no data. A dash on the revenue card
  reads as a missing feature.
- **No dead links.** Sidebar shows only routes that exist. Until M3/M4 build them, the owner
  sidebar is `Beranda` alone and the operator sidebar is `Beranda` alone. Raise a real
  `not-found.tsx` ("Halaman belum tersedia") instead of the framework default.
- **A `null` operator limit** — render `Sesuai kesepakatan` and hide the
  counter and the over-limit alert; never `1 / null`.
- **No `Role: OPERATOR`.** Operators know their role; raw enums never reach the screen.
- Status badges always carry text; colour is never the only signal.
- Hardcoded Indonesian prose stays out of components: strings live in `src/lib/`, per the M7
  precedent, so Designer/QA can diff them.

Revenue reporting (needed for criteria #4 and #5):
- **`File.pickedUpAt DateTime?` is required in M3**, set when status becomes `PICKED_UP`;
  `completedAt` may be added the same way later. `File` currently has only `createdAt` /
  `updatedAt`, so "this month" cannot be computed without it.
- "Pendapatan Bulan Ini" = sum of `File.revenue` for files with `pickedUpAt` inside the current
  calendar month in **Asia/Jakarta**, cached field, owner org only. It is job-completion
  revenue, not cash receipts; the label must not promise cash.
- `TransactionType.SERVICE_FEE` is never created — the service fee *is* the revenue (A1).
  A `SERVICE_FEE` row would double-count it.

English is allowed only in developer-facing messages that no user can reach (e.g.
`isActive must be a boolean`).

## A17. File (berkas) rules for M3 — from Designer §12a/§12b

- **`ownershipType` becomes a Prisma enum `OwnershipType { PERORANGAN, BADAN_USAHA }`**
  (migration converts the existing `String`; seed only holds `PERORANGAN`). Provisional: CEO to
  confirm with the client whether other ownership types occur (e.g. instansi). Adding a value
  later is an additive `ALTER TYPE … ADD VALUE`. Rendered as a select, never free text.
- **Server computes money, never trusts the body:** `serviceFee = revenue = finalPrice −
  samsatPayment`, computed on save; any `serviceFee`/`revenue`/`pickedUpAt` in the request is
  ignored.
- **`PICKED_UP` requires `finalPrice` and `samsatPayment` set** and `finalPrice ≥ samsatPayment`.
  The server sets `pickedUpAt = now()` on that transition.
- **`PICKED_UP` and `CANCELED` are terminal in the MVP.** No backward transitions, so
  `pickedUpAt` can never be moved and monthly revenue can never be backdated. Owner-side
  correction is post-MVP.
- **Files are never deleted.** No "Hapus" action on files; cancelling is status `CANCELED`.
  Revenue history is protected the same way as BUG-12.
- **KTP (`customerKtp`) stays a `String`** (16 digits, leading zeros). Masked
  (`••••••••••••` + last 4) in every list/table and every log line; full value only on the
  detail/edit screen.
- **Owner data export (A12) contains the full KTP:** it is the owner's own data, and handing it
  back is the point of export. Export is owner-only and is not available to operators.
- **Surat Jalan PDF:** masked KTP unless the client confirms the printed document needs the
  full number (question to CEO).

## A18. Refunds and stale orders (PM, from QA pass at 1867bd7)

- **A refund ends the access it paid for (BUG-17).** On a `REFUNDED` notification, the
  Subscription created by that payment becomes `CANCELED` with `currentPeriodEnd = now`, and the
  organization's `operatorLimit` follows A12 (0 if nothing else is active). This needs a link:
  `Subscription.subscriptionPaymentId String? @unique`. Refunds stay manual in the Midtrans
  dashboard; the system only reacts. Ceiling: refund of an upgrade drops the org to the locked
  state rather than restoring Basic — acceptable, because CEO policy only refunds within 7 days
  with no file recorded.
- **The webhook re-applies `checkoutRefusal()` against the current active subscription.** A Basic
  order created before a Pro upgrade and paid later must not downgrade the org. If refused: mark
  the payment `PAID`, change no subscription, log it for a manual refund.
- **Bug numbers are assigned by the PM only.** QA's "BUG-14 (Low)" from the 1867bd7 pass is
  **BUG-16**: re-activating an already-active operator returns 403 at the limit; must return 200
  with no seat claim. Fix with M3.

## A19. Locked-screen CTAs and the seed password guard (PM, at fc94367)

- **The locked screen must not link a signed-in owner to `/register`.** `/register` exists, so it
  passes a literal dead-link check, but a logged-in owner clicking "Pilih Basic" lands on a signup
  form — a dead end that reads as a bug to the client. Until `/checkout` exists: render the pricing
  cards **without** the Basic/Pro buttons (price and caption only) and keep "Hubungi Kami" (the
  WhatsApp link). Wire the buttons to `/checkout` in the same commit that adds it. No new copy
  needed either way.
- **The seed itself must refuse the default password, not only `demo.sh`.** `prisma/seed.ts:16`
  still falls back to `demo1234` when `DEMO_PASSWORD` is unset, so `pnpm prisma db seed` against a
  public `APP_URL` still creates a guessable login. Rule: seed exits 1 when `DEMO_PASSWORD` is
  unset **and** `APP_URL` is set to anything that is not `localhost`/`127.0.0.1`. `demo.sh`'s
  earlier check stays; it just is not the only one.

## A20. Manual transfer replaces Midtrans (CEO ruling, PM-accepted)

**Supersedes:** A18 in full (webhook refund + stale-order re-check: no gateway, no webhook). The
A14 demo gate's "sandbox payment" step becomes "manual transfer verified by Super Admin". A15's
tunnel stays, but only so the client can reach the local demo — no callback URL, no public
webhook. A17's Surat Jalan clause is closed: the printed Surat Jalan carries the **full NIK**.

### Payment model
- `PaymentStatus { UNPAID, WAITING_VERIFICATION, PAID, REJECTED }` replaces
  `PENDING/FAILED/EXPIRED/REFUNDED`. Refunds are manual (bank transfer back) and are recorded as
  **organization deactivation**, not a status: no `REFUNDED` value in the MVP.
- The row is created when the owner picks a plan, so `UNPAID` exists before money moves.
  `orderId` keeps its unique constraint and becomes the **payment code** the customer writes in
  the transfer note (server-generated, e.g. `BJ-7F3KQ2`). Renaming the column is churn for no gain.
- **Only `PAID` grants access.** `WAITING_VERIFICATION` and `REJECTED` grant nothing.
- Verification is a Super Admin action that creates or extends the Subscription using the existing
  A13 rules (`max(now, currentPeriodEnd)` for same-plan renewal, immediate start for an upgrade).
  `Subscription.subscriptionPaymentId` now points at the manual payment.
- `REJECTED` keeps the same row: the owner re-uploads, the row returns to `WAITING_VERIFICATION`.
  No new rows per attempt. Keep `verifiedAt/verifiedByUserId` and `rejectedAt/rejectedByUserId`.
- Both confirmation paths (receipt upload, WhatsApp) set `WAITING_VERIFICATION`. Both are
  idempotent; either alone is enough. The WhatsApp button also opens `wa.me/6281319535441` with
  the payment code, plan and amount pre-filled.

### Platform admin
- `User.platformRole PlatformRole?` enum `{ SUPER_ADMIN }`. **Not** a `MemberRole`: a tenant role
  would put the admin inside an organization. A Super Admin has no `Member` row and no
  `organizationId`.
- Super Admin may: verify/reject payments, set a Custom org's `operatorLimit`, activate/deactivate
  an organization. May read: org name, owner name/email, payments, receipts. **May not** read
  `File`, KTP, transactions or reports of any tenant — enforced structurally: no admin module
  imports `prisma.file`/`prisma.transaction`, tenant routes' `requireRole` excludes
  `platformRole != null`, and a unit test asserts the imports. RLS remains the safety net.
- Deactivation sets `Organization.isActive = false`: owner sees the locked screen, operators are
  refused at sign-in, history untouched.

### Receipts
- Stored under `var/receipts/<paymentId>/` (outside `public/`, never statically served). DB keeps
  path, mime, size, uploader. Max 5 MB, `image/jpeg|png|pdf`, verified by magic bytes, not by
  extension or the client header.
- Served only by `GET /api/payments/[id]/receipt`, authorized: owner of that payment's
  organization, or a Super Admin. No public URL. If a page needs headerless `<img>` loading, it
  gets a 5-minute HMAC token; otherwise no token at all.
- **Retention:** images deleted 90 days after `verifiedAt`; the payment row keeps amount, dates,
  status, verifier. `scripts/prune-receipts.ts` runs opportunistically whenever a Super Admin
  opens the verification queue, and from cron on the VPS. The Privacy Policy may only claim
  deletion once the script exists.

### Bank details and public identity
- `BANK_NAME`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_NAME` in env, rendered **only** on the locked
  subscribe screen for a signed-in owner. Never on the landing page, never in an email.
  Missing env → the screen shows the WhatsApp path only, and logs; it never renders a blank
  account field.
- Public footer: "Zidan Ferdiansyah, Kab. Bekasi, Jawa Barat", email, WhatsApp. No street, no
  NPWP. `docs/landing-copy-id.md:61` drops the street line before that file is committed.

### Removals (do not leave a half-wired gateway)
`src/lib/midtrans.ts`, `src/lib/midtrans.test.ts`, `src/app/api/midtrans/`, `MIDTRANS_*` in
`.env.example`, README mentions, and `demo.sh`'s notification-URL output. One payment module with
one implementation (manual). No stub interface for a gateway we do not call.

### Milestones after this ruling
- **M2** = manual payment module + Super Admin console (verification queue, org deactivation,
  Custom limit). Midtrans integration is gone from M2 and M9.
- **M3** = berkas pages (in progress, unchanged).
- **M9** = "local demo package": the client is walked through it on this machine or through a
  Quick Tunnel, with the manual payment loop. VPS, domain, SSH deferred.

## A21. Verification promise: "maksimal 1 hari kerja" (CEO, client-confirmed)

- **One string, three places:** locked subscribe screen, FAQ, Terms — identical wording
  ("maksimal 1 hari kerja"), plus one line: a payment sent on a Saturday, Sunday or national
  holiday is processed by the end of the next working day. Designer writes it; nobody paraphrases.
- **Working day = Monday–Friday, excluding national holidays.** The MVP does not compute a
  holiday calendar: the copy states the rule, and nothing in the code counts working days.
- **Queue order (M2):** `WAITING_VERIFICATION` sorted oldest first, so the payment closest to
  breaking the promise is at the top. Show the submitted time (WIB) and its plain age ("2 hari
  lalu"); no working-day arithmetic. No auto-refund, no auto-escalation — the promise is a human
  commitment, the queue is its reminder.
- **Breach = refund conversation**, so the queue exists before the copy ships. If the screen says
  "maksimal 1 hari kerja" while there is no queue, the promise is unkeepable by construction.
- Bank details live only in the build machine's `.env` (`BANK_NAME`, `BANK_ACCOUNT_NUMBER`,
  `BANK_ACCOUNT_NAME`); `.env.example` keeps `0000000000`. Never in a commit, log, or thread.

## A22. Backup destination and key custody closed; address closed; console email (CEO)

**Supersedes A15's key sentence** ("the client keeps one copy, Jihann keeps one sealed copy"). CEO
ruling: the client holds the only key; **no agency copy survives handover**.

- **Backup:** encrypted daily `pg_dump -Fc` to a dedicated folder in the client's Google Drive
  (`zidanferdi13@gmail.com`), 30-day retention, `rclone` as the transport.
- **Key:** the client generates the passphrase-protected keypair and keeps it in two places
  (password manager or PIN-protected note, plus one printed copy). The build machine and the VPS
  hold **only the public key** — they can encrypt, never decrypt. Restore tests are run with the
  client's copy.
- **Address:** closed — "Zidan Ferdiansyah, Kab. Bekasi, Jawa Barat", email, WhatsApp. No street,
  no NPWP. Not an open item.
- **Email:** console channel accepted for the local phase. **Launch gate:** before the first
  paying customer, real email is required — a password reset that only prints to a console is not
  a delivered reset. Resend key stays a drop-in env var.

**What is still open is implementation, not the decision.** `scripts/backup.sh` does not exist yet
(`scripts/` holds only `demo.sh`), and the QA plan has no backup or restore check. Criterion #7
stays unproven until both exist.

**Local-phase scope call.** Drive delivery needs an `rclone` remote authorized against the client's
Google account — a client-side consent step. Until it exists, the backup runs to a local directory
and the Drive leg is documented, not demonstrated. Recommendation: take the consent once, while
the demo machine is the system of record, so criterion #7 is shown working with a timed restore
instead of promised for deploy day. If the client declines, criterion #7 becomes a deploy-time
item and I say so to the CEO rather than marking it done.

## A23. Designer §13–§17 accepted; ownership enum closed at four values (CEO)

**OwnershipType is closed at four values** — `PERORANGAN`, `BADAN_USAHA`, `PEMERINTAH`, `YAYASAN`
(CEO 2026-11-02). Designer writes the two new labels into §17; the same label appears on all
four surfaces (form select, detail view, list filter, export column). Default stays Perorangan.
Developer adds the two values in **migration 7** (migration 6 is `subscriptionPaymentId`).

**Surat Jalan prints the full NIK** — supersedes A17's "masked pending CEO" and the same sentence
at `ui-strings-id.md:304`. KTP masking in lists and logs is unchanged; the printed document is the
customer's own KTP shown to the customer.

**Promise is one pair of keys, imported, never retyped.** `promise.core` + `promise.weekend` are
defined once in `src/lib/ui-strings.ts` and referenced by the subscribe screen, FAQ #1 and
`/syarat-ketentuan` (which does not exist yet). `grep -rn "maksimal 1 hari kerja" src` must match
the definition only — not a JSX literal, not a second copy.

**Landing wiring.** `src/lib/landing-copy.ts:58,109,113` still carry the Midtrans claims; they are
rewired from §13 in the same commit as the A20 deletions. Until Designer's `feat4`/`faq2` text is
wired, QA's false-claim exemption for those lines stands.

**`co.failed` is dead copy.** No gateway exists to produce a failed payment, so the key stays in
the doc and must not be wired. `co.upgradeNote` changed to "setelah bukti transfer diverifikasi".

**`lock.*` becomes `sub.*`.** Same text, new key names, §15 states. `dashboard/owner/page.tsx:24-26`
is Developer's change; a stale `UI.lock.*` reference fails typecheck, which is the desired outcome.

**One open payment per organization.** Pressing "Ganti paket" while a payment is `UNPAID` replaces
that row in place — same payment code, new plan, no second row. `WAITING_VERIFICATION` cannot be
changed: verify or reject it first. This keeps the transfer note unambiguous for the verifier.

## A24. Owner works by holding a seat; legal copy gates (CEO 2026-11-02)

**Seats.** `operatorLimit` counts `Operator` rows with `isActive = true`. The owner who works
holds one of those rows. Basic therefore yields **one worker total**, owner or staff, never both.
Provisioning is the system's job: on activation, an idempotent step creates the owner's `Operator`
row (same transaction as the subscription, `memberId` = the owner's member, `email` = owner email),
so a freshly activated Basic organization can record a berkas without anyone freeing a seat first.

**Permission follows the seat, not the role.** Creating or editing a berkas requires an active
`Operator` row belonging to the session user. `POST /api/files` and `PATCH /api/files/[id]` must
check that row, not `MemberRole`. An owner whose row is inactive is read-only: they still list and
open files (viewing reports never costs a seat) and the edit action is unavailable. The owner may
deactivate their own row to hand the seat to staff; that is the supported hand-off, and it is why
the write guard cannot be a role check.

**Attribution.** `File.operatorId` stays non-null. The owner's berkas point at the owner's own
`Operator` row, so M4 revenue attribution needs no change.

**Downgrade.** The owner chooses which rows keep seats; the owner keeps theirs if they work.

**Legal copy.** `docs/legal-id.md` is the CEO-approved source for `/kebijakan-privasi` and
`/syarat-ketentuan`. Both pages are built in M5, linked from the footer and asserted in the
register flow, and must exist before the first paying customer. Placement is verbatim; the
`[BLOCKED]` bullet in §1.4 does not ship until `scripts/delete-org-data.ts` exists.

**Claims in the legal copy that the code must satisfy before those pages ship** (A11: no claim
without implementation):
- §1.1 lists "nomor WhatsApp" as collected account data. No such column exists; either add it to
  registration or delete the item.
- §1.4 promises 12 months of retention after the subscription ends. Nothing prunes or preserves on
  that schedule; reword to what the system does, or implement it.
- §1.6 says each organization's data is separated "di tingkat basis data". There is no row-level
  security in the migrations; the true statement today is per-request scoping in the server layer,
  plus the RLS A20 asks for. Do not publish the database-level claim before RLS is applied.
- §1.6 also describes encrypted daily backups. `scripts/backup.sh` does not exist (A22); the
  sentence ships only once it runs on the VPS.
- §2.4 step 4 is a paraphrase of the promise, not the promise. It must render `promise.core` and
  `promise.weekend` by import, like the other two locations.
- One WhatsApp number constant for the whole product: the legal identity block shows
  0813-1953-5441 while the landing page uses 081319535441.

**Resolved by CEO (legal-id.md v2, 2026-11-02):** WhatsApp number removed from §1.1; retention
reworded to "while active, then until deletion is requested"; the database-level sentence is held
until RLS is applied; backup claim kept, and both legal pages go public only after
`scripts/backup.sh` has run once (gates production, not the local demo); §2.4 step 4 imports the
promise keys. Canonical number `081319535441`, `wa.me` uses `6281319535441`.

## A25. Subscription lifecycle: `SUPERSEDED` means replaced by an upgrade (PM 2026-11-02)

`SubscriptionStatus` gains `SUPERSEDED` in its own additive migration
(`9_subscription_superseded`, `ALTER TYPE ... ADD VALUE` only, no data statement), matching how
migration 7 added the ownership values. PG cannot use a new enum value in the transaction that
adds it, so the value is referenced by application code only, never by migration SQL.

| Transition | Prior row | New row |
|---|---|---|
| Renewal (same plan) | extended in place, `ACTIVE` | none |
| Upgrade | `ACTIVE` → `SUPERSEDED` | one `ACTIVE` row |
| Downgrade at period end | `ACTIVE` → `CANCELED` | one `ACTIVE` row |
| Verification of a lapsed org | lapsed `ACTIVE` → `UNPAID`; other rows untouched | one `ACTIVE` row |

`Subscription_one_active_per_org` (partial unique on `status = 'ACTIVE'`, migration 4) is checked at
insert, so the prior `ACTIVE` row is closed **before** the new one is inserted, in that order, inside
the verification transaction.

A row still marked `ACTIVE` after its period ended is not superseded — nothing replaced it, it
expired — so it becomes `UNPAID` before the new row is inserted. `SUPERSEDED` therefore always means
"replaced while still entitled", which is what makes it safe to read as retained revenue.

`CANCELED` stays reserved for customer-initiated termination. Retention reporting excludes
`CANCELED`, `SUPERSEDED` and `UNPAID` from "active"; churn counts `CANCELED` only. An upgrade is
retained revenue, not churn, and M4 must not blur the two.

**Demo data:** the seeded organization is PRO (limit 3) with a Rp249.000 PRO payment, because A5/A24
give Basic one worker total and the demo needs an owner plus a staff operator. Demo data only; prices
are unchanged.
