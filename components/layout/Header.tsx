export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-md border-b border-gray-200">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">
            {process.env.NEXT_PUBLIC_APP_NAME || 'Xendit Deposit'}
          </h1>
        </div>
      </div>
    </header>
  );
}

