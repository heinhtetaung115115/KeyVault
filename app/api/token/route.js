/**
 * GET /api/token
 * Returns a fresh Digiseller API token
 * (Used internally — you typically don't expose this to the frontend)
 */
import { getToken } from "../../lib/digiseller";

export async function GET() {
  try {
    const token = await getToken();
    return Response.json({ token, ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
