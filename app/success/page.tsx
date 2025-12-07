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
    <Card className="p-6 md:p-8 lg:p-10 max-w-md w-full text-center">
      <CheckCircle className="w-16 h-16 md:w-20 md:h-20 text-success-500 mx-auto mb-4 md:mb-6" />
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3">
        Deposit Berhasil!
      </h1>
      <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
        Invoice telah dibuat. Silakan selesaikan pembayaran Anda.
      </p>
      {ticketId && (
        <p className="text-xs md:text-sm text-gray-500 mb-6 md:mb-8 font-mono bg-gray-100 px-3 py-2 rounded-lg inline-block">
          Ticket ID: {ticketId}
        </p>
      )}
      <Button 
        onClick={() => window.location.href = '/'}
        size="lg"
        className="w-full md:w-auto min-w-[200px]"
      >
        Kembali ke Beranda
      </Button>
    </Card>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 lg:p-8">
        <Suspense fallback={
          <Card className="p-6 md:p-8 lg:p-10 max-w-md w-full text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-full mx-auto mb-4 md:mb-6" />
              <div className="h-8 bg-gray-200 rounded mb-2 md:mb-3" />
              <div className="h-4 bg-gray-200 rounded mb-4 md:mb-6" />
              <div className="h-10 bg-gray-200 rounded" />
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

