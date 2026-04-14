import { AnchorProvider, BN, Program, Wallet } from '@coral-xyz/anchor'
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionSignature,
} from '@solana/web3.js'
import { Fundus } from '../../anchor/target/types/fundus'
import idl from '../../anchor/target/idl/fundus.json'
import { Campaign, ProgramState, Transaction } from '@/utils/interfaces'
import { store } from '@/store'
import { globalActions } from '@/store/globalSlices'
import { getClusterURL } from '@/utils/helper'

let tx: any
const { setCampaign, setDonations, setWithdrawls, setStates } = globalActions
const CLUSTER: string = process.env.NEXT_PUBLIC_CLUSTER || 'localhost'
const RPC_URL: string = getClusterURL(CLUSTER)

export const getProvider = (
  publicKey: PublicKey | null,
  signTransaction: any,
  sendTransaction: any
): Program<Fundus> | null => {
  if (!publicKey || !signTransaction) {
    console.error('Wallet not connected or missing signTransaction')
    return null
  }

  const connection = new Connection(RPC_URL, 'confirmed')
  const provider = new AnchorProvider(
    connection,
    { publicKey, signTransaction, sendTransaction } as unknown as Wallet,
    { commitment: 'processed' }
  )

  return new Program<Fundus>(idl as any, provider)
}

export const getProviderReadonly = (): Program<Fundus> => {
  const connection = new Connection(RPC_URL, 'confirmed')

  const wallet = {
    publicKey: PublicKey.default,
    signTransaction: async () => {
      throw new Error('Read-only provider cannot sign transactions.')
    },
    signAllTransaction: async () => {
      throw new Error('Read-only provider cannot sign transactions.')
    },
  }

  const provider = new AnchorProvider(
    connection,
    wallet as unknown as Wallet,
    { commitment: 'processed' }
  )

  return new Program<Fundus>(idl as any, provider)
}

export const createCampaign = async (
  program: Program<Fundus>,
  publicKey: PublicKey,
  title: string,
  description: string,
  image_url: string,
  goal: number
): Promise<TransactionSignature> => {
  const [programStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('program_state')],
    program.programId
  )

  const state = await program.account.programState.fetch(programStatePda)
  const CID = state.campaign_count.add(new BN(1))

  const [campaignPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('campaign'), CID.toArrayLike(Buffer, 'le', 8)],
    program.programId
  )

  const goalBN = new BN(goal * 1_000_000_000)

  try {
    const tx = await program.methods
      .create_campaign(title, description, image_url, goalBN)
      .accountsPartial({
        program_state: programStatePda,
        campaign: campaignPda,
        creator: publicKey,
        system_program: SystemProgram.programId,
      })
      .rpc()

    // confirm it once
    const connection = new Connection(program.provider.connection.rpcEndpoint, 'confirmed')
    await connection.confirmTransaction(tx, 'finalized')

    return tx
  } catch (err: any) {
    // 👇 handle the "already processed" case
    if (err.message?.includes('already been processed')) {
      console.warn('Transaction already processed, treating as success.')
      return err.signature ?? 'already-processed'
    }
    throw err // rethrow real errors
  }
}

export const updateCampaign = async (
  program: Program<Fundus>,
  publicKey: PublicKey,
  pda: string,
  title: string,
  description: string,
  image_url: string,
  goal: number
): Promise<TransactionSignature> => {
  const campaign = await program.account.campaign.fetch(pda)

  const goalBN = new BN(goal * 1_000_000_000)
  const tx = await program.methods
    .update_campaign(campaign.cid, title, description, image_url, goalBN)
    .accountsPartial({
      campaign: pda,
      creator: publicKey,
      system_program: SystemProgram.programId,
    })
    .rpc()

  const connection = new Connection(
    program.provider.connection.rpcEndpoint,
    'confirmed'
  )

  await connection.confirmTransaction(tx, 'finalized')
  return tx
}

