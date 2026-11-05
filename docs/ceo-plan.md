# Rencana Induk — Biro Jasa Management Platform

The CEO's plan, in one place, with a pointer to the ruling that carries each decision in detail.
Rulings live in `docs/tdd-amendments.md` (A1–A27); this file is the index and the narrative, not a
second source of truth. Where the two ever disagree, the amendment wins.

Owner of this plan: CEO (Thread 2). Maintained by: Project Manager (Thread 3).
Client: Zidan Ferdiansyah, perorangan, Kab. Bekasi, Jawa Barat.
Status line: **2026-11-05 — M4 closed at `a9643d9`, M5 items 8 and 9 passed, prices confirmed by the
client, item 7 blocked on the client.**

---

## 1. What is being built

A multi-tenant SaaS for Indonesian service bureaus (*biro jasa*): berkas intake (STNK, plate,
mutasi, SIM), operators, per-operator revenue, printable Surat Jalan, subscription billing, data
export. Indonesian UI only, light mode only, one codebase serving many bureaus.

**In scope for the first handover:** the nine demo items in §7, nothing else.

**Explicitly out of scope, and said out loud to the client:**

- no online payment gateway — manual bank transfer verified by a Super Admin is deliberate (A20)
- no domain, no VPS: it runs on the build machine until he approves
- no live email — a password reset prints to the console until a Resend key exists (A22)
- no mobile app, no printing integration, no SAMSAT API

## 2. Money and time

| | |
|---|---|
| Budget | one-time **Rp 1.000.000** |
| Spent | **Rp 0** — every dependency is open source, everything runs locally |
| Original target | one month, **22 November 2026** |
| Actual review window | **23–27 November 2026** — 1–5 days late, stated as late |

The slip is the cost of what Zidan asked for after the first plan: manual transfer with Super Admin
verification replaced the gateway, deployment moved local-first, and four ownership types plus the
receipt-upload flow came in. Recorded rather than dressed up (A27).

## 3. Pricing — locked

| Plan | Price | Operators |
|---|---|---|
| Basic | **Rp 99.000 / bulan** | 1 |
| Pro | **Rp 249.000 / bulan** | 3 |
| Custom | "Hubungi Kami" → WhatsApp | provisioned manually by the Super Admin |

Monthly billing only. **No free trial. No proration. No downgrade while a higher plan is active.**
Only the CEO may change these numbers.

**Confirmed by Zidan on 2026-11-05** — a day before the deadline, and final. The landing page, the
locked screen and the transfer instructions all carry these two figures; there is no second price
table anywhere in the product.

## 4. How a customer pays

Register → locked screen with BCA details, a payment code and the "maksimal 1 hari kerja" promise →
upload the transfer receipt (or send it by WhatsApp) → the Super Admin verifies in the console → the
plan activates. **No access before payment** (A12, A21). The locked screen promises exactly one thing
it can keep: data stays stored and exportable even when the subscription is not active.

Receipts are served through signed temporary links, deleted 90 days after verification, with the
payment row kept. No public URL, ever.

## 5. Revenue — one definition, two appearances

- Per-operator revenue = Σ (`finalPrice` − `samsatPayment`) over that operator's berkas, in the period.
- Owner total = the same sum across all operators, the owner's own berkas included.
- Period is cash-basis on `pickedUpAt`, Jakarta month.
- `serviceFee` and `revenue` are the same number per file; if they differ, that is a bug.
- Counts — operators, berkas, seats — are **never** formatted as rupiah. (A1, A26)

## 6. Seats and permission

Seats count active `Operator` rows, and **the working owner holds one**. Basic alone = the owner's row
in the single seat, no staff. Pro = owner + 2 staff, or 3 staff with the owner reading reports.
Viewing never costs a seat. **Permission follows the seat, not the role:** a seatless owner reads
everything and writes nothing, with a banner that names the fix. (A24)

## 7. The demo gate — nine items, no exclusions

Zidan approves against behaviour, not screenshots:

1. Indonesian landing page, real prices, no gateway mention, "Hubungi Kami" → his WhatsApp.
2. Register → locked screen with BCA details, payment code, and the 1-working-day promise. No access before payment.
3. Upload receipt or WhatsApp → Super Admin verifies → plan active. **He does it himself in the console.**
4. Basic, working alone: a berkas end to end — customer data, jenis jasa, estimated price, 50% DP, status changes, **Surat Jalan printed with the full NIK**, final SAMSAT price, total including jasa.
5. Revenue: per-operator figure plus owner total = total paid − SAMSAT cost, and no other number appears.
6. Seats: add up to the limit, refuse past it, removing frees one.
7. Backup: a nightly encrypted file exists **and one restore has actually been performed**.
8. Legal pages: identity line only, no home address, no NPWP field.
9. Export: his own data leaves the system in a usable file.

