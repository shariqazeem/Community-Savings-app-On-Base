// components/CommitteeList.tsx
'use client';

import { useReadContract } from 'wagmi';
import { Users } from 'lucide-react';
import CommitteeCard from './CommitteeCard';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

const ABI = [
  { "inputs": [], "name": "committeeCount", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "name": "_id", "type": "uint256" }, { "name": "_user", "type": "address" }], "name": "canViewCommittee", "outputs": [{ "type": "bool" }], "stateMutability": "view", "type": "function" }
] as const;

export default function CommitteeList({ onSelect, userAddress }: { onSelect: (id: number) => void; userAddress: string }) {
  const { data: count } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'committeeCount',
  });

  if (!count || count === BigInt(0)) {
    return (
      <div className="text-center py-20">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Users className="w-12 h-12 text-emerald-400 opacity-50" />
        </div>
        <p className="text-slate-300 text-xl mb-2 font-semibold">No committees yet</p>
        <p className="text-slate-500">Create one or join with an invite code!</p>
      </div>
    );
  }

  const committees = [];
  for (let i = 0; i < Number(count); i++) {
    committees.push(
      <CommitteeCardWrapper 
        key={i} 
        id={i} 
        onSelect={onSelect} 
        userAddress={userAddress} 
      />
    );
  }

  return <div className="grid gap-4 sm:gap-6">{committees}</div>;
}

// Wrapper to check visibility before rendering
function CommitteeCardWrapper({ id, onSelect, userAddress }: { id: number; onSelect: (id: number) => void; userAddress: string }) {
  const { data: canView } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: [
      { "inputs": [{ "name": "_id", "type": "uint256" }, { "name": "_user", "type": "address" }], "name": "canViewCommittee", "outputs": [{ "type": "bool" }], "stateMutability": "view", "type": "function" }
    ] as const,
    functionName: 'canViewCommittee',
    args: [BigInt(id), userAddress as `0x${string}`],
  });

  // Only render if user can view this committee
  if (canView === false) return null;

  return <CommitteeCard id={id} onSelect={onSelect} userAddress={userAddress} />;
}

