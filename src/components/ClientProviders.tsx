'use client'

import Header from '@/components/Header'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify'
import { ReactQueryProvider } from '@/app/react-query-provider'
import AppWalletProvider from '@/components/AppWalletProvider'
import { Provider } from 'react-redux'
import { store } from '@/store'

export default function ClientProviders({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ReactQueryProvider>
            <Provider store={store}>
                <AppWalletProvider>
                    <Header />
                    <main className="max-w-6xl mx-auto min-h-screen bg-white">
                        <div className="h-24" />
                        {children}
                        <div className="h-24" />
                    </main>

                    <ToastContainer
                        position="bottom-center"
                        autoClose={5000}
                        hideProgressBar={false}
                        newestOnTop={false}
                        closeOnClick
                        rtl={false}
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                        theme="dark"
                    />
                </AppWalletProvider>
            </Provider>
        </ReactQueryProvider>
    )
}
