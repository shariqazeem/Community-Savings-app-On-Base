// components/JoinModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { Users, X, AlertCircle } from 'lucide-react';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`;

const ABI = [
    { "inputs": [{ "name": "_id", "type": "uint256" }, { "name": "_inviteCode", "type": "bytes32" }], "name": "joinCommittee", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "name": "", "type": "uint256" }], "name": "committees", "outputs": [{ "name": "creator", "type": "address" }, { "name": "name", "type": "string" }, { "name": "contributionAmount", "type": "uint256" }, { "name": "maxMembers", "type": "uint8" }, { "name": "currentMembers", "type": "uint8" }, { "name": "roundDuration", "type": "uint256" }, { "name": "startDate", "type": "uint256" }, { "name": "nextRoundDate", "type": "uint256" }, { "name": "currentRound", "type": "uint8" }, { "name": "depositsThisRound", "type": "uint8" }, { "name": "nextPayoutIndex", "type": "uint8" }, { "name": "phase", "type": "uint8" }, { "name": "isActive", "type": "bool" }, { "name": "isCompleted", "type": "bool" }, { "name": "inviteCode", "type": "bytes32" }, { "name": "isPrivate", "type": "bool" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "name": "_id", "type": "uint256" }, { "name": "_inviteCode", "type": "bytes32" }], "name": "verifyInviteCode", "outputs": [{ "type": "bool" }], "stateMutability": "view", "type": "function" }
] as const;

