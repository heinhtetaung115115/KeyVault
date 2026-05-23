# KeyVault v2 — Self-Hosted Digital Goods Store

A fully self-hosted Next.js store for selling digital keys, gift cards, and codes. Replaces the Digiseller affiliate model with your own **Supabase** database, **Stripe** (cards), and **NOWPayments** (crypto).

---

## Features

- **Storefront**: Dark/light theme, EN/RU localization, category chips, sort tabs, trust badges, product cards, search
- **Admin Dashboard** (`/admin`): Create/edit products, upload keys in bulk, manage orders, deliver content manually
- **Auto-delivery**: Pre-uploaded keys are instantly delivered after payment (race-safe with `FOR UPDATE SKIP LOCKED`)
- **Manual delivery**: Admin delivers content through the dashboard after payment
- **Stripe Checkout**: Visa/Mastercard via Stripe Checkout sessions
- **NOWPayments**: Crypto payments via invoices
- **Buyer Order Page** (`/order/[id]`): Shows delivered keys/codes after payment, with copy button
- **Order Lookup** (`/orders`): Buyers find orders by email
- **Stock Tracking**: Auto-decrements on sale, shows stock count on cards

---

## Architecture

```
app/
├── api/
│   ├── categories/route.js     GET  — list categories
│   ├── products/route.js       GET  — list products (filter, search, sort)
│   ├── product/route.js        GET  — single product details
│   ├── checkout/route.js       POST — create Stripe/crypto checkout
│   ├── orders/route.js         GET  — order lookup by email or ID
│   ├── webhook/
│   │   ├── stripe/route.js     POST — Stripe payment webhook
│   │   └── nowpayments/route.js POST — NOWPayments IPN webhook
│   └── admin/
│       ├── products/route.js   CRUD — manage products
│       ├── keys/route.js       CRUD — upload/manage keys
│       ├── orders/route.js     GET  — all orders
│       └── deliver/route.js    POST — manual delivery
├── components/
│   ├── StoreContext.js         Cart, theme, locale state
│   ├── Header.js               Sticky header with search
│   ├── ProductCard.js          Product grid card
│   ├── ProductModal.js         Product detail modal
│   ├── CartDrawer.js           Slide-out cart
│   ├── Toast.js                Notifications
│   ├── Footer.js               Site footer
│   └── Skeletons.js            Loading skeletons
├── lib/
│   ├── supabase.js             Supabase client/admin
│   ├── i18n.js                 EN/RU translations
│   └── admin-auth.js           Admin password auth
├── order/[id]/page.js          Buyer order page
├── orders/page.js              Order lookup page
├── admin/page.js               Admin dashboard
├── globals.css                 Styles + dark/light theme
├── layout.js                   Root layout
└── page.js                     Homepage
```

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd keyvault
npm install
```

### 2. Create Supabase database

1. Go to [supabase.com](https://supabase.com) → your project → SQL Editor
2. Paste and run the contents of `supabase-schema.sql`
3. This creates all tables, indexes, the `claim_key()` function, and seed categories

### 3. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (keep secret!) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks |
| `NOWPAYMENTS_API_KEY` | NOWPayments → API Keys |
| `NOWPAYMENTS_IPN_SECRET` | NOWPayments → IPN Settings |
| `ADMIN_PASSWORD` | Choose a strong password |
| `NEXT_PUBLIC_STORE_URL` | Your deployed URL |

### 4. Set up webhooks

**Stripe:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhook/stripe`
3. Listen for: `checkout.session.completed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

**NOWPayments:**
1. Go to NOWPayments → IPN Settings
2. Set callback URL: `https://your-domain.com/api/webhook/nowpayments`
3. Copy your IPN secret to `NOWPAYMENTS_IPN_SECRET`

### 5. Run locally

```bash
npm run dev
```

Visit:
- Store: http://localhost:3000
- Admin: http://localhost:3000/admin

### 6. Deploy to Vercel

```bash
npx vercel
```

Add all environment variables in Vercel Dashboard → Settings → Environment Variables.

---

## Usage

### Admin Workflow

1. Go to `/admin` and log in with your `ADMIN_PASSWORD`
2. **Products tab**: Create products with name, price, image, category, delivery type
3. **Keys tab**: Select a product → paste keys (one per line) → upload
4. **Orders tab**: View all orders, filter by status, manually deliver content for manual-delivery products

### Purchase Flow

1. Buyer browses store → clicks product → enters email
2. Chooses payment: Card (Stripe) or Crypto (NOWPayments)
3. Redirected to payment page
4. After payment, webhook fires:
   - **Auto-delivery**: Key is atomically claimed and delivered
   - **Manual delivery**: Order marked as "paid", admin delivers later
5. Buyer sees delivered content at `/order/[id]`
6. Buyer can also look up all orders at `/orders` by email

---

## License

MIT
