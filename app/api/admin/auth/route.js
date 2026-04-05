/**
 * POST /api/admin/auth — Login
 * GET  /api/admin/auth — Check session
 * DELETE /api/admin/auth — Logout
 */
import { createSession, validateCredentials, isAuthenticated } from "../../../lib/admin-auth";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!validateCredentials(username, password)) {
      return Response.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = createSession();

    const res = Response.json({ ok: true });
    res.headers.set(
      "Set-Cookie",
      `admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${24 * 60 * 60}`
    );
    return res;
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET(request) {
  return Response.json({ ok: true, authenticated: isAuthenticated(request) });
}

export async function DELETE() {
  const res = Response.json({ ok: true });
  res.headers.set(
    "Set-Cookie",
    "admin_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"
  );
  return res;
}
