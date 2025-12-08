import { notFound } from 'next/navigation';
import DepositForm from '@/components/deposit/DepositForm';
import Footer from '@/components/layout/Footer';
import { getPageTitle, getPageDescription } from '@/lib/payment-routes';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Deposit via E-Wallet',
  description: 'Deposit saldo menggunakan E-Wallet seperti OVO, DANA, ShopeePay, dan lainnya',
};

interface EWalletPageProps {
  params: {
    idagen: string;
  };
}

export default function EWalletPage({ params }: EWalletPageProps) {
  // Validate idagen - redirect to 404 if not present
  if (!params.idagen || params.idagen.trim() === '') {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex flex-col">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 lg:py-16 flex-1">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 sm:mb-10 md:mb-12 space-y-3 sm:space-y-4">
            <div className="inline-block">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-3 sm:mb-4 bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                {getPageTitle('EWALLET')}
              </h1>
            </div>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {getPageDescription('EWALLET')}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 shadow-sm mt-4">
              <span className="text-xs sm:text-sm text-gray-500 font-medium">Agent ID:</span>
              <span className="text-xs sm:text-sm font-bold text-primary-600 font-mono">{params.idagen}</span>
            </div>
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <DepositForm 
              defaultPaymentMethod="EWALLET" 
              hidePaymentMethodSelect={true}
              idagen={params.idagen}
            />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

