import { apiRequest } from '@/lib/api';

export type SettingType = 'string' | 'integer' | 'boolean' | 'json';

export interface SystemSetting {
  id: number;
  key: string;
  value: string | null;
  cast_value: string | number | boolean | null;
  group: string;
  type: SettingType;
  label: string;
  description: string | null;
}

export type SettingsGrouped = Record<string, SystemSetting[]>;

export const settingsApi = {
  all: () => apiRequest.get<SettingsGrouped>('/admin/settings'),

  update: (settings: Record<string, string | number | boolean>) =>
    apiRequest.put<SettingsGrouped>('/admin/settings', { settings }),

  reset: (key: string) =>
    apiRequest.post<SystemSetting>('/admin/settings/reset', { key }),
};
