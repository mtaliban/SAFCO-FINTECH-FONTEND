'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { apiRequest } from '@/lib/api';

interface ProfileForm {
  full_name: string;
  first_name: string;
  last_name: string;
  gender: string;
  position: string;
  department: string;
  bio: string;
  city: string;
  country: string;
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<ProfileForm>({});

  useEffect(() => {
    if (user?.profile) {
      reset({
        full_name: user.profile.full_name,
        first_name: user.profile.first_name ?? '',
        last_name: user.profile.last_name ?? '',
        gender: user.profile.gender ?? '',
        position: user.profile.position ?? '',
        department: user.profile.department ?? '',
        bio: user.profile.bio ?? '',
        city: user.profile.address.city ?? '',
        country: user.profile.address.country ?? '',
      });
    }
  }, [user, reset]);

  async function onSubmit(data: ProfileForm) {
    try {
      const updated = await apiRequest.patch<typeof user>('/users/profile', data);
      if (updated) setUser(updated);
      await fetchMe();
      toast.success('Profile imesasishwa!');
    } catch {
      // handled by interceptor
    }
  }

  async function onUploadPicture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('picture', file);

    try {
      await apiRequest.post('/users/profile/picture', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchMe();
      toast.success('Picha imesasishwa! Thumbnail inatengenezwa background.');
    } catch {
      // handled
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-slate-600 mt-1">Simamia taarifa zako binafsi.</p>
      </div>

      {/* Picture */}
      <div className="card p-6 mb-6 flex items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-3xl overflow-hidden">
          {user?.profile?.profile_picture_thumbnail ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={user.profile.profile_picture_thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            (user?.profile?.first_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()
          )}
        </div>
        <div>
          <label className="btn-primary cursor-pointer">
            Change Picture
            <input type="file" accept="image/*" onChange={onUploadPicture} className="hidden" />
          </label>
          <p className="text-xs text-slate-500 mt-2">JPG/PNG/WEBP, max 5MB. Uploads to S3.</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Jina Kamili" name="full_name" register={register} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" name="first_name" register={register} />
            <Field label="Last Name" name="last_name" register={register} />
          </div>
          <SelectField label="Jinsi" name="gender" register={register}>
            <option value="">--</option>
            <option value="male">Mume</option>
            <option value="female">Mke</option>
            <option value="other">Nyingine</option>
            <option value="prefer_not_to_say">Sitaki kuweka</option>
          </SelectField>
          <Field label="Position" name="position" register={register} />
          <Field label="Department" name="department" register={register} />
          <Field label="Country" name="country" register={register} />
          <Field label="City" name="city" register={register} />
        </div>

        <div>
          <label className="label">Bio</label>
          <textarea rows={3} className="input" placeholder="Tell us about yourself..." {...register('bio')} />
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={isSubmitting || !isDirty} className="btn-primary">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function Field({ label, name, register }: { label: string; name: keyof ProfileForm; register: any }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" {...register(name)} />
    </div>
  );
}

function SelectField({
  label,
  name,
  register,
  children,
}: {
  label: string;
  name: keyof ProfileForm;
  register: any;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input" {...register(name)}>{children}</select>
    </div>
  );
}
