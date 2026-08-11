import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  href?: string;
  width?: number;
  height?: number;
  showText?: boolean; // false = icon only (for tight spaces)
  variant?: 'default' | 'white'; // 'white' assumes dark background
}

/**
 * Official SAFCO FinTech logo. Sourced from /public/logo.png.
 * Always use this component rather than embedding <img> tags so that
 * a future logo update is a one-file change.
 */
export function Logo({
  className,
  href = '/',
  width = 160,
  height = 48,
  showText = true,
  variant = 'default',
}: LogoProps) {
  const img = (
    <Image
      src="/logo.png"
      alt="SAFCO FinTech"
      width={width}
      height={height}
      priority
      className={cn(
        'object-contain',
        variant === 'white' && 'brightness-0 invert'
      )}
    />
  );

  if (!href) return <span className={className}>{img}</span>;

  return (
    <Link href={href} className={cn('inline-flex items-center', className)}>
      {img}
    </Link>
  );
}
