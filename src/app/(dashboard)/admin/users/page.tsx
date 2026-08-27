'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, Users, Search, Filter, MoreVertical, ShieldOff, ShieldCheck,
  Trash2, Eye, UserCheck, UserX, ChevronLeft, ChevronRight,
  Mail, Phone, Building2, Calendar, RefreshCw, X, Plus, Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────
type UserRow = {
  id: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  roles: string[];
  profile?: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    position?: string;
    gender?: string;
    profile_picture_thumbnail?: string;
  };
  organization?: { name: string };
  last_login_at?: string;
  created_at: string;
};
type Meta = { total: number; per_page: number; current_page: number; last_page: number };
type UsersResponse = { data: UserRow[]; meta: Meta };

const ROLES = ['student', 'trainer', 'corporate_client', 'system_admin'];
const STATUSES = ['active', 'pending', 'suspended', 'inactive'];
const PER_PAGE = 15;

const STATUS_STYLE: Record<string, string> = {
  active:    'bg-emerald-100 text-emerald-700',
  pending:   'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
  inactive:  'bg-slate-100 text-slate-500',
};

// ── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ user }: { user: UserRow }) {
  const initials = (user.profile?.first_name?.[0] ?? user.email[0]).toUpperCase();
  if (user.profile?.profile_picture_thumbnail) {
    return <img src={user.profile.profile_picture_thumbnail} alt={initials} className="w-9 h-9 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className="w-9 h-9 rounded-full bg-navy-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
      {initials}
    </div>
  );
}

