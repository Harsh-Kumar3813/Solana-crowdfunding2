import './globals.css'
import type { Metadata } from 'next'
import ClientProviders from '@/components/ClientProviders'
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

export const metadata: Metadata = {
  title: 'SolanaCrowd — Decentralized Crowdfunding',
  description: 'A decentralized crowdfunding platform on the Solana blockchain.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white">
        <ClientProviders>
          {children}
        </ClientProviders>

        {/* ✅ ADD THIS */}
        <ToastContainer />
      </body>
    </html>
  )
}