'use client';

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import Cookies from 'js-cookie';
import { TOKEN_KEY } from '@/lib/api';

let instance: Echo<'reverb'> | null = null;
let builtForToken: string | null = null;

function buildEcho(token: string): Echo<'reverb'> {
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
    authEndpoint: `${apiBase}/v1/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });
}

/**
 * Returns the singleton Echo instance.
 * Re-creates automatically when the auth token changes (e.g. after login).
 */
export function getEcho(): Echo<'reverb'> | null {
  if (typeof window === 'undefined') return null;

  const token = Cookies.get(TOKEN_KEY);
  if (!token) return null;

  // Rebuild if token changed (login after logout, or token refresh)
  if (!instance || builtForToken !== token) {
    instance?.disconnect();
    instance = buildEcho(token);
    builtForToken = token;
  }

  return instance;
}

/** Call on logout to tear down the WebSocket connection. */
export function disconnectEcho(): void {
  instance?.disconnect();
  instance = null;
  builtForToken = null;
}