**A gate that grows exclusions every time a feature slips is not a gate.** The date moved instead of
the gate. If any of items 1–9 fails, the demo is not approved and that is recorded.

## 8. Schedule of record (A27)

| Date | What Zidan owes | If it slips |
|---|---|---|
| Fri 6 Nov | Price confirmation | Missing confirmation = approved as shipped |
| Fri 13 Nov | The review day inside 23–27 Nov | The window moves; said on the day |
| Fri 20 Nov | Drive access + 15-minute key handover | Demo holds; **item 7 shown OPEN**, legal pages stay unpublished |

Internal milestones: M0–M3 passed; M4 (per-operator revenue + Surat Jalan) code-passed, closing on the
BUG-19 fix; M5 (export, legal pages, backup restore, polish) two of four items built.

## 9. Publication gate

The legal pages are built and linked on the build machine, because nothing there is public.
**"Published" means reachable at a domain on Zidan's VPS, and that happens only after he approves the
review.** If `scripts/backup.sh` has not run and a restore has not been performed by then, deployment
waits — the demo does not. Nothing false reaches the public.

Backup key custody is closed: the key never sits on the same Drive as the backups, the VPS never holds
the private key next to the dumps, **no agency copy is kept after handover** (A22).

## 10. Standing rules the team works under

- Only the CEO talks to Zidan. Anything going to him gets CEO approval first.
- The PM never writes production code and never changes a business requirement alone.
- Only the PM assigns bug numbers. Only the PM confirms hashes, in Thread 3.
- QA tests one exact commit from a clean archive; no pushes during a test; redirects verified in a browser.
- Indonesian copy comes only from Designer (`docs/ui-strings-id.md`); legal copy only from the CEO
  (`docs/legal-id.md`). Developer never edits copy.
- No secrets in the repo, in a log, or in a thread. `.env.example` keeps the `0000000000` placeholders.
- Demo and tunnel use fake personal data only (PDP, UU 27/2022).
- No dead links anywhere: footer, CTA, sidebar (A19).

## 11. Where everything lives

| Question | File |
|---|---|
| Why is it built this way? Every ruling, numbered | `docs/tdd-amendments.md` (A1–A27) |
| This file — the plan, the gate, the dates | `docs/ceo-plan.md` |
| Indonesian UI copy, verbatim | `docs/ui-strings-id.md` (§12a–§19) |
| Legal text, rendered only where block-quoted | `docs/legal-id.md` |
| Landing page copy | `docs/landing-copy-id.md` |
| Demo runbook and database guard | `scripts/demo.sh` |
| Nightly encrypted backup | `scripts/backup.sh` |
| QA milestone test plans | `~/.hermes/qa/qa-milestone-test-plans.md` (QA's file) |

## 12. Decision index

| # | Decision |
|---|---|
| A1 | Revenue formula: biaya jasa = income, never subtracted |
| A2 | Terminology, Indonesian product language |
| A3 | Money is whole rupiah (`Int`) |
| A4 | Operator identity — variant A |
| A5 | Owner-as-operator |
| A6 | Auth — no token-trusted role |
| A7 | Password reset |
| A8 | Hosting — replaces the Netlify plan |
| A9 | Uptime expectations |
| A10 | Test process |
| A11 | Legal pages and their third promise location |
| A12 | No access without payment; export survives a lapse |
| A13 | Subscription periods |
| A14 | Access checks that follow from A12/A13 |
| A15 | Demo database, tunnel, off-box backups |
| A16 | UI strings and display rules |
| A17 | Berkas rules (masking, terminal statuses, owner's own full KTP) |
| A18 | Refunds and stale orders |
| A19 | Locked-screen CTAs, seed password guard, no dead links |
| A20 | Manual transfer replaces Midtrans; bank details only in local `.env` |
| A21 | "maksimal 1 hari kerja" verification promise |
| A22 | Backup destination and key custody; address closed; console email |
| A23 | Ownership enum closed at four values; full NIK on Surat Jalan |
| A24 | Owner works by holding a seat; permission follows the seat |
| A25 | `SUPERSEDED` vs `CANCELED`; lapsed `ACTIVE` → `UNPAID` |
| A26 | Revenue's one definition; the Surat Jalan carries no money |
| A27 | Demo schedule of record and client-side dates |

## 13. Open items as of 2026-11-05

- **Item 7** — backup run and restore: needs Zidan's Drive destination and the key handover by **20 Nov**.
- **Item 9** — export built; awaiting QA and the empty-range fix.
- **Item 8** — legal pages built; publication waits for deployment.
- **Client** — prices confirmed 5 Nov (closed); review day by **13 Nov**; Drive and key handover by **20 Nov**.
- **Polish** — last, and the first thing to give up if a date gets tight.
