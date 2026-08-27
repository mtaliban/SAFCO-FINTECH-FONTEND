'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Send, Loader2, Copy, Check, ChevronDown } from 'lucide-react';
import { aiApi, type TutorMessage } from '@/lib/ai/api';

interface Props {
  context?: { course?: string; lesson?: string; topic?: string };
}

const SUGGESTIONS = [
  'Explain this concept simply',
  'Give me a practical example',
  'What are the key points?',
  'How is this used in real life?',
  'Show me a step-by-step guide',
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="opacity-0 group-hover:opacity-100 transition p-1 rounded text-white/50 hover:text-white hover:bg-white/10"
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export function AiTutorWidget({ context }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    setShowSuggestions(false);

    const userMsg: TutorMessage = { role: 'user', content };
    const nextHistory: TutorMessage[] = [...messages, userMsg];
    setMessages(nextHistory);
    setLoading(true);

    try {
      const { reply } = await aiApi.tutorChat(nextHistory, context);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Samahani, kuna tatizo la kuunganisha. Jaribu tena.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setMessages([]);
    setShowSuggestions(true);
    setInput('');
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 120px)', height: '520px' }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #0f2a50 0%, #0f2a50 100%)' }}
            className="flex items-center gap-3 px-4 py-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-white">SAFCO AI Tutor</div>
              {context?.lesson && (
                <div className="text-[10px] text-orange-300 truncate">{context.lesson}</div>
              )}
              {!context?.lesson && context?.course && (
                <div className="text-[10px] text-orange-300 truncate">{context.course}</div>
              )}
              {!context?.lesson && !context?.course && (
                <div className="text-[10px] text-orange-300">Ask me anything — I am here to help</div>
              )}
            </div>
            <div className="flex gap-1">
              {messages.length > 0 && (
                <button onClick={clear} className="p-1.5 text-white/60 hover:text-white hover:bg-white/15 rounded-lg transition text-xs font-bold">
                  Clear
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 text-white/60 hover:text-white hover:bg-white/15 rounded-lg transition">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-50 to-orange-50 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-7 h-7 text-navy-500" />
                </div>
                <p className="text-slate-800 font-bold text-sm">Hello! I am your AI Tutor</p>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Ask me to explain concepts, give examples, or help you understand your coursework.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                )}
                <div
                  className={`relative group max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-navy-500 text-white rounded-tr-sm'
                      : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  {m.role === 'assistant' && (
                    <div className="mt-1 flex justify-end">
                      <CopyButton text={m.content} />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {showSuggestions && messages.length === 0 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {SUGGESTIONS.slice(0, 3).map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-navy-50 text-navy-600 font-semibold hover:bg-navy-100 transition border border-navy-200"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-1 border-t border-slate-100 shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-navy-300 focus-within:border-navy-300 transition">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask a question…"
                className="flex-1 bg-transparent text-sm outline-none text-slate-800 placeholder:text-slate-400"
                disabled={loading}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-7 h-7 rounded-lg bg-navy-500 hover:bg-navy-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition shrink-0"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
              </button>
            </div>
            <div className="text-center mt-1.5">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest">SAFCO AI · May make mistakes</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-5 right-4 sm:right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300 text-white font-bold text-sm ${
          open
            ? 'bg-slate-700 hover:bg-slate-800'
            : 'hover:shadow-xl hover:scale-105'
        }`}
        style={open ? {} : { background: 'linear-gradient(135deg, #0f2a50, #f5a623)' }}
        title="AI Tutor"
      >
        {open ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        <span className="hidden sm:inline">{open ? 'Close' : 'AI Tutor'}</span>
      </button>
    </>
  );
}
