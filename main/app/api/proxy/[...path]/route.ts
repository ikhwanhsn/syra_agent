import { NextRequest, NextResponse } from "next/server";

/**
 * CORS proxy for API playground — mirrors Vite `/api/proxy/<encoded-url>`.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const encoded = params.path?.join("/") ?? "";
  if (!encoded) {
    return NextResponse.json({ error: "Missing target URL" }, { status: 400 });
  }

  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(encoded);
  } catch {
    return NextResponse.json({ error: "Invalid encoded URL" }, { status: 400 });
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: "GET",
      headers: {
        accept: request.headers.get("accept") ?? "application/json",
      },
      cache: "no-store",
    });
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
        "access-control-allow-origin": "*",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  const encoded = context.params.path?.join("/") ?? "";
  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(encoded);
  } catch {
    return NextResponse.json({ error: "Invalid encoded URL" }, { status: 400 });
  }

  const body = await request.text();
  try {
    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "content-type": request.headers.get("content-type") ?? "application/json",
        accept: request.headers.get("accept") ?? "application/json",
      },
      body: body || undefined,
      cache: "no-store",
    });
    const resBody = await upstream.text();
    return new NextResponse(resBody, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
        "access-control-allow-origin": "*",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
