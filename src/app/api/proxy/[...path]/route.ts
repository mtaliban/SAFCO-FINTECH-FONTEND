import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8000';

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = new URL(req.url);
  const target = `${BACKEND}/api/${path.join('/')}${url.search}`;

  const headers = new Headers();
  req.headers.forEach((val, key) => {
    if (!['host', 'connection', 'transfer-encoding'].includes(key.toLowerCase())) {
      headers.set(key, val);
    }
  });

  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer();

  const res = await fetch(target, { method: req.method, headers, body });

  const resHeaders = new Headers();
  res.headers.forEach((val, key) => {
    if (!['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
      resHeaders.set(key, val);
    }
  });

  return new NextResponse(res.body, { status: res.status, headers: resHeaders });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
