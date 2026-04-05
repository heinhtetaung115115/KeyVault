/**
 * Digiseller API Client
 * 
 * Server-side only — never import this in client components.
 * Handles authentication, token management, and all API calls.
 * 
 * API Docs: https://my.digiseller.com/inside/api.asp
 * API Base: https://api.digiseller.ru/api/
 */

const crypto = require("crypto");

const API_BASE = "https://api.digiseller.ru/api";
const SELLER_ID = process.env.DIGISELLER_SELLER_ID;
const API_KEY = process.env.DIGISELLER_API_KEY;
const AFFILIATE_ID = process.env.DIGISELLER_AFFILIATE_ID || SELLER_ID;

// ─── Token Cache ───
// Tokens are valid for a limited time. We cache to avoid re-authenticating every request.
let cachedToken = null;
let tokenExpiry = 0;

/**
 * Generate SHA256 sign for authentication
 * sign = SHA256(apiKey + timestamp)
 */
function generateSign(timestamp) {
  return crypto
    .createHash("sha256")
    .update(API_KEY + timestamp)
    .digest("hex");
}

/**
 * Get a valid API token (cached or fresh)
 * POST /apilogin
 */
async function getToken() {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const sign = generateSign(String(timestamp));

  const res = await fetch(`${API_BASE}/apilogin`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      seller_id: parseInt(SELLER_ID, 10),
      timestamp,
      sign,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  if (!data.token) {
    throw new Error("No token in response: " + JSON.stringify(data));
  }

  cachedToken = data.token;
  // Digiseller tokens typically last ~2 hours; we refresh after 90 min
  tokenExpiry = Date.now() + 90 * 60 * 1000;

  return cachedToken;
}

/**
 * Make an authenticated GET request
 */
async function apiGet(path, params = {}) {
  const token = await getToken();
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set("token", token);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 }, // Cache for 5 min in Next.js
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API GET ${path} failed (${res.status}): ${text}`);
  }

  return res.json();
}

/**
 * Make an authenticated POST request
 */
async function apiPost(path, body = {}) {
  const token = await getToken();
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set("token", token);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API POST ${path} failed (${res.status}): ${text}`);
  }

  return res.json();
}

// ══════════════════════════════════════════════════════
//  PUBLIC API METHODS
// ══════════════════════════════════════════════════════

/**
 * Get all categories for the seller's shop
 * GET /categories
 */
async function getCategories(lang = "en") {
  const data = await apiGet("/categories", { seller_id: SELLER_ID, lang });
  return data;
}

/**
 * Get products in a specific category
 * GET /shop/products
 * 
 * @param {number} categoryId - Category ID
 * @param {number} page - Page number (starting from 1)
 * @param {number} rows - Products per page
 * @param {string} order - Sort: "name", "price", "price_desc", "rating"
 */
async function getProductsByCategory(categoryId, page = 1, rows = 20, order = "rating", lang = "en", currency = "USD") {
  const data = await apiGet("/shop/products", {
    seller_id: SELLER_ID,
    category_id: categoryId,
    page,
    rows,
    order,
    currency,
    lang,
  });
  return data;
}

/**
 * Get ALL products from the shop (affiliate program products)
 * Uses the same /shop/products endpoint but WITHOUT category_id
 * This returns affiliate products, NOT your own seller products
 * 
 * @param {number} page
 * @param {number} rows
 * @param {string} order
 */
async function getShopProducts(page = 1, rows = 20, order = "rating", lang = "en", currency = "USD") {
  const data = await apiGet("/shop/products", {
    seller_id: SELLER_ID,
    page,
    rows,
    order,
    currency,
    lang,
  });
  return data;
}

/**
 * Get all seller's products (across all categories)
 * POST /seller-goods
 * 
 * @param {number} page
 * @param {number} rows
 * @param {string} order
 */
async function getSellerProducts(page = 1, rows = 20, order = "rating", lang = "en", currency = "USD") {
  const data = await apiPost("/seller-goods", {
    id_seller: parseInt(SELLER_ID, 10),
    page,
    rows,
    order,
    currency,
    lang,
  });
  return data;
}

/**
 * Get full product details
 * GET /products/{id}/data
 * 
 * @param {number} productId
 */
async function getProductDetails(productId, lang = "en", currency = "USD") {
  const data = await apiGet(`/products/${productId}/data`, {
    seller_id: SELLER_ID,
    currency,
    lang,
  });
  return data;
}

/**
 * Get product descriptions from a list of IDs (bulk)
 * POST /products/list
 * 
 * @param {number[]} ids - Array of product IDs
 */
async function getProductsList(ids, lang = "en", currency = "USD") {
  const data = await apiPost("/products/list", {
    id_goods: ids,
    currency,
    lang,
  });
  return data;
}

