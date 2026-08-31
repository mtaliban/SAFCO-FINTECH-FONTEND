'use client';

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import Cookies from 'js-cookie';
import { TOKEN_KEY } from '@/lib/api';

let instance: Echo<'reverb'> | null = null;

function buildEcho(): Echo<'reverb'> | null {
  if (typeof window === 'undefined') return null;

  const token = Cookies.get(TOKEN_KEY);
  if (!token) return null;

  const key    = process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? '';
  const host   = process.env.NEXT_PUBLIC_REVERB_HOST   ?? '13.62.222.211';
  const port   = Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080);
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'ws';
  const tls    = scheme === 'https' || scheme === 'wss';
  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? 'http://13.62.222.211:8000/api').replace(/\/$/, '');

  (window as unknown as Record<string, unknown>).Pusher = Pusher;

  return new Echo({
    broadcaster: 'reverb',
    key,
    wsHost:  host,
    wsPort:  tls ? 443 : port,
    wssPort: tls ? 443 : port,
    forceTLS: tls,
    enabledTransports: ['ws', 'wss'],
    // Our api.php exposes POST /api/v1/broadcasting/auth with auth:sanctum
    authEndpoint: `${apiBase}/v1/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });
}

/** Returns a singleton Echo instance. Re-creates if the token changes. */
export function getEcho(): Echo<'reverb'> | null {
  if (!instance) {
    instance = buildEcho();
  }
  return instance;
}

/** Call on logout to tear down the WebSocket connection. */
export function disconnectEcho(): void {
  instance?.disconnect();
  instance = null;
}
