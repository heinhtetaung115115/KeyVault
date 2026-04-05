/**
 * Webhook: GET and POST /api/webhook
 * Digiseller sends notifications here when a sale occurs.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const hasParams = searchParams.has("id_i") || searchParams.has("ID_I") || searchParams.has("id_d") || searchParams.has("ID_D");

  if (!hasParams) {
    return Response.json({ ok: true, message: "Webhook endpoint active" });
  }

  console.log("═══ DIGISELLER WEBHOOK (GET) ═══");
  console.log("Params:", Object.fromEntries(searchParams.entries()));
  return Response.json({ ok: true, received: true });
}

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let data;
    if (contentType.includes("json")) data = await request.json();
    else data = { raw: await request.text() };

    console.log("═══ DIGISELLER WEBHOOK (POST) ═══");
    console.log("Data:", JSON.stringify(data, null, 2));
    return Response.json({ ok: true, received: true });
  } catch (error) {
    return Response.json({ ok: true, received: true });
  }
}
