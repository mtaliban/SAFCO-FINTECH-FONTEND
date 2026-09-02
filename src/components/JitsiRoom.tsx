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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function mount() {
      if (!containerRef.current || apiRef.current) return;

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

      apiRef.current.addEventListener('videoConferenceJoined', () => {
        setReady(true);
        onJoined?.();
      });

      apiRef.current.addEventListener('videoConferenceLeft', () => onLeft?.());
      apiRef.current.addEventListener('readyToClose', () => onLeft?.());
    }

    if (window.JitsiMeetExternalAPI) {
      mount();
    } else {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.onload = mount;
      document.head.appendChild(script);
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
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white gap-3 pointer-events-none">
          <Video className="w-10 h-10 text-brand-400" />
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          <p className="text-sm text-slate-300">Inapakia darasa la live...</p>
        </div>
      )}
    </div>
  );
}
