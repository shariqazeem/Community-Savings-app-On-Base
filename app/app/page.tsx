'use client';

import { useAccount } from 'wagmi';
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Avatar, Name, Identity, Address } from '@coinbase/onchainkit/identity';
import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { Sparkles, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import CommitteeList from '../components/CommitteeList';
import CreateModal from '../components/CreateModal';
import JoinModal from '../components/JoinModal';
import DetailedCommitteeModal from '../components/DetailedCommitteeModal';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

const ABI = [
    // Create Committee - NOW RETURNS (uint256, bytes32)
    { 
      "inputs": [
        { "name": "_name", "type": "string" },
        { "name": "_contributionAmount", "type": "uint256" },
        { "name": "_maxMembers", "type": "uint8" },
        { "name": "_roundDuration", "type": "uint256" },
        { "name": "_startDate", "type": "uint256" },
        { "name": "_isPrivate", "type": "bool" }
      ],
      "name": "createCommittee",
      "outputs": [
        { "type": "uint256" },
        { "type": "bytes32" }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    
    // Join Committee - NOW REQUIRES inviteCode
    {
      "inputs": [
        { "name": "_id", "type": "uint256" },
        { "name": "_inviteCode", "type": "bytes32" }
      ],
      "name": "joinCommittee",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    
    // Contribute (unchanged)
    {
      "inputs": [{ "name": "_id", "type": "uint256" }],
      "name": "contribute",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    
    // Distribute Payout (unchanged)
    {
      "inputs": [{ "name": "_id", "type": "uint256" }],
      "name": "distributePayout",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    
    // Committee Count (unchanged)
    {
      "inputs": [],
      "name": "committeeCount",
      "outputs": [{ "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    
    // Committees - NOW INCLUDES inviteCode and isPrivate
    {
      "inputs": [{ "name": "", "type": "uint256" }],
      "name": "committees",
      "outputs": [
        { "name": "creator", "type": "address" },
        { "name": "name", "type": "string" },
        { "name": "contributionAmount", "type": "uint256" },
        { "name": "maxMembers", "type": "uint8" },
        { "name": "currentMembers", "type": "uint8" },
        { "name": "roundDuration", "type": "uint256" },
        { "name": "startDate", "type": "uint256" },
        { "name": "nextRoundDate", "type": "uint256" },
        { "name": "currentRound", "type": "uint8" },
        { "name": "depositsThisRound", "type": "uint8" },
        { "name": "nextPayoutIndex", "type": "uint8" },
        { "name": "phase", "type": "uint8" },
        { "name": "isActive", "type": "bool" },
        { "name": "isCompleted", "type": "bool" },
        { "name": "inviteCode", "type": "bytes32" },
        { "name": "isPrivate", "type": "bool" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    
    // Get Members (unchanged)
    {
      "inputs": [{ "name": "_id", "type": "uint256" }],
      "name": "getMembers",
      "outputs": [{ "type": "address[]" }],
      "stateMutability": "view",
      "type": "function"
    },
    
    // Members (unchanged)
    {
      "inputs": [
        { "name": "", "type": "uint256" },
        { "name": "", "type": "address" }
      ],
      "name": "members",
      "outputs": [
        { "name": "wallet", "type": "address" },
        { "name": "totalContributed", "type": "uint256" },
        { "name": "hasReceivedPayout", "type": "bool" },
        { "name": "hasDepositedCurrentRound", "type": "bool" },
        { "name": "isActive", "type": "bool" },
        { "name": "joinedAt", "type": "uint256" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    
    // NEW: Can View Committee
    {
      "inputs": [
        { "name": "_id", "type": "uint256" },
        { "name": "_user", "type": "address" }
      ],
      "name": "canViewCommittee",
      "outputs": [{ "type": "bool" }],
      "stateMutability": "view",
      "type": "function"
    },
    
    // NEW: Verify Invite Code
    {
      "inputs": [
        { "name": "_id", "type": "uint256" },
        { "name": "_inviteCode", "type": "bytes32" }
      ],
      "name": "verifyInviteCode",
      "outputs": [{ "type": "bool" }],
      "stateMutability": "view",
      "type": "function"
    }
  ] as const;

export default function AppPage() {
  const { address, isConnected } = useAccount();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [selectedCommittee, setSelectedCommittee] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: totalCommittees, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'committeeCount',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      setRefreshKey(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30 animate-pulse">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to RizqFi</h1>
          <p className="text-slate-400 mb-8">Connect your wallet to start saving with your community</p>
          <div className="flex justify-center">
            <Wallet>
              <ConnectWallet className="!bg-emerald-600 hover:!bg-emerald-700 !text-white !px-8 !py-4 !text-lg !font-semibold !rounded-xl" />
            </Wallet>
          </div>
          <Link href="/" className="text-emerald-400 hover:text-emerald-300 text-sm mt-4 block">
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      <nav className="border-b border-white/5 backdrop-blur-xl bg-black/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <div>
                <span className="text-white text-2xl font-bold tracking-tight">RizqFi</span>
                <p className="text-emerald-400 text-xs font-medium">Smart Committees</p>
              </div>
            </Link>

            <Wallet>
              <ConnectWallet>
                <Avatar className="h-6 w-6" />
                <Name address={address} />
              </ConnectWallet>
              <WalletDropdown>
                <Identity address={address!}>
                  <Avatar />
                  <Name />
                  <Address />
                </Identity>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">Welcome back! 👋</h2>
          <p className="text-slate-400 text-sm sm:text-lg">{address?.slice(0, 10)}...{address?.slice(-10)}</p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-8 sm:mb-12">
          <button 
            onClick={() => setShowCreate(true)} 
            className="group flex items-center justify-center space-x-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span>Create Committee</span>
          </button>

          <button 
            onClick={() => setShowJoin(true)} 
            className="flex items-center justify-center space-x-3 bg-white/5 hover:bg-white/10 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all border border-white/10 hover:border-emerald-500/30 hover:scale-105"
          >
            <Users className="w-5 h-5" />
            <span>Join Committee</span>
          </button>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-8 border border-white/10 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              All Committees
            </h3>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 w-fit">
              <span className="text-emerald-400 font-bold text-sm sm:text-base">
                {totalCommittees?.toString() || '0'} Total
              </span>
            </div>
          </div>
          <CommitteeList key={refreshKey} onSelect={setSelectedCommittee} userAddress={address!} />
        </div>
      </div>

      {showCreate && (
        <CreateModal 
          onClose={() => setShowCreate(false)} 
          onSuccess={() => { 
            refetch(); 
            setRefreshKey(prev => prev + 1); 
            setShowCreate(false);
          }} 
        />
      )}
      
      {showJoin && (
        <JoinModal 
          onClose={() => setShowJoin(false)} 
          onSuccess={() => { 
            refetch(); 
            setRefreshKey(prev => prev + 1);
            setShowJoin(false);
          }} 
        />
      )}
      
      {selectedCommittee !== null && (
        <DetailedCommitteeModal 
          committeeId={selectedCommittee} 
          userAddress={address!} 
          onClose={() => setSelectedCommittee(null)} 
          onUpdate={() => { 
            refetch(); 
            setRefreshKey(prev => prev + 1); 
          }} 
        />
      )}
    </main>
  );
}