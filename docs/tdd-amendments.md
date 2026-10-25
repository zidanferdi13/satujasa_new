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

**Database.** Demo: local PostgreSQL 17.11 on the demo machine (localhost-only, port 5432),
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
