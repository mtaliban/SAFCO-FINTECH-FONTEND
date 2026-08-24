/**
 * Shared MQTT WebSocket client for real-time SAFCO LMS events.
 * Connects to Mosquitto over ws://localhost:9002 (exposed by safco-mqtt container).
 *
 * Frontend uses this for:
 *   - safco/lms/material/{uuid}/status  (Module 3 async processing)
 *   - safco/lms/quiz/session/{pin}/*    (Module 7 live quiz)
 *
 * The client is a singleton: one WebSocket connection per browser tab.
 */
'use client';

import mqtt, { MqttClient } from 'mqtt';

let client: MqttClient | null = null;
const listeners = new Map<string, Set<(payload: unknown) => void>>();

function getClient(): MqttClient {
  if (client && client.connected) return client;
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_MQTT_URL || 'ws://localhost:9002/mqtt';
  client = mqtt.connect(url, {
    clientId: `safco-fe-${Math.random().toString(36).slice(2, 10)}`,
    keepalive: 30,
    reconnectPeriod: 3000,
    connectTimeout: 5000,
  });

  client.on('connect', () => {
    // Re-subscribe to all active topics after (re)connect
    for (const topic of listeners.keys()) {
      client!.subscribe(topic, { qos: 0 });
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
}

/** Subscribe to a topic. Returns unsubscribe function. */
export function subscribe(topic: string, handler: (payload: unknown) => void): () => void {
  const c = getClient();
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
      c.unsubscribe(topic);
    }
  };
}
