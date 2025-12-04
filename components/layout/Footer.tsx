export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <p className="text-center text-xs md:text-sm text-gray-500">
          © {new Date().getFullYear()} ETAN. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

