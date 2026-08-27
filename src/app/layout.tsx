import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'SAFCO FINTECH LMS',
    template: '%s - SAFCO LMS',
  },
  description: "Tanzania's leading professional training and assessment platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