const USDC_ABI = [
    { "inputs": [{ "name": "spender", "type": "address" }, { "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "name": "owner", "type": "address" }, { "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" }
] as const;

const PHASE_LABELS = ['Joining', 'Deposit', 'Payout', 'Completed'];
const PHASE_COLORS = [
    'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'bg-green-500/20 text-green-400 border-green-500/30'
];

export default function JoinModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [fullInviteCode, setFullInviteCode] = useState('');
    const [committeeId, setCommitteeId] = useState<number | null>(null);
    const [inviteCode, setInviteCode] = useState<`0x${string}` | ''>('');
    const [step, setStep] = useState<'input' | 'approve' | 'join'>('input');

    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isSuccess } = useWaitForTransactionReceipt({ hash });
    const { address } = useAccount();

    const { data: usdcBalance } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
    });

    const { data: committee } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'committees',
        args: committeeId !== null ? [BigInt(committeeId)] : undefined,
    });

    const { data: isValidCode } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'verifyInviteCode',
        args: committeeId !== null && inviteCode ? [BigInt(committeeId), inviteCode] : undefined,
    });

    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: address ? [address, CONTRACT_ADDRESS] : undefined,
    });

    // Parse invite code format "ID:0x..."
    const handleInviteCodeChange = (value: string) => {
        setFullInviteCode(value);

        if (value.includes(':')) {
            const parts = value.split(':');
            const id = parts[0].trim();
            const code = parts.slice(1).join(':').trim(); // Handle multiple colons

            const parsedId = parseInt(id);

            // Validate the format
            if (!isNaN(parsedId) && code.startsWith('0x') && code.length === 66) {
                setCommitteeId(parsedId);
                setInviteCode(code as `0x${string}`);
                console.log('Parsed ID:', parsedId);
                console.log('Parsed Code:', code);
            } else {
                setCommitteeId(null);
                setInviteCode('');
                console.log('Invalid format - ID:', parsedId, 'Code length:', code.length);
            }
        } else {
            setCommitteeId(null);
            setInviteCode('');
        }
    };

    const handleJoinCommittee = useCallback(() => {
        if (committeeId === null || !inviteCode) {
            console.log('Cannot join - missing data');
            return;
        }

        console.log('Calling joinCommittee with:', {
            committeeId: BigInt(committeeId),
            inviteCode
        });

        setStep('join');
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: 'joinCommittee',
            args: [BigInt(committeeId), inviteCode],
        });
    }, [committeeId, inviteCode, writeContract]);

    const handleApprove = () => {
        if (!committee) {
            console.log('Cannot approve - no committee data');
            return;
        }

        const amount = committee[2];
        console.log('Approving amount:', amount);

        setStep('approve');
        writeContract({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [CONTRACT_ADDRESS, amount],
        });
    };

    const handleJoinFlow = () => {
        console.log('=== Join Flow Started ===');
        console.log('Committee:', committee);
        console.log('Allowance:', allowance);
        console.log('CommitteeId:', committeeId);
        console.log('InviteCode:', inviteCode);
        console.log('Is Valid Code:', isValidCode);

        // FIX: Check for undefined instead of falsy values
        if (!committee || allowance === undefined || committeeId === null || !inviteCode) {
            console.log('Missing required data - cannot proceed');
            return;
        }

        const requiredAmount = committee[2];
        console.log('Required amount:', requiredAmount);
        console.log('Current allowance:', allowance);

        if (allowance < requiredAmount) {
            console.log('Insufficient allowance - approving first');
            handleApprove();
        } else {
            console.log('Sufficient allowance - joining directly');
            handleJoinCommittee();
        }
    };

    useEffect(() => {
        if (isSuccess && step === 'approve') {
            console.log('Approval successful, refetching allowance...');
            refetchAllowance();
            setTimeout(() => {
                setStep('join');
                handleJoinCommittee();
            }, 2000);
        } else if (isSuccess && step === 'join') {
            console.log('Join successful!');
            setTimeout(() => {
                onSuccess();
            }, 1500);
        }
    }, [isSuccess, step, onSuccess, refetchAllowance, handleJoinCommittee]);

    const userBalance = usdcBalance ? Number(formatUnits(usdcBalance, 6)) : 0;
    const requiredAmount = committee ? Number(formatUnits(committee[2], 6)) : 0;
    const hasAllowance = allowance && committee && allowance >= committee[2];

    // Check if button should be enabled
    // Check if button should be enabled
    const canProceed = committeeId !== null &&
        inviteCode &&
        isValidCode === true &&
        committee &&
        allowance !== undefined &&  // Changed from just checking truthy
        userBalance >= requiredAmount;

    console.log('Can proceed?', {
        canProceed,
        hasCommitteeId: committeeId !== null,
        hasInviteCode: !!inviteCode,
        isValidCode,
        hasCommittee: !!committee,
        hasAllowance: allowance !== undefined,
        sufficientBalance: userBalance >= requiredAmount
    });

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Join Committee</h2>
                            <p className="text-slate-400 text-sm">Enter invite code</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-slate-300 mb-2 text-sm font-medium">Invite Code</label>
                        <input
                            type="text"
                            value={fullInviteCode}
                            onChange={(e) => handleInviteCodeChange(e.target.value)}
                            placeholder="Paste invite code (format: 0:0x123abc...)"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-700"
                        />
                        <p className="text-slate-500 text-xs mt-2">📋 Paste the full invite code shared by the creator</p>
                    </div>

                    {committee && isValidCode === true && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 space-y-3 animate-fadeIn">
                            <div className="flex items-center justify-between">
                                <h3 className="text-emerald-400 font-bold text-lg">{committee[1]}</h3>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${PHASE_COLORS[Number(committee[11])]}`}>
                                    {PHASE_LABELS[Number(committee[11])]}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/20 rounded-lg p-3">
                                    <p className="text-slate-400 text-xs mb-1">Contribution</p>
                                    <p className="text-white font-bold text-lg">${requiredAmount.toFixed(2)}</p>
                                </div>
                                <div className="bg-black/20 rounded-lg p-3">
                                    <p className="text-slate-400 text-xs mb-1">Members</p>
                                    <p className="text-white font-bold text-lg">{Number(committee[4])}/{Number(committee[3])}</p>
                                </div>
                                <div className="bg-black/20 rounded-lg p-3">
                                    <p className="text-slate-400 text-xs mb-1">Your Balance</p>
                                    <p className={`font-bold text-lg ${userBalance >= requiredAmount ? 'text-green-400' : 'text-red-400'}`}>
                                        ${userBalance.toFixed(2)}
                                    </p>
                                </div>
                                <div className="bg-black/20 rounded-lg p-3">
                                    <p className="text-slate-400 text-xs mb-1">Total Pool</p>
                                    <p className="text-white font-bold text-lg">${(requiredAmount * Number(committee[3])).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {fullInviteCode && committeeId !== null && isValidCode === false && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-400 font-semibold text-sm">Invalid Invite Code</p>
                                <p className="text-red-300 text-xs mt-1">Please check the code and try again</p>
                            </div>
                        </div>
                    )}

                    {committee && userBalance < requiredAmount && isValidCode === true && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-400 font-semibold text-sm">Insufficient Balance</p>
                                <p className="text-red-300 text-xs mt-1">You need ${requiredAmount.toFixed(2)} USDC</p>
                            </div>
                        </div>
                    )}

                    {isPending && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                                <div>
                                    <p className="text-blue-400 font-semibold text-sm">
                                        {step === 'approve' ? 'Step 1/2: Approving...' : 'Step 2/2: Joining...'}
                                    </p>
                                    <p className="text-blue-300 text-xs mt-1">Confirm in wallet</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                            <p className="text-red-400 text-sm">❌ Transaction failed. Please try again.</p>
                        </div>
                    )}

                    {isSuccess && step === 'approve' && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                            <p className="text-green-400 text-sm font-medium">✅ Approved! Now joining...</p>
                        </div>
                    )}

                    {isSuccess && step === 'join' && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                            <p className="text-green-400 text-sm font-medium">✅ Successfully joined!</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                            disabled={isPending}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleJoinFlow}
                            disabled={isPending || !canProceed}
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                            {isPending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    {step === 'approve' ? 'Approving...' : 'Joining...'}
                                </>
                            ) : (
                                hasAllowance ? 'Join Committee' : 'Approve & Join'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}