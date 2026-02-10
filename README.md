# Meridian 💰

A sophisticated personal finance tracker with an elegant, wealth-management inspired design.

## Features

- 📊 **Dashboard** - Net worth, monthly income/expenses, savings rate
- 💳 **Multi-currency Accounts** - Checking, savings, investments, credit cards, mortgages
- 📝 **Transaction Tracking** - Manual entry and CSV import
- 🔄 **Recurring Transactions** - Track subscriptions and regular payments
- 🏠 **Mortgage Calculator** - Amortization schedules and payoff tracking
- 📈 **Reports** - Spending trends and category breakdowns

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: SQLite + Drizzle ORM
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Fonts**: Cormorant Garamond (display) + DM Sans (body)

## Getting Started

```bash
# Install dependencies
npm install

# Run database migrations
npx drizzle-kit push

# Seed default categories
npx tsx src/db/seed.ts

# Start development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Project Structure

```
meridian/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── accounts/        # Account management
│   │   ├── transactions/    # Transaction tracking
│   │   ├── import/          # CSV import wizard
│   │   └── page.tsx         # Dashboard
│   ├── components/          # React components
│   │   ├── layout/          # Sidebar, navigation
│   │   └── ui/              # shadcn/ui components
│   ├── db/                  # Database schema and connection
│   │   ├── schema.ts        # Drizzle schema
│   │   ├── index.ts         # DB connection
│   │   └── seed.ts          # Default data
│   └── lib/                 # Utilities and server actions
│       ├── actions.ts       # Server actions (CRUD)
│       └── utils.ts         # Helper functions
├── data/                    # SQLite database files
├── drizzle/                 # Generated migrations
└── drizzle.config.ts        # Drizzle configuration
```

## Database Schema

- **accounts** - Financial accounts with balances
- **transactions** - Income and expense records
- **categories** - Transaction categorization
- **recurring_rules** - Subscription tracking
- **mortgages** - Loan amortization data
- **exchange_rates** - Multi-currency support
- **settings** - User preferences

## Design System

Refined wealth-management aesthetic:
- Deep navy (`#0A1628`) with gold accents (`#C9A227`)
- Elegant serif headings (Cormorant Garamond)
- Clean sans-serif body (DM Sans)
- Dark mode by default
- Subtle animations and hover states

## UI Guidelines

**No popups or modal dialogs.** They interrupt user flow and are considered poor UX.

**Inline forms must be well-placed:**
- Forms should appear in their own section, NOT crammed into card headers
- Place "Add" forms at the bottom of the list they're adding to
- Use a subtle "+" button or link, form expands below it
- Give forms breathing room with proper padding and spacing

Instead of dialogs, use:
- Inline forms that expand/collapse in appropriate locations
- Dedicated pages for complex workflows
- Toast notifications for confirmations

## License

MIT
