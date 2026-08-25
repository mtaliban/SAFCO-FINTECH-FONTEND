import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Resolve a backend media path to an absolute URL.
 *  - If the path is already absolute (http/https/s3), return as-is.
 *  - Otherwise prefix with the Next.js proxy so browsers never hit HTTP directly.
 */
export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `/api/proxy${path.startsWith('/') ? '' : '/'}${path}`;
}