// ── Create / Edit Modal ──────────────────────────────────────────────────────
function UserFormModal({
  user,
  onClose,
}: {
  user?: UserRow;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!user;

  const [form, setForm] = useState({
    full_name:  user?.profile?.full_name  ?? '',
    email:      user?.email               ?? '',
    phone:      user?.phone               ?? '',
    password:   '',
    role:       user?.roles?.[0]          ?? 'student',
    status:     user?.status              ?? 'active',
    position:   user?.profile?.position  ?? '',
    gender:     user?.profile?.gender    ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mut = useMutation({
    mutationFn: (payload: typeof form) =>
      isEdit
        ? apiRequest.put(`/admin/users/${user!.id}`, payload)
        : apiRequest.post('/admin/users', payload),
    onSuccess: () => {
      toast.success(isEdit ? 'User updated' : 'User created');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      onClose();
    },
    onError: (err: any) => {
      const serverErrors = err?.response?.data?.errors;
      if (serverErrors) {
        const flat: Record<string, string> = {};
        Object.entries(serverErrors).forEach(([k, v]) => {
          flat[k] = Array.isArray(v) ? (v as string[])[0] : String(v);
        });
        setErrors(flat);
      } else {
        toast.error(err?.response?.data?.message ?? 'Something went wrong');
      }
    },
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form };
    if (isEdit && !payload.password) delete (payload as any).password;
    mut.mutate(payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-navy-500">
          <h2 className="font-black text-white text-lg">
            {isEdit ? 'Edit User' : 'Create New User'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Full name */}
          <div>
            <label className="label">Jina Kamili *</label>
            <input className={cn('input', errors.full_name && 'border-red-400')}
              value={form.full_name} onChange={(e) => set('full_name', e.target.value)}
              placeholder="Amina Mohamed" />
            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Email *</label>
              <input type="email" className={cn('input', errors.email && 'border-red-400')}
                value={form.email} onChange={(e) => set('email', e.target.value)}
                placeholder="amina@example.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="label">Simu</label>
              <input className="input" value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+255712345678" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="label">
              Password {isEdit && <span className="text-slate-400 font-normal">(acha wazi kama hutabadilisha)</span>}
              {!isEdit && '*'}
            </label>
            <input type="password" className={cn('input', errors.password && 'border-red-400')}
              value={form.password} onChange={(e) => set('password', e.target.value)}
              placeholder="Angalau herufi 8, namba na capital" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Role + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Role *</label>
              <select className={cn('input', errors.role && 'border-red-400')}
                value={form.role} onChange={(e) => set('role', e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                ))}
              </select>
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
            </div>
            <div>
              <label className="label">Status *</label>
              <select className="input" value={form.status}
                onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Position + Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Position / Kazi</label>
              <input className="input" value={form.position}
                onChange={(e) => set('position', e.target.value)}
                placeholder="Accountant, Trainer..." />
            </div>
            <div>
              <label className="label">Jinsi</label>
              <select className="input" value={form.gender}
                onChange={(e) => set('gender', e.target.value)}>
                <option value="">-- Chagua --</option>
                <option value="male">Mume</option>
                <option value="female">Mke</option>
                <option value="other">Nyingine</option>
                <option value="prefer_not_to_say">Sitaki kuweka</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 btn-secondary">
              Ghairi
            </button>
            <button type="submit" disabled={mut.isPending}
              className="flex-1 btn-primary flex items-center justify-center gap-2">
              {mut.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Inahifadhi...</>
                : isEdit ? 'Hifadhi Mabadiliko' : 'Unda Mtumiaji'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── View Drawer ───────────────────────────────────────────────────────────────
function UserDrawer({
  user, onClose, onEdit, onStatusChange,
}: {
  user: UserRow;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (uuid: string, status: string) => void;
}) {
  const isActive = user.status === 'active';
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-sm bg-white shadow-2xl flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-navy-500">
          <h2 className="font-black text-white">User Details</h2>
          <div className="flex items-center gap-2">
            <button onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-white/15 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <Avatar user={user} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 truncate">{user.profile?.full_name ?? '—'}</div>
              <div className="text-xs text-slate-500">{user.profile?.position ?? 'No position'}</div>
            </div>
            <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold capitalize shrink-0', STATUS_STYLE[user.status])}>
              {user.status}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 text-slate-600"><Mail className="w-4 h-4 text-slate-400 shrink-0" />{user.email}</div>
            {user.phone && <div className="flex items-center gap-3 text-slate-600"><Phone className="w-4 h-4 text-slate-400 shrink-0" />{user.phone}</div>}
            {user.organization && <div className="flex items-center gap-3 text-slate-600"><Building2 className="w-4 h-4 text-slate-400 shrink-0" />{user.organization.name}</div>}
            <div className="flex items-center gap-3 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              Joined {new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            {user.last_login_at && (
              <div className="flex items-center gap-3 text-slate-500 text-xs">
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                Last login: {new Date(user.last_login_at).toLocaleString('en-GB')}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-b border-slate-100">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Roles</div>
          <div className="flex flex-wrap gap-2">
            {(user.roles ?? []).map((r) => (
              <span key={r} className="px-3 py-1 rounded-full bg-navy-50 text-navy-600 text-xs font-semibold capitalize border border-navy-100">
                {r.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Actions</div>
          {isActive ? (
            <button onClick={() => { onStatusChange(user.id, 'suspended'); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition text-sm font-semibold">
              <ShieldOff className="w-4 h-4" /> Suspend Account
            </button>
          ) : (
            <button onClick={() => { onStatusChange(user.id, 'active'); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition text-sm font-semibold">
              <ShieldCheck className="w-4 h-4" /> Activate Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch]     = useState('');
  const [role, setRole]         = useState('');
  const [status, setStatus]     = useState('');
  const [page, setPage]         = useState(1);
  const [viewing, setViewing]   = useState<UserRow | null>(null);
  const [editing, setEditing]   = useState<UserRow | null | 'new'>('new' as any);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Reset editing to null initially
  const [showForm, setShowForm] = useState(false);
  const [formUser, setFormUser] = useState<UserRow | undefined>(undefined);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'users', search, role, status, page],
    queryFn: () => {
      const params = new URLSearchParams({ per_page: String(PER_PAGE), page: String(page) });
      if (search) params.set('search', search);
      if (role)   params.set('role', role);
      if (status) params.set('status', status);
      return apiRequest.get<UsersResponse>(`/admin/users?${params}`);
    },
    placeholderData: (prev) => prev,
  });

  const statusMut = useMutation({
    mutationFn: ({ uuid, newStatus }: { uuid: string; newStatus: string }) =>
      apiRequest.patch(`/admin/users/${uuid}/status`, { status: newStatus }),
    onSuccess: (_, { newStatus }) => {
      toast.success(`User ${newStatus === 'active' ? 'activated' : newStatus}`);
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMut = useMutation({
    mutationFn: (uuid: string) => apiRequest.delete(`/admin/users/${uuid}`),
    onSuccess: () => {
      toast.success('User archived');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Failed to archive user'),
  });

  const users = data?.data ?? [];
  const meta  = data?.meta;

  function openCreate() { setFormUser(undefined); setShowForm(true); setViewing(null); }
  function openEdit(u: UserRow) { setFormUser(u); setShowForm(true); setViewing(null); }

  function handleStatusChange(uuid: string, newStatus: string) {
    statusMut.mutate({ uuid, newStatus });
  }

  function handleDelete(uuid: string, email: string) {
    if (!confirm(`Archive user "${email}"? This cannot be undone.`)) return;
    deleteMut.mutate(uuid);
    setMenuOpen(null);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-orange-500" /> Manage Users
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {meta ? `${meta.total} users total` : 'Loading...'} · Create, edit, suspend, or archive
          </p>
        </div>
        <button onClick={openCreate}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Create User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9 h-10" placeholder="Search name, email, phone…"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select className="input pl-8 h-10 text-sm" value={role}
              onChange={(e) => { setRole(e.target.value); setPage(1); }}>
              <option value="">All roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <select className="input h-10 text-sm px-3" value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto relative">
        {isFetching && !isLoading && (
          <div className="absolute top-3 right-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
        )}

        {isLoading ? (
          <div className="p-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-navy-500" /></div>
        ) : (
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-navy-500">
              <tr>
                {['User', 'Role', 'Organization', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white/80">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-navy-50/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar user={u} />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate max-w-[160px]">
                          {u.profile?.full_name ?? '—'}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[160px]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {(u.roles ?? []).map((r) => (
                      <span key={r} className="inline-block text-xs px-2 py-0.5 mr-1 rounded-full bg-navy-50 text-navy-600 border border-navy-100 capitalize">
                        {r.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{u.organization?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold capitalize', STATUS_STYLE[u.status])}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Edit */}
                      <button title="Edit" onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-navy-600 hover:bg-navy-50 transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {/* View */}
                      <button title="View details" onClick={() => setViewing(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-navy-600 hover:bg-navy-50 transition">
                        <Eye className="w-4 h-4" />
                      </button>
                      {/* Suspend/Activate */}
                      {u.status === 'active' ? (
                        <button title="Suspend" onClick={() => handleStatusChange(u.id, 'suspended')}
                          disabled={statusMut.isPending}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition">
                          <ShieldOff className="w-4 h-4" />
                        </button>
                      ) : (
                        <button title="Activate" onClick={() => handleStatusChange(u.id, 'active')}
                          disabled={statusMut.isPending}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition">
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      )}
                      {/* More */}
                      <div className="relative">
                        <button title="More" onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen === u.id && (
                          <div className="absolute right-0 top-8 z-20 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 text-sm">
                            <button onClick={() => { handleStatusChange(u.id, 'inactive'); setMenuOpen(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-50">
                              <UserX className="w-4 h-4" /> Mark Inactive
                            </button>
                            <button onClick={() => { handleStatusChange(u.id, 'pending'); setMenuOpen(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-amber-600 hover:bg-amber-50">
                              <UserCheck className="w-4 h-4" /> Set Pending
                            </button>
                            <div className="border-t border-slate-100 my-1" />
                            <button onClick={() => handleDelete(u.id, u.email)} disabled={deleteMut.isPending}
                              className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" /> Archive User
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <div className="font-medium">No users found</div>
                    <div className="text-sm mt-1">Adjust your filters or <button onClick={openCreate} className="text-navy-500 underline font-semibold">create a new user</button></div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, meta.total)} of {meta.total}
            </span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-700 px-2">{page} / {meta.last_page}</span>
              <button disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Drawer */}
      {viewing && (
        <UserDrawer
          user={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { openEdit(viewing); setViewing(null); }}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <UserFormModal
          user={formUser}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Close dropdown on outside click */}
      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
    </div>
  );
}
