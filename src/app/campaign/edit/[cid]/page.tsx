'use client'

import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { campaigns } from '@/data'
import Link from 'next/link'
import { RootState } from '@/utils/interfaces'
import { useSelector } from 'react-redux'
import {
  fetchCampaignDetails,
  getProvider,
  getProviderReadonly,
  updateCampaign,
} from '@/services/blockchain'
import { toast } from 'react-toastify'
import { useWallet } from '@solana/wallet-adapter-react'

export default function Page() {
  const { cid } = useParams()
  const programReadonly = useMemo(() => getProviderReadonly(), [])

  const { publicKey, sendTransaction, signTransaction } = useWallet()
  const { campaign } = useSelector((states: RootState) => states.globalStates)

  const program = useMemo(
    () => getProvider(publicKey, signTransaction, sendTransaction),
    [publicKey, signTransaction, sendTransaction]
  )

  // Local form state
  const [form, setForm] = useState({
    title: campaign?.title || '',
    description: campaign?.description || '',
    image_url: campaign?.imageUrl || '',
    goal: campaign?.goal || '',
  })

  useEffect(() => {
    if (cid && programReadonly) {
      const fetchDetails = async () => {
        const campaignData = await fetchCampaignDetails(
          programReadonly,
          cid as string
        )
        setForm({
          title: campaignData.title,
          description: campaignData.description,
          image_url: campaignData.imageUrl,
          goal: String(campaignData.goal),
        })
      }
      fetchDetails()
    }
  }, [cid, programReadonly])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!publicKey || !program) return toast.warn('Please connect wallet')

    const toastId = toast.loading('Approve transaction in your wallet...')

    try {
      const { title, description, image_url, goal } = form
      const tx = await updateCampaign(
        program,
        publicKey,
        cid as string,
        title,
        description,
        image_url,
        Number(goal)
      )

      toast.update(toastId, {
        render: 'Campaign updated successfully 👌',
        type: 'success',
        isLoading: false,
        autoClose: 5000,
      })
      console.log(tx)
    } catch (error: any) {
      const isRejected =
        error?.name === 'WalletSignTransactionError' ||
        error?.message?.includes('User rejected') ||
        error?.message?.includes('rejected the request')

      toast.update(toastId, {
        render: isRejected ? 'Transaction cancelled by user' : 'Update failed 🤯',
        type: isRejected ? 'warning' : 'error',
        isLoading: false,
        autoClose: 5000,
      })
    }
  }

  // Fallback if campaign not found
  if (!campaign) return <h4>Campaign not found</h4>

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Update Campaign</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="What's the grand title?"
          maxLength={64}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full p-2 border rounded text-black"
          required
        />
        <input
          type="url"
          placeholder="Paste that fancy image URL here!"
          maxLength={256}
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          className="w-full p-2 border rounded text-black"
          required
        />
        <input
          type="text"
          placeholder="How many SOLs for your dream?"
          value={form.goal}
          onChange={(e) => {
            const value = e.target.value
            if (/^\d*\.?\d{0,2}$/.test(value)) {
              setForm({ ...form, goal: value })
            }
          }}
          className="w-full p-2 border rounded text-black"
          required
        />
        <textarea
          placeholder="Tell us the epic tale of your project..."
          maxLength={512}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full p-2 border rounded text-black"
          required
        />

        <div className="mt-4 space-x-4 flex justify-start items-center">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Update Now
          </button>

          <Link
            href={`/campaign/${cid}`}
            className="bg-black hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg text-center"
          >
            Back
          </Link>
        </div>
      </form>
    </div>
  )
}