/**
 * Get product reviews
 * GET /products/{id}/reviews
 */
async function getProductReviews(productId, page = 1, rows = 10) {
  const data = await apiGet(`/products/${productId}/reviews`, {
    seller_id: SELLER_ID,
    page,
    rows,
    type: "good", // "good" | "bad" | "all"
  });
  return data;
}

/**
 * Search products by keyword
 * GET /shop/search
 * 
 * @param {string} query - Search text
 * @param {number} page
 * @param {number} rows
 */
async function searchProducts(query, page = 1, rows = 20, lang = "en", currency = "USD") {
  const data = await apiGet("/shop/search", {
    seller_id: SELLER_ID,
    text: query,
    page,
    rows,
    currency,
    lang,
  });
  return data;
}

/**
 * Get product image URL
 * This doesn't need authentication
 * 
 * @param {number} productId
 * @param {number} maxLength - Max dimension in pixels
 */
function getProductImageUrl(productId, maxLength = 400) {
  return `https://graph.digiseller.ru/img.ashx?id_d=${productId}&maxlength=${maxLength}`;
}

/**
 * Get the payment/purchase URL for a product
 * Buyer is redirected here to complete payment via Digiseller
 * 
 * KEY PARAMETERS:
 *   id_d      — Product ID
 *   ai        — Your affiliate/agent ID (so you get commission)
 *   lang      — Interface language
 *   FailPage  — URL to redirect if payment fails/cancelled
 *   
 * After successful payment, Digiseller redirects to the URL you set in
 * the product's "Unique Code Verification" settings in the dashboard,
 * OR to the default result page. We pass our website's success page.
 * 
 * @param {number} productId
 * @param {string} [lang] - Language code ("en", "ru", etc.)
 */
function getPaymentUrl(productId, lang = "en") {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const params = new URLSearchParams({
    id_d: String(productId),
    ai: AFFILIATE_ID,
    seller_id: SELLER_ID,
    lang,
    // Redirect back to YOUR site on failure/cancel (not Plati.Market)
    FailPage: `${baseUrl}/order/failed`,
    // "ReturnURL" parameter — where buyer goes after successful payment
    // NOTE: This works when set here, but for guaranteed redirect,
    // also set it in Dashboard > Products > [Product] > Unique Code Verification
    ReturnURL: `${baseUrl}/order/success`,
  });
  return `https://www.oplata.info/asp2/pay.asp?${params.toString()}`;
}

/**
 * Get the payment URL for multiple products (cart)
 * Uses Digiseller's cart system
 * 
 * @param {number[]} productIds
 */
function getCartPaymentUrl(productIds, lang = "en") {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // For single items, use direct payment
  if (productIds.length === 1) {
    return getPaymentUrl(productIds[0], lang);
  }
  // For multiple items, cart checkout URL
  const params = new URLSearchParams({
    cart: "1",
    ai: AFFILIATE_ID,
    seller_id: SELLER_ID,
    lang,
    FailPage: `${baseUrl}/order/failed`,
    ReturnURL: `${baseUrl}/order/success`,
  });
  return `https://www.oplata.info/asp2/pay.asp?${params.toString()}`;
}

/**
 * Get seller statistics (recent sales)
 * POST /seller-last-sales
 */
async function getRecentSales(top = 20, group = false) {
  const data = await apiPost("/seller-last-sales", {
    seller_id: parseInt(SELLER_ID, 10),
    top,
    group,
  });
  return data;
}

/**
 * Get product discount info
 * GET /products/{id}/discounts
 */
async function getProductDiscounts(productId) {
  const data = await apiGet(`/products/${productId}/discounts`);
  return data;
}

/**
 * Verify a unique code (after purchase)
 * Used for order fulfillment
 * GET /uniqueCode/{code}
 */
async function verifyUniqueCode(code) {
  const data = await apiGet(`/uniqueCode/${code}`);
  return data;
}

/**
 * Cart operations
 */
async function addToCart(productId, cartUid = null, quantity = 1) {
  const body = {
    product_id: productId,
    quantity,
  };
  if (cartUid) body.cart_uid = cartUid;

  const data = await apiPost("/cart/add", body);
  return data;
}

async function getCart(cartUid) {
  const data = await apiGet("/cart", { cart_uid: cartUid });
  return data;
}

async function removeFromCart(cartUid, productId) {
  const data = await apiPost("/cart/remove", {
    cart_uid: cartUid,
    product_id: productId,
  });
  return data;
}

// ══════════════════════════════════════════════════════
//  HELPER: Normalize product data from API response
// ══════════════════════════════════════════════════════

/**
 * Normalize a product from various API response formats
 * into a consistent shape for the frontend
 */
