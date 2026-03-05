'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FaUserCircle, FaPlusCircle, FaBars, FaTimes, FaExclamationTriangle } from 'react-icons/fa'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { getProvider } from '@/services/blockchain'

const EXPECTED_CLUSTER = process.env.NEXT_PUBLIC_CLUSTER || 'devnet'

// Map cluster name to Solana genesis hash (used to detect wallet network)
const CLUSTER_LABEL: Record<string, string> = {
  devnet: 'Devnet',
  testnet: 'Testnet',
  'mainnet-beta': 'Mainnet',
  localhost: 'Localhost',
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [networkMismatch, setNetworkMismatch] = useState(false)

  const { publicKey, sendTransaction, signTransaction } = useWallet()
  const { connection } = useConnection()

  const program = useMemo(
    () => getProvider(publicKey, signTransaction, sendTransaction),
    [publicKey, signTransaction, sendTransaction]
  )

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Detect network mismatch: compare wallet's actual RPC genesis hash
  useEffect(() => {
    if (!publicKey) {
      setNetworkMismatch(false)
      return
    }

    const checkNetwork = async () => {
      try {
        const genesisHash = await connection.getGenesisHash()
        // Known genesis hashes
        const GENESIS: Record<string, string> = {
          '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d': 'mainnet-beta',
          'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG': 'devnet',
          '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY': 'testnet',
        }
        const detectedCluster = GENESIS[genesisHash] ?? 'unknown'
        setNetworkMismatch(detectedCluster !== EXPECTED_CLUSTER)
      } catch {
        // silently ignore — can't determine network
      }
    }

    checkNetwork()
  }, [publicKey, connection])

  return (
    <header className="bg-white shadow-md fixed w-full top-0 z-50">
      {/* Network Mismatch Warning Banner */}
      {isMounted && networkMismatch && (
        <div className="bg-amber-500 text-white text-center text-sm py-2 px-4 flex items-center justify-center gap-2">
          <FaExclamationTriangle />
          <span>
            ⚠️ Your wallet is on the wrong network! Please switch Phantom to{' '}
            <strong>{CLUSTER_LABEL[EXPECTED_CLUSTER] ?? EXPECTED_CLUSTER}</strong> to use this app.
            (Settings → Developer Settings → Change Network)
          </span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-green-600">
          Solana<span className="text-gray-700">Crowd</span>
        </Link>

        {/* Static Navigation */}
        {program && publicKey && (
          <nav className="hidden md:flex space-x-6 items-center">
            <Link
              href="/account"
              className="text-gray-700 hover:text-green-600 flex items-center space-x-1 transition duration-300"
            >
              <FaUserCircle className="text-gray-700 hover:text-green-600" />
              <span>Account</span>
            </Link>
            <Link
              href="/create"
              className="text-gray-700 hover:text-green-600 flex items-center space-x-1 transition duration-300"
            >
              <FaPlusCircle className="text-gray-700 hover:text-green-600" />
              <span>Create</span>
            </Link>
          </nav>
        )}

        {isMounted && (
          <div className="hidden md:inline-block">
            <WalletMultiButton
              style={{ backgroundColor: '#16a34a', color: 'white' }}
            />
          </div>
        )}

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-gray-700 focus:outline-none"
        >
          {isOpen ? (
            <FaTimes className="w-6 h-6" />
          ) : (
            <FaBars className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <nav className="md:hidden bg-white shadow-md py-4">
          <div className="container mx-auto px-6 space-y-4">
            {program && publicKey && (
              <>
                <Link
                  href="/account"
                  className="text-gray-700 hover:text-green-600 flex items-center space-x-2 transition duration-300"
                >
                  <FaUserCircle />
                  <span>Account</span>
                </Link>
                <Link
                  href="/create"
                  className="text-gray-700 hover:text-green-600 flex items-center space-x-2 transition duration-300"
                >
                  <FaPlusCircle />
                  <span>Create</span>
                </Link>
              </>
            )}
            {isMounted && (
              <WalletMultiButton
                style={{ backgroundColor: '#16a34a', color: 'white' }}
              />
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
