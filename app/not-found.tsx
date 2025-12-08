import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Footer from '@/components/layout/Footer';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/20 to-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="p-8 sm:p-10 md:p-12 lg:p-14 max-w-lg w-full text-center shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <div className="animate-in zoom-in duration-500">
            <h1 className="text-7xl sm:text-8xl md:text-9xl font-extrabold bg-gradient-to-r from-error-500 to-error-600 bg-clip-text text-transparent mb-6 sm:mb-8">
              404
            </h1>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-5">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 leading-relaxed">
            Halaman yang Anda cari tidak tersedia, hubungi admin untuk informasi lebih lanjut.
          </p>
          <Link href="/">
            <Button 
              size="lg"
              className="w-full sm:w-auto min-w-[220px] h-14 sm:h-16 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
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