function normalizeProduct(raw) {
  // The API can return products in different shapes depending on the endpoint.
  // This normalizer handles the common variations.

  // Stock check: Digiseller uses these fields:
  //   is_available: 1 = available, 0 = not available
  //   num_in_stock: number of items in stock (0 means out of stock for content-based products)
  //   show_rest: whether to show remaining stock count
  //   avail: alternative availability field
  const isAvailable = raw.is_available === 1 || raw.is_available === true;
  const numInStock = parseInt(raw.num_in_stock || raw.cnt_in_stock || 0, 10);
  const hasContent = raw.num_in_stock === undefined; // If field doesn't exist, can't check stock count
  
  // Product is in stock if:
  // - is_available is 1/true, OR
  // - num_in_stock > 0 (for products with tracked inventory)
  // - If is_available is not present, check avail/in_stock fields
  let inStock;
  if (raw.is_available !== undefined) {
    inStock = isAvailable;
  } else if (raw.num_in_stock !== undefined) {
    inStock = numInStock > 0;
  } else {
    inStock = raw.in_stock !== false && raw.avail !== false && raw.avail !== 0;
  }

  return {
    id: raw.id || raw.id_goods || raw.product_id,
    name: raw.name || raw.product_name || raw.name_goods || "",
    description: raw.info || raw.description || raw.info_goods || "",
    price: parseFloat(raw.price || raw.price_usd || raw.price_wmz || 0),
    priceRub: parseFloat(raw.price_rub || raw.price_wmr || 0),
    currency: raw.currency || process.env.NEXT_PUBLIC_CURRENCY || "USD",
    imageUrl: getProductImageUrl(raw.id || raw.id_goods || raw.product_id),
    rating: raw.rating || raw.seller_rating || 0,
    salesCount: raw.cnt_sell || raw.sales_count || raw.cnt_sells || 0,
    categoryId: raw.id_cat || raw.category_id || null,
    categoryName: raw.name_cat || raw.category_name || "",
    sellerId: raw.id_seller || SELLER_ID,
    inStock,
    numInStock: numInStock,
    showRest: raw.show_rest === 1 || raw.show_rest === true,
    paymentUrl: getPaymentUrl(raw.id || raw.id_goods || raw.product_id),
    discountPercent: raw.discount_percent || raw.bonus_percent || 0,
    oldPrice: raw.price_old || raw.old_price || null,
    platform: extractPlatform(raw.name || raw.product_name || ""),
  };
}

/**
 * Try to extract platform from product name
 */
function extractPlatform(name) {
  const lower = name.toLowerCase();
  const platforms = [
    { keywords: ["steam"], label: "Steam" },
    { keywords: ["playstation", "psn", "ps4", "ps5"], label: "PSN" },
    { keywords: ["xbox", "microsoft store"], label: "Xbox" },
    { keywords: ["nintendo", "switch", "eshop"], label: "Nintendo" },
    { keywords: ["epic games", "epic store"], label: "Epic" },
    { keywords: ["gog"], label: "GOG" },
    { keywords: ["origin", "ea app", "ea play"], label: "EA" },
    { keywords: ["uplay", "ubisoft"], label: "Ubisoft" },
    { keywords: ["battle.net", "blizzard"], label: "Battle.net" },
    { keywords: ["rockstar"], label: "Rockstar" },
    { keywords: ["google play"], label: "Google Play" },
    { keywords: ["itunes", "app store", "apple"], label: "Apple" },
    { keywords: ["spotify"], label: "Spotify" },
    { keywords: ["netflix"], label: "Netflix" },
    { keywords: ["windows", "win10", "win11"], label: "Microsoft" },
    { keywords: ["office", "microsoft 365"], label: "Microsoft" },
  ];
  for (const p of platforms) {
    if (p.keywords.some((kw) => lower.includes(kw))) return p.label;
  }
  return "Digital";
}

/**
 * Normalize a category from API response
 */
function normalizeCategory(raw) {
  return {
    id: raw.id || raw.id_cat,
    name: raw.name || raw.name_cat || "",
    count: raw.cnt || raw.cnt_goods || 0,
    parentId: raw.id_parent || null,
    subcategories: (raw.sub || raw.subcategories || []).map(normalizeCategory),
  };
}

module.exports = {
  getToken,
  getCategories,
  getProductsByCategory,
  getShopProducts,
  getSellerProducts,
  getProductDetails,
  getProductsList,
  getProductReviews,
  searchProducts,
  getProductImageUrl,
  getPaymentUrl,
  getCartPaymentUrl,
  getRecentSales,
  getProductDiscounts,
  verifyUniqueCode,
  addToCart,
  getCart,
  removeFromCart,
  normalizeProduct,
  normalizeCategory,
  SELLER_ID,
  AFFILIATE_ID,
};
