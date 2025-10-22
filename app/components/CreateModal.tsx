// components/CreateModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { Plus, X } from 'lucide-react';

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

export default function CreateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isSuccess } = useWaitForTransactionReceipt({ hash });
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        members: '5',
        duration: '7',
        isPrivate: true  // NEW: Default to private
    });
    const [inviteCode, setInviteCode] = useState<string>('');

    useEffect(() => {
        if (isSuccess) {
            setTimeout(() => { onSuccess(); onClose(); }, 1500);
        }
    }, [isSuccess, onClose, onSuccess]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const startDate = Math.floor(Date.now() / 1000) + 86400;
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: 'createCommittee',
            args: [
                formData.name,
                parseUnits(formData.amount, 6),
                Number(formData.members),
                BigInt(Number(formData.duration) * 86400),
                BigInt(startDate),
                formData.isPrivate  // NEW: Pass privacy setting
            ],
        });
    };
    useEffect(() => {
        if (hash) {
          // TODO: Get invite code from transaction receipt/events
          // For now, store committee ID and let user know to check contract
        }
      }, [hash]);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                            <Plus className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Create Committee</h2>
                            <p className="text-slate-400 text-sm">Set up your savings circle</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-300 mb-2 text-sm font-medium">Committee Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Family Savings Circle"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-slate-300 mb-2 text-sm font-medium">Contribution Amount (USDC)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="100"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-300 mb-2 text-sm font-medium">Members</label>
                            <select
                                value={formData.members}
                                onChange={(e) => setFormData({ ...formData, members: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                            >
                                {[3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-slate-300 mb-2 text-sm font-medium">Duration</label>
                            <select
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                            >
                                <option value="7">7 days</option>
                                <option value="14">14 days</option>
                                <option value="30">30 days</option>
                            </select>
                        </div>
                    </div>

                    {formData.amount && formData.members && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                            <p className="text-emerald-400 text-sm font-medium mb-1">💰 Total Pool per Round</p>
                            <p className="text-white text-2xl font-bold">${(parseFloat(formData.amount) * parseInt(formData.members)).toFixed(2)}</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                            <p className="text-red-400 text-sm">❌ Transaction failed. Please try again.</p>
                        </div>
                    )}

                    {isSuccess && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-green-400 text-sm font-medium">
                            ✅ Committee created successfully!
                        </div>
                    )}
                    <div>
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isPrivate}
                                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                                className="w-5 h-5 rounded border-white/10 bg-white/5 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                                <span className="text-slate-300 font-medium">🔒 Private Committee</span>
                                <p className="text-slate-500 text-xs">Only people with invite code can join</p>
                            </div>
                        </label>
                    </div>

                    {isSuccess && inviteCode && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                            <p className="text-emerald-400 font-semibold mb-2">✅ Committee Created!</p>
                            <p className="text-white text-xs mb-2">Your Invite Code:</p>
                            <div className="bg-black/30 rounded-lg p-3 font-mono text-sm text-white break-all">
                                {inviteCode}
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(inviteCode);
                                }}
                                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                            >
                                Copy Invite Code
                            </button>
                        </div>
                    )}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                            disabled={isPending}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center transition-all disabled:opacity-50"
                        >
                            {isPending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    Creating...
                                </>
                            ) : (
                                'Create'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}