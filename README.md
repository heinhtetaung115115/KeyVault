# KeyVault — Digiseller Storefront

A custom Next.js storefront for selling digital keys and gift cards via the **Digiseller affiliate program**. Connects to the Digiseller API for real product data, categories, and payment processing.

---

## Quick Start

### 1. Install dependencies

```bash
cd keyvault
npm install
```

### 2. Configure your Digiseller credentials

Edit `.env.local` and fill in your real values:

```env
DIGISELLER_SELLER_ID=123456          # Your seller ID
DIGISELLER_API_KEY=YOUR_API_KEY      # Your API key
DIGISELLER_AFFILIATE_ID=123456       # Your affiliate ID (usually same as seller ID)
NEXT_PUBLIC_STORE_NAME=KeyVault      # Your store name
NEXT_PUBLIC_STORE_TAGLINE=Instant digital keys at the best prices
NEXT_PUBLIC_CURRENCY=USD
NEXT_PUBLIC_CURRENCY_SYMBOL=$
```

**Where to find your credentials:**
- Seller ID → https://my.digiseller.com/inside/my_info.asp
- API Key → https://my.digiseller.com/inside/api_keys.asp

### 3. Run the development server

```bash
npm run dev
```

Open http://localhost:3000 — your store is live!

---

## Project Architecture

```
keyvault/
├── app/
│   ├── api/                      # Server-side API routes (proxy to Digiseller)
│   │   ├── token/route.js        #   GET  /api/token — get auth token
│   │   ├── categories/route.js   #   GET  /api/categories — shop categories
│   │   ├── products/route.js     #   GET  /api/products — product listing
│   │   ├── product/route.js      #   GET  /api/product?id=X — product details
│   │   ├── checkout/route.js     #   POST /api/checkout — generate payment URL
│   │   └── webhook/route.js      #   POST /api/webhook — Digiseller sale notifications
│   ├── components/
│   │   ├── StoreContext.js       #   Cart state management (React Context)
│   │   ├── Header.js             #   Sticky header with search + cart
│   │   ├── ProductCard.js        #   Product grid card
│   │   ├── ProductModal.js       #   Product detail modal with reviews
│   │   ├── CartDrawer.js         #   Slide-out cart with checkout
│   │   ├── Toast.js              #   Notification toast
│   │   ├── Footer.js             #   Site footer
│   │   └── Skeletons.js          #   Loading skeleton components
│   ├── lib/
│   │   └── digiseller.js         #   ★ Core Digiseller API client (SERVER-SIDE ONLY)
│   ├── globals.css               #   Global styles + Tailwind
│   ├── layout.js                 #   Root layout
│   └── page.js                   #   Home page
├── .env.local                    # Your credentials (DO NOT COMMIT)
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## How It Works

### Data Flow

```
Browser (React)  →  Next.js API Routes  →  Digiseller API
                        ↓
                  Your API key stays
                  on the server (safe)
```

1. **Frontend** makes requests to your own `/api/*` routes
2. **API routes** authenticate with Digiseller using your API key (server-side only)
3. **Digiseller API** returns product data, which is normalized and sent to the frontend
4. **Payment** redirects the buyer to Digiseller's checkout page
5. **Webhook** notifies your server when a sale completes

### Key API Endpoints

| Your Route | Digiseller API | Purpose |
|---|---|---|
| `GET /api/categories` | `GET /categories` | Fetch shop categories |
| `GET /api/products` | `POST /seller-goods` | List all products |
| `GET /api/products?category_id=X` | `GET /shop/products` | Products by category |
| `GET /api/products?search=X` | `GET /shop/search` | Search products |
| `GET /api/product?id=X` | `GET /products/{id}/data` | Product details + reviews |
| `POST /api/checkout` | (generates URL) | Creates Digiseller payment link |
| `POST /api/webhook` | (incoming from Digiseller) | Sale notification handler |

---

## Purchase Flow

1. Customer browses your store and clicks **"Buy now"** or **"Add to cart → Checkout"**
2. Your app generates a Digiseller payment URL with your affiliate ID
3. Customer is redirected to `digiseller.market/asp2/pay.asp?id_d=PRODUCT&ai=YOUR_ID`
4. Customer pays through Digiseller (credit card, PayPal, crypto, etc.)
5. Digiseller delivers the digital product to the buyer
6. Your `/api/webhook` receives a sale notification
7. You earn your affiliate commission

---

## Configuration

### Webhook Setup

After deploying, set up the webhook in your Digiseller dashboard:

1. Go to https://my.digiseller.com/inside/notify_settings.asp?view=url
2. Set the URL to: `https://your-domain.com/api/webhook`
3. Save

### Adding Custom Pages

Create new pages in the `app/` directory following Next.js App Router conventions:

```
app/
├── about/page.js       →  /about
├── faq/page.js         →  /faq
├── contact/page.js     →  /contact
├── product/[id]/page.js →  /product/123  (dynamic product page)
```

### Customizing the Design

- **Colors/fonts**: Edit CSS variables in `app/globals.css` and `tailwind.config.js`
- **Layout**: Modify components in `app/components/`
- **Store name/tagline**: Change values in `.env.local`

---

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Add your environment variables in the Vercel dashboard under Settings → Environment Variables.

### Other Platforms

Works on any Node.js host: Railway, Render, DigitalOcean, AWS, etc.

```bash
npm run build
npm start
```

### Digiseller Free Domain

If Digiseller gave you a free domain, you can point it to your deployed site by updating DNS settings or using a reverse proxy.

---

## Extending the Store

### Ideas for next steps:
- **Product detail pages** (`/product/[id]`) — full SEO-friendly pages
- **User accounts** — track order history
- **Promo codes** — use Digiseller's discount API
- **Telegram bot** — notify yourself on sales
- **Analytics** — add Google Analytics or Plausible
- **Multi-language** — Digiseller API supports locales
- **Custom categories** — organize products your own way

### Digiseller API Reference

Full documentation: https://my.digiseller.com/inside/api.asp

Key sections:
- **Authentication**: `/apilogin` (token-based, SHA256 signing)
- **Products & Categories**: `/categories`, `/shop/products`, `/products/{id}/data`
- **Payment**: `/asp2/pay.asp` (redirect-based)
- **Statistics**: `/seller-last-sales`, `/seller-sells`
- **Webhooks**: Sale notifications via POST to your URL

---

## License

MIT — free to use for your Digiseller store.
