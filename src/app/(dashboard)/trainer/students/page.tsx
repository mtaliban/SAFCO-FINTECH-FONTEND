'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, Search, CheckCircle, BookOpen, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface StudentRow {
  uuid: string | null;
  enrolled_at: string | null;
  progress_percentage: number;
  completed_at: string | null;
  student: {
    uuid: string;
    email: string;
    username: string | null;
    name: string;
    avatar_url: string | null;
  };
  course: {
    uuid: string;
    title: string;
    slug: string;
  };
}

interface Summary {
  total_enrollments: number;
  active: number;
  completed: number;
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface ApiResponse {
  data: StudentRow[];
  meta: Meta;
  summary: Summary;
}

export default function TrainerStudentsPage() {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ total_enrollments: 0, active: 0, completed: 0 });
  const [meta, setMeta] = useState<Meta>({ current_page: 1, last_page: 1, per_page: 20, total: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async (searchVal: string, pageVal: number) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { page: String(pageVal), per_page: '20' };
      if (searchVal.trim()) params.search = searchVal.trim();

      const res = await api.get<{ data: ApiResponse }>('/trainer/my-students', { params });
      const payload = res.data.data;
      setRows(payload.data ?? []);
      setMeta(payload.meta ?? { current_page: 1, last_page: 1, per_page: 20, total: 0 });
      setSummary(payload.summary ?? { total_enrollments: 0, active: 0, completed: 0 });
    } catch {
      setError('Hitilafu ya mtandao. Jaribu tena.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents(search, page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents(search, 1);
  };

  const clearSearch = () => {
    setSearch('');
    setPage(1);
    fetchStudents('', 1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-7 h-7 text-orange-500" /> My Students
        </h1>
        <p className="text-slate-600 mt-1">Wanafunzi waliojisajili kwenye kozi zako.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-500 shrink-0" />
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Total Enrollments</p>
            <p className="text-2xl font-bold text-slate-900">{summary.total_enrollments}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-orange-500 shrink-0" />
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Bado Wanasoma</p>
            <p className="text-2xl font-bold text-slate-900">{summary.active}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-green-500 shrink-0" />
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Wamekamilisha</p>
            <p className="text-2xl font-bold text-slate-900">{summary.completed}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tafuta jina, email, username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
        <button type="submit" className="btn btn-primary">Tafuta</button>
        {search && (
          <button type="button" onClick={clearSearch} className="btn btn-secondary">
            Futa
          </button>
        )}
      </form>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Inapakia...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">{error}</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Hakuna wanafunzi bado</p>
            <p className="text-sm mt-1">Wanafunzi watakaojiandikisha kwenye kozi zako wataonekana hapa.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600">Mwanafunzi</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Email</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Kozi</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Maendeleo</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Alisajili</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Hali</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, i) => (
                  <tr key={`${row.student.uuid}-${row.course.uuid}-${i}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.student.avatar_url ? (
                          <img src={row.student.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-xs">
                            {(row.student.name || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-slate-900">{row.student.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.student.email}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">{row.course.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-200 rounded-full h-1.5">
                          <div
                            className="bg-orange-500 h-1.5 rounded-full"
                            style={{ width: `${row.progress_percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600">{row.progress_percentage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{row.enrolled_at ?? '—'}</td>
                    <td className="px-4 py-3">
                      {row.completed_at ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" /> Imekamilika
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <BookOpen className="w-3 h-3" /> Inaendelea
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-sm text-slate-600">
            <span>
              Ukurasa {meta.current_page} / {meta.last_page} &nbsp;·&nbsp; Jumla: {meta.total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn btn-secondary py-1 px-3 disabled:opacity-40"
              >
                Nyuma
              </button>
              <button
                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                disabled={page >= meta.last_page}
                className="btn btn-secondary py-1 px-3 disabled:opacity-40"
              >
                Mbele
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
