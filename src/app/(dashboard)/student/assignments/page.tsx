'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2, ClipboardList, ArrowRight, CheckCircle2, Clock, AlertTriangle, Trophy,
} from 'lucide-react';
import { assignmentApi, type Assignment } from '@/lib/course/api';

type Status = NonNullable<Assignment['my_status']>;

const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-slate-700', bg: 'bg-slate-100' },
  overdue: { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-100' },
  submitted: { label: 'Submitted', color: 'text-navy-600', bg: 'bg-navy-100' },
  graded: { label: 'Graded', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  returned: { label: 'Returned', color: 'text-amber-700', bg: 'bg-amber-100' },
};

export default function StudentAssignmentsListPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => assignmentApi.studentIndex(),
  });

  // Group by status for a clean layout
  const groups: Record<Status, Assignment[]> = { pending: [], overdue: [], submitted: [], graded: [], returned: [] };
  for (const a of data) groups[(a.my_status ?? 'pending') as Status].push(a);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-orange-500" /> Assignments
        </h1>
        <p className="text-slate-600 mt-1">Download briefs, upload your answers, get feedback (SRS Module 9).</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
      ) : data.length === 0 ? (
        <div className="card p-12 text-center">
          <ClipboardList className="w-16 h-16 mx-auto text-slate-300 mb-3" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Hakuna assignments bado</h3>
          <p className="text-slate-500">Assignments zitatokea hapa ukishajiunga na kozi zenye assignments.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {(['overdue', 'pending', 'submitted', 'graded', 'returned'] as Status[]).map((s) => (
            groups[s].length > 0 && <AssignmentGroup key={s} status={s} rows={groups[s]} />
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentGroup({ status, rows }: { status: Status; rows: Assignment[] }) {
  const meta = STATUS_META[status];
  return (
    <div>
      <h2 className={`text-lg font-bold mb-3 flex items-center gap-2 ${meta.color}`}>
        {status === 'graded' ? <Trophy className="w-5 h-5" />
         : status === 'overdue' ? <AlertTriangle className="w-5 h-5" />
         : status === 'submitted' ? <CheckCircle2 className="w-5 h-5" />
         : <Clock className="w-5 h-5" />}
        {meta.label} <span className="text-sm text-slate-400 font-normal">({rows.length})</span>
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((a) => <AssignmentCard key={a.uuid} a={a} />)}
      </div>
    </div>
  );
}

function AssignmentCard({ a }: { a: Assignment }) {
  const status = (a.my_status ?? 'pending') as Status;
  const meta = STATUS_META[status];
  return (
    <Link href={`/student/assignments/${a.uuid}`} className="card p-5 hover:shadow-md hover:border-brand-300 transition flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${meta.bg} ${meta.color}`}>{meta.label}</span>
        <span className="text-xs text-slate-500">{a.max_points} pts</span>
      </div>
      <h3 className="font-bold text-slate-900 mb-1">{a.title}</h3>
      {a.course && <p className="text-xs text-slate-500 mb-2">📚 {a.course.title}{a.lesson ? ` · ${a.lesson.title}` : ''}</p>}

      <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
        <div>
          {a.due_date ? (
            <>Due: <strong className={status === 'overdue' ? 'text-red-700' : 'text-slate-800'}>
              {new Date(a.due_date).toLocaleDateString()}
            </strong></>
          ) : 'No deadline'}
        </div>
        {status === 'graded' && a.my_grade !== null && a.my_grade !== undefined && (
          <div className="font-bold text-emerald-700">{a.my_grade} / {a.max_points}</div>
        )}
        <ArrowRight className="w-4 h-4 text-slate-400" />
      </div>
    </Link>
  );
}