export const deleteCampaign = async (
  program: Program<Fundus>,
  publicKey: PublicKey,
  pda: string
): Promise<TransactionSignature> => {
  const campaign = await program.account.campaign.fetch(pda)

  const tx = await program.methods
    .delete_campaign(campaign.cid)
    .accountsPartial({
      campaign: pda,
      creator: publicKey,
      system_program: SystemProgram.programId,
    })
    .rpc()

  const connection = new Connection(
    program.provider.connection.rpcEndpoint,
    'confirmed'
  )

  await connection.confirmTransaction(tx, 'finalized')
  return tx
}



export const updatePlatform = async (
  program: Program<Fundus>,
  publicKey: PublicKey,
  percent: number
): Promise<TransactionSignature> => {
  const [programStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('program_state')],
    program.programId
  )

  const tx = await program.methods
    .update_platform_settings(new BN(percent))
    .accountsPartial({
      updater: publicKey,
      program_state: programStatePda,
    })
    .rpc()

  const connection = new Connection(
    program.provider.connection.rpcEndpoint,
    'confirmed'
  )

  await connection.confirmTransaction(tx, 'finalized')
  return tx
}

export const donateToCampaign = async (
  program: Program<Fundus>,
  publicKey: PublicKey,
  pda: string,
  amount: number
): Promise<TransactionSignature> => {
  const campaign = await program.account.campaign.fetch(pda)

  const [transactionPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('donor'),
      publicKey.toBuffer(),
      campaign.cid.toArrayLike(Buffer, 'le', 8),
      campaign.donors.add(new BN(1)).toArrayLike(Buffer, 'le', 8),
    ],
    program.programId
  )

  const donation_amount = new BN(Math.round(amount * 1_000_000_000))
  const tx = await program.methods
    .donate(campaign.cid, donation_amount)
    .accountsPartial({
      campaign: pda,
      transaction: transactionPda,
      donor: publicKey,
      system_program: SystemProgram.programId,
    })
    .rpc()

  const connection = new Connection(
    program.provider.connection.rpcEndpoint,
    'confirmed'
  )

  await connection.confirmTransaction(tx, 'finalized')
  return tx
}

export const withdrawFromCampaign = async (
  program: Program<Fundus>,
  publicKey: PublicKey,
  pda: string,
  amount: number
): Promise<TransactionSignature> => {
  const campaign = await program.account.campaign.fetch(pda)

  const [programStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('program_state')],
    program.programId
  )

  const [transactionPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('withdraw'),
      publicKey.toBuffer(),
      campaign.cid.toArrayLike(Buffer, 'le', 8),
      campaign.withdrawals.add(new BN(1)).toArrayLike(Buffer, 'le', 8),
    ],
    program.programId
  )

  const programState = await program.account.programState.fetch(programStatePda)

  const withdraw_amount = new BN(Math.round(amount * 1_000_000_000))
  const tx = await program.methods
    .withdraw(campaign.cid, withdraw_amount)
    .accountsPartial({
      program_state: programStatePda,
      campaign: pda,
      transaction: transactionPda,
      creator: publicKey,
      platform_address: programState.platform_address,
      system_program: SystemProgram.programId,
    })
    .rpc()

  const connection = new Connection(
    program.provider.connection.rpcEndpoint,
    'confirmed'
  )

  await connection.confirmTransaction(tx, 'finalized')
  return tx
}


export const fetchActiveCampaigns = async (
  program: Program<Fundus>
): Promise<Campaign[]> => {
  const campaigns = await program.account.campaign.all()
  const activeCampaigns = campaigns.filter((c) => c.account.active)
  return serializedCampaigns(activeCampaigns)
}

export const fetchUserCampaigns = async (
  program: Program<Fundus>,
  publicKey: PublicKey
): Promise<Campaign[]> => {
  const campaigns = await program.account.campaign.all()
  const useCampaigns = campaigns.filter((c) => {
    return c.account.creator.toBase58() == publicKey.toBase58()
  })
  return serializedCampaigns(useCampaigns)
}

