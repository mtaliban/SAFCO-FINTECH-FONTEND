'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ChevronUp, ChevronDown, CheckCircle2, Loader2, Send, Pin,
  Lock, EyeOff, Flag, CornerDownRight, Trash2, MessageCircle, Tag,
  Eye, Clock, BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { forumApi, type PostView } from '@/lib/forum/api';
import { categoryStyle, timeAgo } from '../../_shared';

export default function ThreadDetailPage() {
  const params = useParams();
  const uuid = params?.uuid as string;
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['forum', 'thread', uuid],
    queryFn: () => forumApi.show(uuid),
  });

  const [replyBody, setReplyBody] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: number; name: string } | null>(null);

  const replyMut = useMutation({
    mutationFn: () => forumApi.reply(uuid, replyBody, replyingTo?.id),
    onSuccess: () => {
      setReplyBody(''); setReplyingTo(null);
      toast.success('Reply posted');
      qc.invalidateQueries({ queryKey: ['forum', 'thread', uuid] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to reply'),
  });

  const voteThreadMut = useMutation({
    mutationFn: (value: -1 | 0 | 1) => forumApi.voteThread(uuid, value),
    onSuccess: () => refetch(),
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Vote failed'),
  });
  const votePostMut = useMutation({
    mutationFn: ({ id, v }: { id: string; v: -1 | 0 | 1 }) => forumApi.votePost(id, v),
    onSuccess: () => refetch(),
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Vote failed'),
  });
  const acceptMut = useMutation({
    mutationFn: (postUuid: string) => forumApi.acceptAnswer(uuid, postUuid),
    onSuccess: () => { toast.success('Answer accepted'); refetch(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });
  const moderateMut = useMutation({
    mutationFn: (patch: Parameters<typeof forumApi.moderateThread>[1]) =>
      forumApi.moderateThread(uuid, patch),
    onSuccess: () => { toast.success('Updated'); refetch(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });
  const deletePostMut = useMutation({
    mutationFn: (postUuid: string) => forumApi.deletePost(postUuid),
    onSuccess: () => { toast.success('Post deleted'); refetch(); },
  });
  const reportMut = useMutation({
    mutationFn: ({ type, id }: { type: 'thread' | 'post'; id: string }) =>
      forumApi.report({ target_type: type, target_uuid: id, reason: 'spam' }),
    onSuccess: () => toast.success('Report submitted — a moderator will review.'),
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="h-24 animate-pulse" style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#4f46e5 100%)' }} />
        <div className="max-w-4xl mx-auto px-8 py-8 space-y-4">
          <div className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { thread, posts, permissions } = data;
  const cat = categoryStyle(thread.category.color);
  const acceptedPost = posts.find((p) => p.is_accepted_answer);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── MINI HEADER ── */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 60%, #4f46e5 100%)' }}>
        <div className="max-w-4xl mx-auto px-8 py-6">
          <Link href={`/forum/${thread.category.slug}`}
            className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white font-semibold text-sm mb-4 transition">
            <ArrowLeft className="w-4 h-4" /> {thread.category.name}
          </Link>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {thread.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300">
                <Pin className="w-2.5 h-2.5" /> Pinned
              </span>
            )}
            {thread.is_locked && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-400/20 border border-red-400/40 text-red-300">
                <Lock className="w-2.5 h-2.5" /> Locked
              </span>
            )}
            {thread.has_accepted_answer && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-300">
                <CheckCircle2 className="w-2.5 h-2.5" /> Answered
              </span>
            )}
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${cat.bg} ${cat.text} border ${cat.border}`}>
              {thread.category.name}
            </span>
            {thread.assignment && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/15 border border-white/30 text-white/80">
                <BookOpen className="w-2.5 h-2.5 inline mr-0.5" /> {thread.assignment.title}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-black text-white leading-snug">{thread.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-indigo-300 text-xs">
            <span className="font-semibold text-white/80">{thread.author?.name ?? 'Unknown'}</span>
            {thread.created_at && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(thread.created_at)}</span>}
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{thread.views_count.toLocaleString()} views</span>
            <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{posts.length} replies</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-6 space-y-4">

        {/* ── THREAD BODY ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex gap-0">
            {/* Vote sidebar */}
            <VoteBar
              score={thread.votes_score}
              myVote={thread.my_vote}
              onVote={(v) => voteThreadMut.mutate(v)}
            />
            {/* Body */}
            <div className="flex-1 min-w-0 p-6">
              {thread.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {thread.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-semibold border border-indigo-100">
                      <Tag className="w-2.5 h-2.5" />{t}
                    </span>
                  ))}
                </div>
              )}

              <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed whitespace-pre-wrap">
                {thread.body}
              </div>

              <footer className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                <AuthorChip name={thread.author?.name} />
                {thread.created_at && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(thread.created_at)}</span>}
                <button
                  onClick={() => reportMut.mutate({ type: 'thread', id: thread.uuid })}
                  className="ml-auto inline-flex items-center gap-1 text-red-500 hover:text-red-700 font-semibold transition">
                  <Flag className="w-3 h-3" /> Report
                </button>
              </footer>

              {/* Moderator controls */}
              {permissions.can_moderate && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  <button onClick={() => moderateMut.mutate({ is_pinned: !thread.is_pinned })}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-slate-600">
                    <Pin className="w-3.5 h-3.5" /> {thread.is_pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button onClick={() => moderateMut.mutate({ is_locked: !thread.is_locked })}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-slate-600">
                    <Lock className="w-3.5 h-3.5" /> {thread.is_locked ? 'Unlock' : 'Lock'}
                  </button>
                  <button onClick={() => moderateMut.mutate({ is_hidden: true })}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition text-red-600">
                    <EyeOff className="w-3.5 h-3.5" /> Hide thread
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── REPLIES HEADER ── */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <MessageCircle className="w-5 h-5 text-indigo-500" />
            {posts.length} {posts.length === 1 ? 'Reply' : 'Replies'}
          </div>
          {thread.category.supports_accepted_answer && !acceptedPost && permissions.can_accept_answer && (
            <span className="text-xs bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
              No accepted answer yet
            </span>
          )}
        </div>

        {/* ── ACCEPTED ANSWER FIRST ── */}
        {acceptedPost && (
          <PostCard
            post={acceptedPost}
            supportsAccepted={thread.category.supports_accepted_answer}
            canAccept={permissions.can_accept_answer}
            canModerate={permissions.can_moderate}
            onVote={(v) => votePostMut.mutate({ id: acceptedPost.uuid, v })}
            onAccept={() => acceptMut.mutate(acceptedPost.uuid)}
            onReply={() => setReplyingTo({ id: (acceptedPost as any).id ?? 0, name: acceptedPost.author?.name ?? 'user' })}
            onDelete={() => { if (!confirm('Delete this post?')) return; deletePostMut.mutate(acceptedPost.uuid); }}
            onReport={() => reportMut.mutate({ type: 'post', id: acceptedPost.uuid })}
          />
        )}

        {/* ── OTHER REPLIES ── */}
        {posts.filter((p) => !p.is_accepted_answer).map((p) => (
          <PostCard
            key={p.uuid}
            post={p}
            supportsAccepted={thread.category.supports_accepted_answer}
            canAccept={permissions.can_accept_answer}
            canModerate={permissions.can_moderate}
            onVote={(v) => votePostMut.mutate({ id: p.uuid, v })}
            onAccept={() => acceptMut.mutate(p.uuid)}
            onReply={() => setReplyingTo({ id: (p as any).id ?? 0, name: p.author?.name ?? 'user' })}
            onDelete={() => { if (!confirm('Delete this post?')) return; deletePostMut.mutate(p.uuid); }}
            onReport={() => reportMut.mutate({ type: 'post', id: p.uuid })}
          />
        ))}

        {/* ── REPLY BOX ── */}
        {permissions.can_reply ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-indigo-500" /> Your reply
              </div>
            </div>
            <div className="p-5">
              {replyingTo && (
                <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 mb-3">
                  <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
                  Replying to <strong>{replyingTo.name}</strong>
                  <button onClick={() => setReplyingTo(null)}
                    className="ml-auto text-indigo-400 hover:text-indigo-700 font-bold text-xs">cancel</button>
                </div>
              )}
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                className="w-full min-h-[140px] px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none text-sm leading-relaxed resize-y"
                placeholder="Write a helpful, thoughtful reply… Use @name to mention someone."
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">{replyBody.length} chars</span>
                <button
                  disabled={replyBody.trim().length < 2 || replyMut.isPending}
                  onClick={() => replyMut.mutate()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl transition text-sm shadow-sm"
                >
                  {replyMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Post reply
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center text-slate-500 text-sm">
            {thread.is_locked
              ? <><Lock className="w-5 h-5 mx-auto mb-2 text-slate-300" />This thread is locked — no new replies allowed.</>
              : 'Please log in to reply.'}
          </div>
        )}

      </div>
    </div>
  );
}

function PostCard({
  post, supportsAccepted, canAccept, canModerate,
  onVote, onAccept, onReply, onDelete, onReport,
}: {
  post: PostView;
  supportsAccepted: boolean;
  canAccept: boolean;
  canModerate: boolean;
  onVote: (v: -1 | 0 | 1) => void;
  onAccept: () => void;
  onReply: () => void;
  onDelete: () => void;
  onReport: () => void;
}) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
      post.is_accepted_answer
        ? 'border-l-4 border-l-emerald-500 border-emerald-200'
        : 'border-slate-200'
    }`}>
      {post.is_accepted_answer && (
        <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Accepted answer</span>
        </div>
      )}
      <div className="flex gap-0">
        <VoteBar score={post.votes_score} myVote={post.my_vote} onVote={onVote} />
        <div className="flex-1 min-w-0 p-5">
          <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed whitespace-pre-wrap">
            {post.body}
          </div>
          <footer className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
            <AuthorChip name={post.author?.name} />
            {post.created_at && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(post.created_at)}</span>}
            {post.edited_at && <span className="italic">edited</span>}

            <div className="ml-auto flex items-center gap-3">
              <button onClick={onReply}
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold transition">
                <CornerDownRight className="w-3.5 h-3.5" /> Reply
              </button>
              {supportsAccepted && canAccept && !post.is_accepted_answer && (
                <button onClick={onAccept}
                  className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold transition">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                </button>
              )}
              <button onClick={onReport}
                className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 transition">
                <Flag className="w-3.5 h-3.5" />
              </button>
              {(post.can_edit || canModerate) && (
                <button onClick={onDelete}
                  className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 font-semibold transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function VoteBar({ score, myVote, onVote }: {
  score: number; myVote: -1 | 0 | 1; onVote: (v: -1 | 0 | 1) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-start gap-1.5 px-4 pt-5 bg-slate-50 border-r border-slate-100 shrink-0">
      <button
        onClick={() => onVote(myVote === 1 ? 0 : 1)}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
          myVote === 1 ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'
        }`}
        aria-label="Upvote"
      >
        <ChevronUp className="w-5 h-5 stroke-[2.5]" />
      </button>
      <div className={`text-base font-black tabular-nums text-center leading-none ${
        score > 0 ? 'text-indigo-700' : score < 0 ? 'text-red-600' : 'text-slate-600'
      }`}>
        {score}
      </div>
      <button
        onClick={() => onVote(myVote === -1 ? 0 : -1)}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
          myVote === -1 ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'
        }`}
        aria-label="Downvote"
      >
        <ChevronDown className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
}

function AuthorChip({ name }: { name?: string | null }) {
  const initial = name?.slice(0, 1).toUpperCase() ?? '?';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center">
        {initial}
      </span>
      <span className="font-semibold text-slate-600">{name ?? 'Unknown'}</span>
    </span>
  );
}
