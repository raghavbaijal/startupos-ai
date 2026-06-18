import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'StartupOS AI - Your Intelligent AI Co-Founder',
  description: 'Turn your startup ideas into execution-ready business validation reports, branding assets, financial forecasts, slide decks, and marketing plans.',
  keywords: 'startup generator, ai co-founder, business validation, competitor analysis, branding studio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="antialiased min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-slate-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
