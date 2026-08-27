'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Megaphone, Send, Users, Loader2, Eye, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '@/lib/api';
import { Pagination, usePagedSlice } from '@/components/ui/Pagination';

const PAGE_SIZE = 10;

type Segment = {
  role?: string;
  course_id?: number;
  organization_id?: number;
  action_url?: string;
  action_label?: string;
};

interface BroadcastRow {
  uuid: string;
  title: string;
  body_preview: string;
  segment: Segment;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  audience_size: number;
  sent_count: number;
  failed_count: number;
  sent_at: string | null;
  created_at: string | null;
  creator_email: string | null;
}

export default function AdminAnnouncementsPage() {
  const { data, refetch } = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: () => apiRequest.get<{ data: BroadcastRow[] }>('/admin/announcements'),
  });

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [role, setRole] = useState<string>('');
  const [actionUrl, setActionUrl] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const { page: rows, lastPage, currentPage, totalItems } = usePagedSlice(data?.data, page, PAGE_SIZE);

  const buildSegment = (): Segment => {
    const s: Segment = {};
    if (role) s.role = role;
    if (actionUrl) s.action_url = actionUrl;
    if (actionLabel) s.action_label = actionLabel;
    return s;
  };

  const previewMut = useMutation({
    mutationFn: () => apiRequest.post<{ audience_size: number }>(
      '/admin/announcements/preview',
      { segment: buildSegment() },
    ),
    onSuccess: (r) => {
      setPreviewCount(r.audience_size);
      toast.success(`Audience: ${r.audience_size} user${r.audience_size === 1 ? '' : 's'}`);
    },
    onError: () => toast.error('Preview failed'),
  });

  const sendMut = useMutation({
    mutationFn: () => apiRequest.post<{ sent_count: number; audience_size: number; failed_count: number }>(
      '/admin/announcements',
      { title, body, segment: buildSegment() },
    ),
    onSuccess: (r) => {
      toast.success(`Sent to ${r.sent_count}/${r.audience_size} users`);
      setTitle(''); setBody(''); setRole(''); setActionUrl(''); setActionLabel(''); setPreviewCount(null);
      refetch();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Send failed'),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Megaphone className="w-7 h-7 text-brand-600" /> Broadcast Announcements
        </h1>
        <p className="text-slate-600 mt-1">
          Tuma matangazo kwa segment ya users. Kila mtumiaji atapata kupitia channels aliyoruhusu (email + in-app).
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose */}
        <section className="lg:col-span-2 card p-5 space-y-4">
          <h2 className="font-bold text-slate-900">Compose</h2>

          <div>
            <label className="text-xs uppercase font-bold text-slate-500 tracking-widest">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Announcement title"
            />
          </div>

          <div>
            <label className="text-xs uppercase font-bold text-slate-500 tracking-widest">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1 w-full min-h-[180px] rounded border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Message body — will render as email + in-app inbox item"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase font-bold text-slate-500 tracking-widest">Action URL (optional)</label>
              <input
                type="url"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-xs uppercase font-bold text-slate-500 tracking-widest">Button label</label>
              <input
                type="text"
                maxLength={60}
                value={actionLabel}
                onChange={(e) => setActionLabel(e.target.value)}
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. Open course"
              />
            </div>
          </div>
        </section>

        {/* Segment + send */}
        <section className="card p-5 space-y-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5" /> Audience
          </h2>

          <div>
            <label className="text-xs uppercase font-bold text-slate-500 tracking-widest">Role filter</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 outline-none"
            >
              <option value="">All active users</option>
              <option value="student">Students only</option>
              <option value="trainer">Trainers only</option>
              <option value="corporate_client">Corporate clients only</option>
              <option value="system_admin">System admins only</option>
            </select>
          </div>

          <button
            onClick={() => previewMut.mutate()}
            disabled={previewMut.isPending}
            className="btn-secondary w-full justify-center"
          >
            {previewMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Preview audience
          </button>
          {previewCount !== null && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-sm text-center">
              <b>{previewCount}</b> user{previewCount === 1 ? '' : 's'} match
            </div>
          )}

          <button
            onClick={() => {
              if (!confirm(`Send to ${previewCount ?? '?'} users?`)) return;
              sendMut.mutate();
            }}
            disabled={
              title.trim().length < 3 || body.trim().length < 5 || sendMut.isPending
            }
            className="btn-primary w-full justify-center"
          >
            {sendMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send announcement
          </button>
        </section>
      </div>

      {/* Recent broadcasts */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Recent broadcasts</h2>
        {totalItems === 0 ? (
          <div className="card p-6 text-center text-slate-500">Hakuna announcements bado.</div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.uuid} className="card p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900">{r.title}</div>
                  <div className="text-sm text-slate-600 mt-1 line-clamp-2">{r.body_preview}</div>
                  <div className="text-xs text-slate-500 mt-2 flex flex-wrap gap-x-3">
                    <span>by {r.creator_email ?? 'admin'}</span>
                    {r.sent_at && <span>· {new Date(r.sent_at).toLocaleString()}</span>}
                    <span>· to {r.audience_size} users</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`inline-flex items-center gap-1 text-xs font-bold uppercase px-2 py-1 rounded-full ${
                    r.status === 'sent' ? 'bg-emerald-100 text-emerald-800'
                    : r.status === 'failed' ? 'bg-red-100 text-red-800'
                    : 'bg-slate-100 text-slate-700'
                  }`}>
                    {r.status === 'sent' && <CheckCircle2 className="w-3 h-3" />}
                    {r.status}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {r.sent_count}/{r.audience_size} delivered
                  </div>
                  {r.failed_count > 0 && (
                    <div className="text-xs text-red-600 mt-0.5">{r.failed_count} failed</div>
                  )}
                </div>
              </div>
            ))}
            <Pagination
              currentPage={currentPage}
              lastPage={lastPage}
              onPageChange={setPage}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
            />
          </div>
        )}
      </section>
    </div>
  );
}
