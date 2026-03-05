import { deleteCampaign, fetchCampaignDetails, getProvider } from '@/services/blockchain'
import { globalActions } from '@/store/globalSlices'
import { Campaign, RootState } from '@/utils/interfaces'
import { useWallet } from '@solana/wallet-adapter-react'
import React, { useMemo } from 'react'
import { FaTimes, FaTrashAlt } from 'react-icons/fa'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'

const DeleteModal = ({
  campaign,
  pda,
}: {
  campaign: Campaign
  pda: string
}) => {
  const { publicKey, sendTransaction, signTransaction } = useWallet()
  const { delModal } = useSelector((states: RootState) => states.globalStates)

  const { setDelModal } = globalActions
  const dispatch = useDispatch()

  const program = useMemo(
    () => getProvider(publicKey, signTransaction, sendTransaction),
    [publicKey, signTransaction, sendTransaction]
  )

  const handleDelete = async () => {
    if (!publicKey || !program) return toast.warn('Please connect wallet')

    const toastId = toast.loading('Approve transaction in your wallet...')

    try {
      const tx = await deleteCampaign(program, publicKey, pda!)

      await fetchCampaignDetails(program, pda)
      dispatch(setDelModal('scale-0'))

      toast.update(toastId, {
        render: 'Campaign deleted successfully 👌',
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
        render: isRejected ? 'Transaction cancelled by user' : 'Delete failed 🤯',
        type: isRejected ? 'warning' : 'error',
        isLoading: false,
        autoClose: 5000,
      })
    }
  }

  return (
    <div
      className={`fixed top-0 left-0 w-screen h-screen flex items-center justify-center
      bg-black bg-opacity-50 transform z-[3000] transition-transform duration-300 ${delModal}`}
    >
      <div className="bg-white shadow-lg shadow-slate-900 rounded-xl w-11/12 md:w-2/5 p-6">
        <div className="flex flex-row justify-between items-center mb-6">
          <p className="text-xl font-semibold text-gray-700">
            Are you sure you want to delete this campaign?
          </p>
          <button
            type="button"
            className="border-0 bg-transparent focus:outline-none"
            onClick={() => dispatch(setDelModal('scale-0'))}
          >
            <FaTimes className="text-gray-400" />
          </button>
        </div>

        <div className="mb-6 text-center">
          <p className="text-lg text-gray-600">
            You are about to permanently delete the campaign <br />
            <strong>{campaign.title}</strong>.
          </p>
          <p className="text-sm text-gray-500">This action cannot be undone.</p>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            className="w-full bg-red-600 hover:bg-red-700 text-white
            font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
            onClick={handleDelete}
          >
            <FaTrashAlt />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteModal
