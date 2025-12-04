# Xendit Deposit Web

Frontend web application untuk melakukan deposit dengan berbagai metode pembayaran melalui Xendit API.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form + Zod
- **HTTP Client**: Fetch API
- **UI Components**: Custom components dengan Tailwind CSS
- **Icons**: Lucide React
- **Toast Notifications**: react-hot-toast

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm atau yarn

### Installation

1. Install dependencies:
```bash
npm install
# atau
yarn install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Update `.env.local` dengan konfigurasi yang diperlukan:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME=Xendit Deposit

# Deposit Amount Configuration (optional, defaults shown)
NEXT_PUBLIC_MIN_DEPOSIT_AMOUNT=10000
NEXT_PUBLIC_MAX_DEPOSIT_AMOUNT=100000000
```

4. Run development server:
```bash
npm run dev
# atau
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home/Deposit page
│   ├── success/           # Success page
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Reusable UI components
│   ├── deposit/           # Deposit form components
│   └── layout/            # Layout components
├── lib/                   # Utilities and configurations
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## Features

- ✅ Form validation dengan Zod
- ✅ Real-time payment summary calculation
- ✅ Multiple payment methods (VA Bank, Retail, QRIS, E-Wallet)
- ✅ Responsive design (mobile-first)
- ✅ Toast notifications
- ✅ Error handling
- ✅ TypeScript support

## Build for Production

```bash
npm run build
npm start
```

## License

MIT

# web-deposit-otomax
