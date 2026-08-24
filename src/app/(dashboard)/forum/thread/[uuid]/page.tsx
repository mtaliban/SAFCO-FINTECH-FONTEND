'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowUp, ArrowDown, Check, Loader2, Send, Pin, Lock, EyeOff,
  Flag, Reply as ReplyIcon, Trash2, MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { forumApi, type PostView, type ThreadShowResponse } from '@/lib/forum/api';
import { timeAgo } from '../../_shared';

export default function ThreadDetailPage() {
  const params = useParams();
  const uuid = params?.uuid as string;
  const router = useRouter();
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
    onSuccess: () => toast.success('Report submitted. Moderator will review.'),
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });

  if (isLoading || !data) {
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>;
  }

  const { thread, posts, permissions } = data;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-4">
      <Link href={`/forum/${thread.category.slug}`} className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to {thread.category.name}
      </Link>

      {/* Thread header + body */}
      <div className="card p-5 flex gap-4">
        <VoteBar
          score={thread.votes_score}
          myVote={thread.my_vote}
          onVote={(v) => voteThreadMut.mutate(v)}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {thread.is_pinned && <Chip color="amber" icon={Pin}>Pinned</Chip>}
            {thread.is_locked && <Chip color="red" icon={Lock}>Locked</Chip>}
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${chipCategory(thread.category.color)}`}>
              {thread.category.name}
            </span>
            {thread.assignment && (
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Assignment: {thread.assignment.title}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{thread.title}</h1>
          <div className="mt-3 whitespace-pre-wrap text-slate-800">{thread.body}</div>
          <footer className="mt-4 text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1 items-center">
            <span>Asked by <b>{thread.author?.name}</b></span>
            {thread.created_at && <span>· {timeAgo(thread.created_at)}</span>}
            <span>· {thread.views_count} views</span>
            <button
              onClick={() => reportMut.mutate({ type: 'thread', id: thread.uuid })}
              className="ml-auto text-red-600 hover:underline inline-flex items-center gap-1"
            >
              <Flag className="w-3 h-3" /> Report
            </button>
          </footer>

          {/* Moderator controls */}
          {permissions.can_moderate && (
            <div className="mt-4 border-t pt-3 flex flex-wrap gap-2">
              <button onClick={() => moderateMut.mutate({ is_pinned: !thread.is_pinned })} className="btn-secondary text-xs">
                <Pin className="w-3 h-3" /> {thread.is_pinned ? 'Unpin' : 'Pin'}
              </button>
              <button onClick={() => moderateMut.mutate({ is_locked: !thread.is_locked })} className="btn-secondary text-xs">
                <Lock className="w-3 h-3" /> {thread.is_locked ? 'Unlock' : 'Lock'}
              </button>
              <button onClick={() => moderateMut.mutate({ is_hidden: true })} className="btn-secondary text-xs text-red-700">
                <EyeOff className="w-3 h-3" /> Hide
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      <h2 className="text-lg font-bold text-slate-900 pt-2 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" /> {posts.length} {posts.length === 1 ? 'Reply' : 'Replies'}
        {thread.category.supports_accepted_answer && !posts.find((p) => p.is_accepted_answer) && permissions.can_accept_answer && (
          <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-normal">
            No accepted answer yet
          </span>
        )}
      </h2>

      <div className="space-y-3">
        {posts.map((p) => (
          <PostCard
            key={p.uuid}
            post={p}
            supportsAccepted={thread.category.supports_accepted_answer}
            canAccept={permissions.can_accept_answer}
            canModerate={permissions.can_moderate}
            onVote={(v) => votePostMut.mutate({ id: p.uuid, v })}
            onAccept={() => acceptMut.mutate(p.uuid)}
            onReply={() => setReplyingTo({ id: (p as any).id ?? 0, name: p.author?.name ?? 'user' })}
            onDelete={() => {
              if (!confirm('Delete this post?')) return;
              deletePostMut.mutate(p.uuid);
            }}
            onReport={() => reportMut.mutate({ type: 'post', id: p.uuid })}
          />
        ))}
      </div>

      {/* Reply box */}
      {permissions.can_reply ? (
        <div className="card p-4 mt-6">
          {replyingTo && (
            <div className="text-xs text-slate-500 mb-1">
              Replying to <b>{replyingTo.name}</b>
              <button onClick={() => setReplyingTo(null)} className="ml-2 text-red-600">cancel</button>
            </div>
          )}
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            className="w-full min-h-[100px] p-3 rounded border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
            placeholder="Write a helpful reply..."
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-slate-500">Use @name to mention someone.</div>
            <button
              disabled={replyBody.trim().length < 2 || replyMut.isPending}
              onClick={() => replyMut.mutate()}
              className="btn-primary"
            >
              {replyMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post reply
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-4 text-center text-slate-500">
          {thread.is_locked ? 'This thread is locked. No new replies allowed.' : 'Please log in to reply.'}
        </div>
      )}
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
    <div className={`card p-4 flex gap-4 ${post.is_accepted_answer ? 'border-2 border-emerald-500 bg-emerald-50/30' : ''}`}>
      <VoteBar
        score={post.votes_score}
        myVote={post.my_vote}
        onVote={onVote}
        accepted={post.is_accepted_answer}
      />
      <div className="flex-1 min-w-0">
        {post.is_accepted_answer && (
          <div className="text-xs uppercase font-bold text-emerald-700 mb-1 flex items-center gap-1">
            <Check className="w-3 h-3" /> Accepted answer
          </div>
        )}
        <div className="whitespace-pre-wrap text-slate-800">{post.body}</div>
        <footer className="mt-3 text-xs text-slate-500 flex flex-wrap gap-x-3 items-center">
          <span>by <b>{post.author?.name}</b></span>
          {post.created_at && <span>· {timeAgo(post.created_at)}</span>}
          {post.edited_at && <span>· edited</span>}
          <button onClick={onReply} className="ml-2 text-brand-600 hover:underline inline-flex items-center gap-1">
            <ReplyIcon className="w-3 h-3" /> Reply
          </button>
          <button onClick={onReport} className="text-red-600 hover:underline inline-flex items-center gap-1">
            <Flag className="w-3 h-3" /> Report
          </button>
          {supportsAccepted && canAccept && !post.is_accepted_answer && (
            <button onClick={onAccept} className="text-emerald-700 hover:underline inline-flex items-center gap-1 font-semibold">
              <Check className="w-3 h-3" /> Accept as answer
            </button>
          )}
          {(post.can_edit || canModerate) && (
            <button onClick={onDelete} className="text-red-600 hover:underline inline-flex items-center gap-1 ml-auto">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function VoteBar({ score, myVote, onVote, accepted }: {
  score: number;
  myVote: -1 | 0 | 1;
  onVote: (v: -1 | 0 | 1) => void;
  accepted?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-slate-500">
      <button
        onClick={() => onVote(myVote === 1 ? 0 : 1)}
        className={`w-8 h-8 rounded flex items-center justify-center hover:bg-slate-100 ${myVote === 1 ? 'bg-emerald-100 text-emerald-700' : ''}`}
        aria-label="Upvote"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
      <div className={`font-bold ${score > 0 ? 'text-emerald-700' : score < 0 ? 'text-red-700' : 'text-slate-800'}`}>
        {score}
      </div>
      <button
        onClick={() => onVote(myVote === -1 ? 0 : -1)}
        className={`w-8 h-8 rounded flex items-center justify-center hover:bg-slate-100 ${myVote === -1 ? 'bg-red-100 text-red-700' : ''}`}
        aria-label="Downvote"
      >
        <ArrowDown className="w-5 h-5" />
      </button>
      {accepted && <Check className="w-5 h-5 text-emerald-600 mt-1" />}
    </div>
  );
}

function Chip({ color, icon: Icon, children }: {
  color: 'amber' | 'red';
  icon: any;
  children: React.ReactNode;
}) {
  const cls = color === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';
  return (
    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${cls}`}>
      <Icon className="w-3 h-3" /> {children}
    </span>
  );
}

function chipCategory(c: string | null): string {
  switch (c) {
    case 'blue': return 'bg-blue-100 text-blue-700';
    case 'amber': return 'bg-amber-100 text-amber-800';
    case 'emerald': return 'bg-emerald-100 text-emerald-800';
    default: return 'bg-slate-100 text-slate-700';
  }
}
