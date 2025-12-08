'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Footer from '@/components/layout/Footer';

function SuccessContent() {
  const searchParams = useSearchParams();
  const ticketId = searchParams.get('ticket_id');

  return (
    <Card className="p-8 sm:p-10 md:p-12 lg:p-14 max-w-lg w-full text-center shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
      <div className="animate-in zoom-in duration-500">
        <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-success-100 to-success-200 mb-6 sm:mb-8">
          <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-success-600" />
        </div>
      </div>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 sm:mb-5 bg-gradient-to-r from-success-600 to-success-700 bg-clip-text text-transparent">
        Deposit Berhasil!
      </h1>
      <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
        Invoice telah dibuat. Silakan selesaikan pembayaran Anda.
      </p>
      {ticketId && (
        <div className="mb-8 sm:mb-10 inline-block">
          <p className="text-xs sm:text-sm text-gray-500 mb-2 font-medium">Ticket ID:</p>
          <p className="text-sm sm:text-base font-mono bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 rounded-xl border-2 border-gray-200 font-bold text-primary-600">
            {ticketId}
          </p>
        </div>
      )}
      <Button 
        onClick={() => window.location.href = '/'}
        size="lg"
        className="w-full sm:w-auto min-w-[220px] h-14 sm:h-16 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Kembali ke Beranda
      </Button>
    </Card>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Suspense fallback={
          <Card className="p-8 sm:p-10 md:p-12 lg:p-14 max-w-lg w-full text-center shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <div className="animate-pulse">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gray-200 rounded-full mx-auto mb-6 sm:mb-8" />
              <div className="h-8 sm:h-10 bg-gray-200 rounded mb-4 sm:mb-5" />
              <div className="h-4 sm:h-5 bg-gray-200 rounded mb-6 sm:mb-8" />
              <div className="h-14 sm:h-16 bg-gray-200 rounded" />
            </div>
          </Card>
        }>
          <SuccessContent />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}

