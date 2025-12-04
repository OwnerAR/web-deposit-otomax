import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { FeesProvider } from '@/contexts/FeesContext';
import AuthProviderComponent from '@/components/auth/AuthProvider';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'Xendit Deposit',
  description: 'Deposit saldo dengan berbagai metode pembayaran melalui Xendit',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <AuthProviderComponent>
            <FeesProvider>
              {children}
              <Toaster position="top-right" />
            </FeesProvider>
          </AuthProviderComponent>
        </AuthProvider>
      </body>
    </html>
  );
}

