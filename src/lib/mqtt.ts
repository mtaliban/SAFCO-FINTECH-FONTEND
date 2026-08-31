'use client';

import mqtt, { MqttClient } from 'mqtt';

let client: MqttClient | null = null;
const listeners = new Map<string, Set<(payload: unknown) => void>>();

function getClient(): MqttClient | null {
  if (client && (client.connected || client.reconnecting)) return client;

  let url = process.env.NEXT_PUBLIC_MQTT_URL || 'ws://localhost:9001/mqtt';

  // Auto-upgrade ws:// → wss:// on HTTPS pages (mixed-content block).
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    url = url.replace(/^ws:\/\//, 'wss://');
  }

  try {
    client = mqtt.connect(url, {
      clientId: `safco-fe-${Math.random().toString(36).slice(2, 10)}`,
      keepalive: 30,
      reconnectPeriod: 5000,   // auto-retry every 5 s
      connectTimeout: 10_000,
    });

    client.on('connect', () => {
      // Re-subscribe to any topics that were registered before connection
      for (const topic of listeners.keys()) {
        client!.subscribe(topic, { qos: 0 });
      }
    });

    client.on('error', (err) => {
      // Log for debugging but do NOT permanently disable — the built-in
      // reconnectPeriod handles retries automatically.
      console.warn('[mqtt] connection error, will retry:', err.message);
    });

    client.on('message', (topic, payload) => {
      const handlers = listeners.get(topic);
      if (!handlers) return;
      let parsed: unknown = payload.toString();
      try { parsed = JSON.parse(payload.toString()); } catch { /* raw string */ }
      handlers.forEach((fn) => fn(parsed));
    });

    return client;
  } catch (err) {
    console.warn('[mqtt] failed to create client:', err);
    client = null;
    return null;
  }
}

/** Subscribe to a topic. Returns an unsubscribe function. */
export function subscribe(topic: string, handler: (payload: unknown) => void): () => void {
  const c = getClient();

  if (!c) return () => {};

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
