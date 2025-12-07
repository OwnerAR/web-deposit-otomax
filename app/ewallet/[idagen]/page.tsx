import { notFound } from 'next/navigation';
import DepositForm from '@/components/deposit/DepositForm';
import Header from '@/components/layout/Header';
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
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12 flex-1">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 md:mb-3">
              {getPageTitle('EWALLET')}
            </h1>
            <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto">
              {getPageDescription('EWALLET')}
            </p>
            <p className="text-xs md:text-sm text-gray-500 mt-2">
              Agent ID: {params.idagen}
            </p>
          </div>
          <DepositForm 
            defaultPaymentMethod="EWALLET" 
            hidePaymentMethodSelect={true}
            idagen={params.idagen}
          />
        </div>
      </div>
      <Footer />
    </main>
  );
}

