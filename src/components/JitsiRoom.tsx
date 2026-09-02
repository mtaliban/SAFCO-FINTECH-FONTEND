'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Video } from 'lucide-react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    JitsiMeetExternalAPI: new (domain: string, options: Record<string, unknown>) => any;
  }
}

interface Props {
  roomName: string;
  displayName: string;
  email: string;
  isHost?: boolean;
  onJoined?: () => void;
  onLeft?: () => void;
  height?: string;
}

export default function JitsiRoom({ roomName, displayName, email, isHost = false, onJoined, onLeft, height = '520px' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiRef = useRef<any>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    function mount() {
      if (!containerRef.current || apiRef.current) return;

      try {
        const toolbarButtons = isHost
          ? ['microphone', 'camera', 'desktop', 'chat', 'raisehand', 'participants-pane', 'hangup']
          : ['microphone', 'camera', 'chat', 'raisehand', 'hangup'];

        apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
          roomName,
          parentNode: containerRef.current,
          userInfo: { displayName, email },
          configOverwrite: {
            startWithAudioMuted: true,
            disableDeepLinking: true,
            prejoinPageEnabled: false,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_BUTTONS: toolbarButtons,
          },
        });

        // Show Jitsi UI as soon as API is created — don't wait for join
        setLoadState('ready');

        apiRef.current.addEventListener('videoConferenceJoined', () => onJoined?.());
        apiRef.current.addEventListener('videoConferenceLeft', () => onLeft?.());
        apiRef.current.addEventListener('readyToClose', () => onLeft?.());
      } catch {
        setLoadState('error');
      }
    }

    if (typeof window !== 'undefined' && window.JitsiMeetExternalAPI) {
      mount();
    } else {
      // Check if script already exists
      if (!document.getElementById('jitsi-script')) {
        const script = document.createElement('script');
        script.id = 'jitsi-script';
        script.src = 'https://meet.jit.si/external_api.js';
        script.onload = mount;
        script.onerror = () => setLoadState('error');
        document.head.appendChild(script);
      } else {
        // Script tag exists but API not ready yet — poll briefly
        const interval = setInterval(() => {
          if (window.JitsiMeetExternalAPI) {
            clearInterval(interval);
            mount();
          }
        }, 200);
        return () => clearInterval(interval);
      }
    }

    return () => {
      apiRef.current?.dispose();
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900" style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />

      {loadState === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
          <Video className="w-10 h-10 text-green-400" />
          <Loader2 className="w-6 h-6 animate-spin text-green-400" />
          <p className="text-sm text-slate-300">Inapakia Jitsi Meet...</p>
        </div>
      )}

      {loadState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
          <p className="text-red-400 font-semibold">Imeshindwa kupakia darasa.</p>
          <p className="text-xs text-slate-400">Hakikisha una internet na ujabu tena.</p>
        </div>
      )}
    </div>
  );
}
