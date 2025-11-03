import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from '@/components/SessionProvider';
import Navbar from '@/components/Navbar';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'Image4Marketing - Générateur d\'images marketing',
  description: 'Transformez vos photos de plats en images marketing professionnelles',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-white min-h-screen">
        <SessionProvider>
          <Navbar />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#000000',
                color: '#ffffff',
                border: '1px solid #e5e5e5',
              },
              success: {
                iconTheme: {
                  primary: '#000000',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#000000',
                  secondary: '#ffffff',
                },
              },
            }}
          />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
