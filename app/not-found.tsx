import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 lg:p-8">
        <Card className="p-6 md:p-8 lg:p-10 max-w-md w-full text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-error-600 mb-4 md:mb-6">404</h1>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">
            Halaman yang Anda cari tidak tersedia, hubungi admin untuk informasi lebih lanjut.
          </p>
          <Link href="/">
            <Button 
              size="lg"
              className="w-full md:w-auto min-w-[200px]"
            >
              Kembali ke Beranda
            </Button>
          </Link>
        </Card>
      </div>
      <Footer />
    </main>
  );
}

