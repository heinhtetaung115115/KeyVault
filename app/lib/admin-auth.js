/**
 * Simple admin authentication
 * 
 * Uses a server-side session token stored in an httpOnly cookie.
 * No database required — credentials come from .env.local
 */

const crypto = require("crypto");

const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "changeme123";

// In-memory token store (resets on server restart — fine for single-admin use)
const validTokens = new Set();

/**
 * Generate a session token for a valid login
 */
function createSession() {
  const token = crypto.randomBytes(32).toString("hex");
  validTokens.add(token);
  // Auto-expire after 24 hours
  setTimeout(() => validTokens.delete(token), 24 * 60 * 60 * 1000);
  return token;
}

/**
 * Validate login credentials
 */
function validateCredentials(username, password) {
  return username === ADMIN_USER && password === ADMIN_PASS;
}

/**
 * Check if a request has a valid admin session
 */
function isAuthenticated(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/admin_token=([^;]+)/);
  if (!match) return false;
  return validTokens.has(match[1]);
}

/**
 * Middleware: return 401 if not authenticated
 */
function requireAuth(request) {
  if (!isAuthenticated(request)) {
    return Response.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  return null; // null = authenticated, proceed
}

function destroySession(token) {
  validTokens.delete(token);
}

module.exports = {
  createSession,
  validateCredentials,
  isAuthenticated,
  requireAuth,
  destroySession,
};
