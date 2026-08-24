'use client';

import { useEffect, useRef } from 'react';
import { subscribe } from '@/lib/mqtt';

/**
 * Subscribe to one or more MQTT topics; call `handler` for every incoming payload.
 * The handler always receives the LATEST closure (avoids stale references)
 * while only re-subscribing when `topics` change.
 *
 * @param topics  array of full MQTT topic names (e.g. `safco/lms/quiz/session/745812/question_started`)
 * @param handler `(topic, payload) => void` — payload is already JSON-parsed if it was JSON
 */
export function useMQTTTopics(
  topics: string[] | null,
  handler: (topic: string, payload: unknown) => void,
): void {
  const handlerRef = useRef(handler);
  useEffect(() => { handlerRef.current = handler; }, [handler]);

  useEffect(() => {
    if (!topics || topics.length === 0) return;
    const unsubs = topics.map((topic) =>
      subscribe(topic, (payload) => handlerRef.current(topic, payload)),
    );
    return () => { unsubs.forEach((u) => u()); };
    // We intentionally serialize topics for the dep array; joining is cheap for < 20 topics.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics?.join('|')]);
}

/**
 * Convenience wrapper: subscribe to every sub-topic of a single live-quiz session.
 * Calls the handler with the parsed suffix (e.g. `'question_started'`) plus payload.
 */
export function useLiveSession(
  pin: string | null | undefined,
  events: readonly string[],
  handler: (event: string, payload: unknown) => void,
): void {
  const handlerRef = useRef(handler);
  useEffect(() => { handlerRef.current = handler; }, [handler]);

  const topics = pin ? events.map((e) => `safco/lms/quiz/session/${pin}/${e}`) : null;

  useMQTTTopics(topics, (topic, payload) => {
    const suffix = topic.split('/').pop() ?? '';
    handlerRef.current(suffix, payload);
  });
}