export const fetchCampaignDetails = async (
  program: Program<Fundus>,
  pda: string
): Promise<Campaign | null> => {
  try {
    const campaign = await program.account.campaign.fetch(pda)

    if (!campaign) return null

    const serialized: Campaign = {
      ...campaign,
      publicKey: pda,
      cid: campaign?.cid?.toNumber?.() ?? 0,
      creator: campaign?.creator?.toBase58?.() ?? '',
      goal: (campaign?.goal?.toNumber?.() ?? 0) / 1e9,
      amountRaised: (campaign?.amount_raised?.toNumber?.() ?? 0) / 1e9,
      imageUrl: campaign?.image_url ?? '',
      timestamp: (campaign?.timestamp?.toNumber?.() ?? 0) * 1000,
      donors: campaign?.donors?.toNumber?.() ?? 0,
      withdrawals: campaign?.withdrawals?.toNumber?.() ?? 0,
      balance: (campaign?.balance?.toNumber?.() ?? 0) / 1e9,
    }

    store.dispatch(setCampaign(serialized))
    return serialized
  } catch (error) {
    console.error("fetchCampaignDetails error:", error)
    return null
  }
}

export const fetchAllDonations = async (
  program: Program<Fundus>,
  pda: string
): Promise<Transaction[]> => {
  const campaign = await program.account.campaign.fetch(pda)
  const transactions = await program.account.transaction.all()

  const donations = transactions.filter((tx) => {
  return tx.account.cid.eq(campaign.cid) && tx.account.credited
})

  store.dispatch(setDonations(serializedTxs(donations)))
  return serializedTxs(donations)
}

export const fetchAllWithsrawals = async (
  program: Program<Fundus>,
  pda: string
): Promise<Transaction[]> => {
  const campaign = await program.account.campaign.fetch(pda)
  const transactions = await program.account.transaction.all()

  const withdrawals = transactions.filter((tx) => {
  return tx.account.cid.eq(campaign.cid) && !tx.account.credited
})

  store.dispatch(setWithdrawls(serializedTxs(withdrawals)))
  return serializedTxs(withdrawals)
}

export const fetchProgramState = async (
  program: Program<Fundus>
): Promise<ProgramState | null> => {
  try {
    const [programStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('program_state')],
      program.programId
    )

    const programState = await program.account.ProgramState.fetch(programStatePda)

    if (!programState) return null

    const serialized: ProgramState = {
      ...programState,
      campaignCount: programState?.campaign_count?.toNumber?.() ?? 0,
      platformFee: programState?.platform_fee?.toNumber?.() ?? 0,
      platformAddress: programState?.platform_address?.toBase58?.() ?? '',
    }

    store.dispatch(setStates(serialized))
    return serialized
  } catch (error) {
    console.error("fetchProgramState error:", error)
    return null
  }
}

const serializedCampaigns = (campaigns: any[]): Campaign[] => {
  return campaigns.map((c: any) => ({
    ...c.account,
    publicKey: c.publicKey?.toBase58?.() ?? '',
    cid: c.account?.cid?.toNumber?.() ?? 0,
    creator: c.account?.creator?.toBase58?.() ?? '',
    goal: (c.account?.goal?.toNumber?.() ?? 0) / 1e9,
    amountRaised: (c.account?.amount_raised?.toNumber?.() ?? 0) / 1e9,
    imageUrl: c.account?.image_url ?? '',
    timestamp: (c.account?.timestamp?.toNumber?.() ?? 0) * 1000,
    donors: c.account?.donors?.toNumber?.() ?? 0,
    withdrawals: c.account?.withdrawals?.toNumber?.() ?? 0,
    balance: (c.account?.balance?.toNumber?.() ?? 0) / 1e9,
  }))
}

const serializedTxs = (transactions: any[]): Transaction[] => {
  return transactions.map((c: any) => ({
    ...c.account,
    publicKey: c.publicKey?.toBase58?.() ?? '',
    owner: c.account?.owner?.toBase58?.() ?? '',
    cid: c.account?.cid?.toNumber?.() ?? 0,
    amount: (c.account?.amount?.toNumber?.() ?? 0) / 1e9,
    timestamp: (c.account?.timestamp?.toNumber?.() ?? 0) * 1000,
  }))
}
