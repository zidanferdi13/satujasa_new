# Biro Jasa Management Platform

A multi-tenant SaaS platform for Biro Jasa (service bureaus) to manage vehicle document services (STNK, Plate, Registration, SIM) with role-based dashboards, subscription billing via Midtrans, and revenue tracking.

## Tech Stack

- **Frontend/Backend**: Next.js 16 App Router + TypeScript
- **UI**: shadcn/ui + Tailwind CSS v4
- **Database**: PostgreSQL 17 (local cluster for development, client VPS in production)
- **ORM**: Prisma
- **Auth**: NextAuth.js v5
- **Payments**: Midtrans (Core API + Snap UI)
- **PDF**: PDFKit
- **Excel**: xlsx (SheetJS)
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 17 (local cluster; `scripts/demo.sh` creates a throwaway one on port 5433)
- Midtrans account (sandbox for development)

### Demo environment

```bash
scripts/demo.sh                                   # recreate + seed the demo database
scripts/demo.sh https://xyz.trycloudflare.com     # ...and print AUTH_URL/APP_URL for a tunnel
```

Demo logins: `owner@demo.test` / `operator@demo.test`, password from `DEMO_PASSWORD` (default `demo1234`).
All personal data in the seed is invented (KTP `3200…`, plates ending `DEMO`).

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your database URL and other configuration.

4. Initialize the database:
   ```bash
   pnpm prisma migrate dev
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Authentication pages (login, register)
│   ├── (dashboard)/      # Protected dashboard pages
│   │   ├── owner/        # Owner dashboard
│   │   └── operator/     # Operator dashboard
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth + registration
│   │   ├── subscription/ # Midtrans integration
│   │   ├── owner/        # Owner API endpoints
│   │   ├── operator/     # Operator API endpoints
│   │   └── ...
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/
│   ├── layout/           # Layout components (sidebar, header)
│   ├── providers/        # Context providers
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Utility functions
└── types/
    └── next-auth.d.ts    # NextAuth type extensions
```

## Database Schema

The Prisma schema is located at `prisma/schema.prisma`. Key models:

- `User` - Authentication
- `Organization` - Multi-tenant organizations
- `Member` - User-organization relationships with roles
- `Operator` - Organization operators
- `File` - Document files (STNK, SIM, etc.)
- `Transaction` - Payment transactions
- `Subscription` - Subscription plans
- `ActivityLog` - Audit logging

## Authentication

NextAuth v5 is configured with:
- Credentials provider (email/password)
- JWT session strategy
- Organization and role injection into session

## Multi-Tenancy

- Shared schema with `organizationId` on tenant-scoped tables
- Prisma middleware for query filtering
- PostgreSQL Row-Level Security (RLS) as safety net

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm prisma generate` - Generate Prisma Client
- `pnpm prisma migrate dev` - Run migrations

## Environment Variables

See `.env.example` for required variables.

## License

Private - All rights reserved
