// app/layout.tsx (server component)
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { Playfair_Display, Spectral, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import DemoControlDock from '@/components/DemoControlDock';
import { resolveLocation } from '@/lib/location';
import './globals.css';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });
const spectral = Spectral({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-spectral',
  display: 'swap',
});
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const initialLocation = resolveLocation(); // cookie override, then x-nf-geo, then default
  const initialDemo = cookies().get('cw_demo')?.value === '1'; // dock stays on across pages (Section 11)

  return (
    <html lang="en">
      <body className={`${playfair.variable} ${spectral.variable} ${jetbrains.variable} bg-cw-parchment text-cw-charcoal cw-font-body min-h-screen selection:bg-cw-tint-rust selection:text-cw-charcoal`}>
        {children}
        <Suspense fallback={null}>
          <DemoControlDock initialLocation={initialLocation} initialDemo={initialDemo} />
        </Suspense>
        <Toaster position="bottom-center" richColors={false} />
      </body>
    </html>
  );
}
