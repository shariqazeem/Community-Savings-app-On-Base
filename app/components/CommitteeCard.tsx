// components/CommitteeCard.tsx
'use client';

import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { Users, Calendar, ArrowRight, Lock } from 'lucide-react';
import { Identity, Avatar, Name } from '@coinbase/onchainkit/identity';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

const ABI = [
  { "inputs": [{ "name": "", "type": "uint256" }], "name": "committees", "outputs": [{ "name": "creator", "type": "address" }, { "name": "name", "type": "string" }, { "name": "contributionAmount", "type": "uint256" }, { "name": "maxMembers", "type": "uint8" }, { "name": "currentMembers", "type": "uint8" }, { "name": "roundDuration", "type": "uint256" }, { "name": "startDate", "type": "uint256" }, { "name": "nextRoundDate", "type": "uint256" }, { "name": "currentRound", "type": "uint8" }, { "name": "depositsThisRound", "type": "uint8" }, { "name": "nextPayoutIndex", "type": "uint8" }, { "name": "phase", "type": "uint8" }, { "name": "isActive", "type": "bool" }, { "name": "isCompleted", "type": "bool" }, { "name": "inviteCode", "type": "bytes32" }, { "name": "isPrivate", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "name": "", "type": "uint256" }, { "name": "", "type": "address" }], "name": "members", "outputs": [{ "name": "wallet", "type": "address" }, { "name": "totalContributed", "type": "uint256" }, { "name": "hasReceivedPayout", "type": "bool" }, { "name": "hasDepositedCurrentRound", "type": "bool" }, { "name": "isActive", "type": "bool" }, { "name": "joinedAt", "type": "uint256" }], "stateMutability": "view", "type": "function" }
] as const;

const PHASE_LABELS = ['Joining', 'Deposit', 'Payout', 'Completed'];
const PHASE_COLORS = [
  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'bg-green-500/20 text-green-400 border-green-500/30'
];

export default function CommitteeCard({ id, onSelect, userAddress }: { id: number; onSelect: (id: number) => void; userAddress: string }) {
  const { data: committee } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'committees',
    args: [BigInt(id)],
  });

  const { data: memberInfo } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'members',
    args: [BigInt(id), userAddress as `0x${string}`],
  });

  if (!committee) return null;

  const [creator, name, amount, maxMembers, currentMembers, , , , currentRound, , , phase, , , , isPrivate] = committee;
  const monthlyAmount = Number(formatUnits(amount, 6));
  const totalPool = monthlyAmount * Number(maxMembers);
  const progress = (Number(currentMembers) / Number(maxMembers)) * 100;
  const isCreator = creator.toLowerCase() === userAddress.toLowerCase();
  const isMember = memberInfo && memberInfo[0] !== '0x0000000000000000000000000000000000000000';

  return (
    <div 
      onClick={() => onSelect(id)} 
      className="group bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <h4 className="text-white font-bold text-lg sm:text-xl truncate">{name}</h4>
            <span className={`text-xs font-bold px-2 sm:px-3 py-1 rounded-full border whitespace-nowrap ${PHASE_COLORS[Number(phase)]}`}>
              {PHASE_LABELS[Number(phase)]}
            </span>
            {isPrivate && (
              <span className="text-xs font-bold px-2 py-1 rounded-full border bg-yellow-500/20 text-yellow-400 border-yellow-500/30 whitespace-nowrap flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Private
              </span>
            )}
            {isCreator && <span className="text-xs font-bold px-2 py-1 rounded-full border bg-purple-500/20 text-purple-400 border-purple-500/30 whitespace-nowrap">👑</span>}
            {isMember && !isCreator && <span className="text-xs font-bold px-2 py-1 rounded-full border bg-blue-500/20 text-blue-400 border-blue-500/30 whitespace-nowrap">✓</span>}
          </div>
          
          {/* ENHANCED: Show creator's Basename */}
          <div className="mb-2">
            <p className="text-slate-500 text-xs mb-1">Created by</p>
            <Identity address={creator} className="!bg-transparent">
              <Avatar className="!w-5 !h-5" />
              <Name className="!text-emerald-400 !text-sm !font-medium" />
            </Identity>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-slate-400">
            <span className="flex items-center space-x-1">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{Number(currentMembers)}/{Number(maxMembers)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Round {Number(currentRound)}</span>
            </span>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Members Joined</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-black/20 rounded-lg p-2 sm:p-3 border border-white/5 hover:border-emerald-500/20 transition-all">
          <p className="text-slate-400 text-xs mb-1">Per Round</p>
          <p className="text-white font-bold text-sm sm:text-lg">${monthlyAmount.toFixed(2)}</p>
        </div>
        <div className="bg-black/20 rounded-lg p-2 sm:p-3 border border-white/5 hover:border-emerald-500/20 transition-all">
          <p className="text-slate-400 text-xs mb-1">Total Pool</p>
          <p className="text-white font-bold text-sm sm:text-lg">${totalPool.toFixed(2)}</p>
        </div>
        <div className="bg-black/20 rounded-lg p-2 sm:p-3 border border-white/5 hover:border-emerald-500/20 transition-all">
          <p className="text-slate-400 text-xs mb-1">Status</p>
          <p className={`font-bold text-xs sm:text-sm ${isMember ? 'text-emerald-400' : 'text-blue-400'}`}>
            {isMember ? '✅' : '🔓'}
          </p>
        </div>
      </div>
    </div>
  );
}