'use client';

import mqtt, { MqttClient } from 'mqtt';

let client: MqttClient | null = null;
let disabled = false;
const listeners = new Map<string, Set<(payload: unknown) => void>>();

function getClient(): MqttClient | null {
  if (disabled) return null;
  if (client && (client.connected || client.reconnecting)) return client;

  let url = process.env.NEXT_PUBLIC_MQTT_URL || 'ws://localhost:9002/mqtt';

  // Browsers block ws:// from https:// pages (Mixed Content).
  // Auto-upgrade to wss:// so the connection attempt is at least valid.
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    url = url.replace(/^ws:\/\//, 'wss://');
  }

  try {
    client = mqtt.connect(url, {
      clientId: `safco-fe-${Math.random().toString(36).slice(2, 10)}`,
      keepalive: 30,
      reconnectPeriod: 5000,
      connectTimeout: 8000,
    });

    client.on('connect', () => {
      for (const topic of listeners.keys()) {
        client!.subscribe(topic, { qos: 0 });
      }
    });

    client.on('error', (err) => {
      // Silently disable MQTT if the broker is unreachable (polling fallback takes over)
      if (
        err.message?.includes('WebSocket') ||
        err.message?.includes('ECONNREFUSED') ||
        err.message?.includes('getaddrinfo')
      ) {
        disabled = true;
        client?.end(true);
        client = null;
      }
    });

    client.on('message', (topic, payload) => {
      const handlers = listeners.get(topic);
      if (!handlers) return;
      let parsed: unknown = payload.toString();
      try { parsed = JSON.parse(payload.toString()); } catch { /* raw string */ }
      handlers.forEach((fn) => fn(parsed));
    });

    return client;
  } catch {
    // SecurityError or any other connection error — disable MQTT gracefully
    disabled = true;
    client = null;
    return null;
  }
}

/** Subscribe to a topic. Returns an unsubscribe function. Falls back silently if MQTT unavailable. */
export function subscribe(topic: string, handler: (payload: unknown) => void): () => void {
  const c = getClient();

  if (!c) {
    // MQTT disabled — return no-op cleanup; polling fallback handles updates
    return () => {};
  }

  if (!listeners.has(topic)) {
    listeners.set(topic, new Set());
    if (c.connected) c.subscribe(topic, { qos: 0 });
  }
  listeners.get(topic)!.add(handler);

  return () => {
    const set = listeners.get(topic);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) {
      listeners.delete(topic);
      try { c.unsubscribe(topic); } catch { /* ignore */ }
    }
  };
}
