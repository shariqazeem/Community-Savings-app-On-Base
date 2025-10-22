// components/DetailedCommitteeModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { Users, DollarSign, Clock, X, AlertCircle, Award, CheckCircle2, Share2, Lock } from 'lucide-react';
import { Identity, Avatar, Name, Address, Badge } from '@coinbase/onchainkit/identity';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`;

const ABI = [
    { "inputs": [{ "name": "_id", "type": "uint256" }, { "name": "_inviteCode", "type": "bytes32" }], "name": "joinCommittee", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "name": "_id", "type": "uint256" }], "name": "contribute", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "name": "_id", "type": "uint256" }], "name": "distributePayout", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "name": "", "type": "uint256" }], "name": "committees", "outputs": [{ "name": "creator", "type": "address" }, { "name": "name", "type": "string" }, { "name": "contributionAmount", "type": "uint256" }, { "name": "maxMembers", "type": "uint8" }, { "name": "currentMembers", "type": "uint8" }, { "name": "roundDuration", "type": "uint256" }, { "name": "startDate", "type": "uint256" }, { "name": "nextRoundDate", "type": "uint256" }, { "name": "currentRound", "type": "uint8" }, { "name": "depositsThisRound", "type": "uint8" }, { "name": "nextPayoutIndex", "type": "uint8" }, { "name": "phase", "type": "uint8" }, { "name": "isActive", "type": "bool" }, { "name": "isCompleted", "type": "bool" }, { "name": "inviteCode", "type": "bytes32" }, { "name": "isPrivate", "type": "bool" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "name": "_id", "type": "uint256" }], "name": "getMembers", "outputs": [{ "type": "address[]" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "name": "", "type": "uint256" }, { "name": "", "type": "address" }], "name": "members", "outputs": [{ "name": "wallet", "type": "address" }, { "name": "totalContributed", "type": "uint256" }, { "name": "hasReceivedPayout", "type": "bool" }, { "name": "hasDepositedCurrentRound", "type": "bool" }, { "name": "isActive", "type": "bool" }, { "name": "joinedAt", "type": "uint256" }], "stateMutability": "view", "type": "function" }
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

export default function DetailedCommitteeModal({ committeeId, userAddress, onClose, onUpdate }: any) {
    const [showMembers, setShowMembers] = useState(false);
    const [copied, setCopied] = useState(false);
    const [step, setStep] = useState<'idle' | 'approve' | 'action'>('idle');
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isSuccess } = useWaitForTransactionReceipt({ hash });

    const { data: committee, refetch: refetchCommittee } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'committees',
        args: [BigInt(committeeId)],
    });

    const { data: members, refetch: refetchMembers } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'getMembers',
        args: [BigInt(committeeId)],
    });

    const { data: memberInfo, refetch: refetchMemberInfo } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'members',
        args: [BigInt(committeeId), userAddress as `0x${string}`],
    });

    const { data: usdcBalance } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
    });

    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [userAddress as `0x${string}`, CONTRACT_ADDRESS],
    });

    if (!committee) return null;

    const [creator, name, amount, maxMembers, currentMembers, roundDuration, , , currentRound, depositsThisRound, nextPayoutIndex, phase, , , inviteCode, isPrivate] = committee;
    const monthlyAmount = Number(formatUnits(amount, 6));
    const totalPool = monthlyAmount * Number(maxMembers);
    const isCreator = creator.toLowerCase() === userAddress.toLowerCase();
    const isMember = memberInfo && memberInfo[0] !== '0x0000000000000000000000000000000000000000';
    const canJoin = Number(phase) === 0 && Number(currentMembers) < Number(maxMembers) && !isMember;
    const userBalance = usdcBalance ? Number(formatUnits(usdcBalance, 6)) : 0;
    const canContribute = isMember && Number(phase) === 1 && memberInfo && !memberInfo[3];
    const canDistribute = isCreator && Number(phase) === 2;
    const hasAllowance = allowance && allowance >= amount;
    const shareableInviteCode = `${committeeId}:${inviteCode}`;

    const executeMainAction = useCallback(() => {
        if (canContribute) {
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: ABI,
                functionName: 'contribute',
                args: [BigInt(committeeId)],
            });
        } else if (canJoin) {
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: ABI,
                functionName: 'joinCommittee',
                args: [BigInt(committeeId), inviteCode],
            });
        }
    }, [canContribute, canJoin, inviteCode, committeeId, writeContract]);

    useEffect(() => {
        if (isSuccess && step === 'approve') {
            refetchAllowance();
            setTimeout(() => {
                setStep('action');
                executeMainAction();
            }, 2000);
        } else if (isSuccess && step === 'action') {
            setTimeout(() => {
                refetchCommittee();
                refetchMembers();
                refetchMemberInfo();
                onUpdate();
                setStep('idle');
            }, 2000);
        }
    }, [isSuccess, step, refetchAllowance, executeMainAction, refetchCommittee, refetchMembers, refetchMemberInfo, onUpdate]);

    const handleContributeOrJoin = () => {
        if (!hasAllowance) {
            setStep('approve');
            writeContract({
                address: USDC_ADDRESS,
                abi: USDC_ABI,
                functionName: 'approve',
                args: [CONTRACT_ADDRESS, amount],
            });
        } else {
            setStep('action');
            executeMainAction();
        }
    };

    const handleDistribute = () => {
        setStep('action');
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: 'distributePayout',
            args: [BigInt(committeeId)],
        });
    };

    const nextRecipient = members && members[Number(nextPayoutIndex)];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-white/10 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex-1 min-w-0 pr-4">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 truncate">{name}</h2>
                        <div className="flex items-center flex-wrap gap-2">
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${PHASE_COLORS[Number(phase)]}`}>
                                {PHASE_LABELS[Number(phase)]}
                            </span>
                            {isPrivate && (
                                <span className="text-xs font-bold px-3 py-1.5 rounded-full border bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    Private
                                </span>
                            )}
                            {isCreator && <span className="text-xs font-bold px-3 py-1.5 rounded-full border bg-purple-500/20 text-purple-400">👑 CREATOR</span>}
                            {isMember && !isCreator && <span className="text-xs font-bold px-3 py-1.5 rounded-full border bg-blue-500/20 text-blue-400">✓ MEMBER</span>}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all flex-shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isMember && memberInfo && (
                    <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-4 sm:p-5 mb-6">
                        <p className="text-blue-400 font-bold mb-3 flex items-center text-sm sm:text-base">
                            <Award className="w-4 h-4 mr-2" />
                            Your Participation
                        </p>
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                            <div>
                                <p className="text-slate-400 text-xs mb-1">Contributed</p>
                                <p className="text-white font-bold text-sm sm:text-lg">${Number(formatUnits(memberInfo[1], 6)).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-1">This Round</p>
                                <p className={`font-bold text-sm sm:text-lg ${memberInfo[3] ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {memberInfo[3] ? '✅' : '⏳'}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-1">Payout</p>
                                <p className={`font-bold text-sm sm:text-lg ${memberInfo[2] ? 'text-green-400' : 'text-slate-400'}`}>
                                    {memberInfo[2] ? '✅' : '⏳'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                    <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-xl p-3 sm:p-5 border border-emerald-500/20">
                        <p className="text-emerald-400 text-xs mb-1 font-medium">Per Round</p>
                        <p className="text-white font-bold text-lg sm:text-2xl">${monthlyAmount.toFixed(2)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl p-3 sm:p-5 border border-purple-500/20">
                        <p className="text-purple-400 text-xs mb-1 font-medium">Total Pool</p>
                        <p className="text-white font-bold text-lg sm:text-2xl">${totalPool.toFixed(2)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-3 sm:p-5 border border-blue-500/20">
                        <p className="text-blue-400 text-xs mb-1 font-medium">Round</p>
                        <p className="text-white font-bold text-lg sm:text-2xl">{Number(currentRound)}</p>
                    </div>
                </div>

                {Number(phase) === 1 && (
                    <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-4 sm:p-5 mb-6">
                        <div className="flex items-start space-x-3">
                            <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <p className="text-yellow-400 font-bold mb-1 text-sm sm:text-base">Deposit Phase</p>
                                <p className="text-slate-300 text-xs sm:text-sm">Waiting for contributions</p>
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                                        <span>Deposits</span>
                                        <span>{Number(depositsThisRound)}/{Number(currentMembers)}</span>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-500"
                                            style={{ width: `${(Number(depositsThisRound) / Number(currentMembers)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {Number(phase) === 2 && nextRecipient && (
                    <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-4 sm:p-5 mb-6">
                        <div className="flex items-start space-x-3">
                            <DollarSign className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <p className="text-purple-400 font-bold mb-1 text-sm sm:text-base">Ready for Payout! 💰</p>
                                <p className="text-slate-300 text-xs sm:text-sm mb-2">All contributions received</p>
                                <div className="bg-black/30 rounded-lg p-3 mt-2">
                                    <p className="text-slate-400 text-xs mb-2">Next Recipient</p>
                                    {/* ENHANCED: Show Basename instead of raw address */}
                                    <Identity address={nextRecipient} className="!bg-transparent">
                                        <Avatar className="!w-8 !h-8" />
                                        <Name className="!text-white !font-semibold" />
                                    </Identity>
                                    <p className="text-purple-400 font-bold text-base sm:text-lg mt-2">${totalPool.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-3 mb-6">
                    {canJoin && userBalance < monthlyAmount && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-400 font-semibold text-sm">Insufficient Balance</p>
                                <p className="text-red-300 text-xs mt-1">Need ${monthlyAmount.toFixed(2)} USDC</p>
                            </div>
                        </div>
                    )}

                    {isPending && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                                <div>
                                    <p className="text-blue-400 font-semibold text-sm">
                                        {step === 'approve' ? 'Step 1/2: Approving...' : 'Processing...'}
                                    </p>
                                    <p className="text-blue-300 text-xs mt-1">Confirm in wallet</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                            <p className="text-red-400 text-sm">❌ Transaction failed</p>
                        </div>
                    )}

                    {isSuccess && step === 'approve' && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                            <p className="text-green-400 text-sm font-medium">✅ Approved! Processing...</p>
                        </div>
                    )}

                    {isSuccess && step === 'action' && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                            <p className="text-green-400 text-sm font-medium">✅ Success! Updating...</p>
                        </div>
                    )}

                    {(canJoin || canContribute) && (
                        <button
                            onClick={handleContributeOrJoin}
                            disabled={isPending || (canJoin && userBalance < monthlyAmount)}
                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all disabled:opacity-50 flex items-center justify-center shadow-lg"
                        >
                            {isPending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    {step === 'approve' ? 'Approving...' : 'Processing...'}
                                </>
                            ) : (
                                <>
                                    {canJoin && `Join (${monthlyAmount.toFixed(2)})`}
                                    {canContribute && `Contribute ${monthlyAmount.toFixed(2)}`}
                                </>
                            )}
                        </button>
                    )}

                    {canDistribute && (
                        <button
                            onClick={handleDistribute}
                            disabled={isPending}
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all flex items-center justify-center shadow-lg"
                        >
                            {isPending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    Distributing...
                                </>
                            ) : (
                                `💰 Distribute ${totalPool.toFixed(2)}`
                            )}
                        </button>
                    )}

                    {isMember && Number(phase) === 1 && memberInfo && memberInfo[3] && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                            <p className="text-blue-400 text-sm font-medium">
                                ✅ Contributed! Waiting for {Number(currentMembers) - Number(depositsThisRound)} more.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setShowMembers(!showMembers)}
                            className="bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl flex items-center justify-center space-x-2 font-semibold transition-all text-sm sm:text-base"
                        >
                            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>Members ({Number(currentMembers)})</span>
                        </button>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(shareableInviteCode);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                            className="bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl flex items-center justify-center space-x-2 font-semibold transition-all text-sm sm:text-base"
                        >
                            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>{copied ? '✓ Copied!' : 'Share'}</span>
                        </button>
                    </div>
                </div>

                {/* ENHANCED: Members list with Basenames */}
                {showMembers && members && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 mb-6">
                        <p className="text-white font-bold mb-4 flex items-center text-sm sm:text-base">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-emerald-400" />
                            Committee Members
                        </p>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {members.length === 0 ? (
                                <p className="text-slate-400 text-sm text-center py-8">No members yet</p>
                            ) : (
                                members.map((member, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-black/30 rounded-lg p-3 sm:p-4 hover:bg-black/40 transition-all">
                                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-full flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
                                                <span className="text-emerald-400 font-bold text-xs sm:text-sm">#{idx + 1}</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                {/* ENHANCED: Show Basename with fallback to address */}
                                                <Identity address={member} className="!bg-transparent">
                                                    <Avatar className="!w-6 !h-6 !hidden sm:!inline-flex" />
                                                    <Name className="!text-slate-300 !text-sm !font-medium" />
                                                </Identity>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {idx < Number(nextPayoutIndex) && (
                                                        <span className="text-green-400 text-xs font-semibold">✓ Paid</span>
                                                    )}
                                                    {idx === Number(nextPayoutIndex) && Number(phase) === 2 && (
                                                        <span className="text-purple-400 text-xs font-semibold">💰 Next</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {member.toLowerCase() === userAddress.toLowerCase() && (
                                            <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 sm:px-3 py-1 rounded-full border border-emerald-500/30 flex-shrink-0">YOU</span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 sm:p-5 mb-4">
                    <div className="flex items-start space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs sm:text-sm">
                            <p className="text-emerald-400 font-bold mb-2">How It Works</p>
                            <ul className="text-slate-300 leading-relaxed space-y-1">
                                <li>• ${monthlyAmount.toFixed(2)} every {Number(roundDuration) / 86400} days</li>
                                <li>• ${totalPool.toFixed(2)} payout per round</li>
                                <li>• {Number(maxMembers)} rounds total</li>
                                <li>• 100% transparent on Base</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {isPrivate && (isCreator || isMember) && (
                    <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-4 sm:p-5 mb-4">
                        <div className="flex items-start space-x-3">
                            <Lock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <p className="text-yellow-400 font-bold mb-1 text-sm sm:text-base">🔒 Private Committee</p>
                                <p className="text-slate-300 text-xs sm:text-sm mb-3">Share this code with trusted members only</p>
                                <div className="bg-black/30 rounded-lg p-3 mb-2">
                                    <p className="text-slate-400 text-xs mb-1">Invite Code</p>
                                    <p className="text-white font-mono text-xs break-all">{shareableInviteCode}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(shareableInviteCode);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                                >
                                    {copied ? '✓ Copied Invite Code!' : 'Copy Invite Code'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-4 sm:p-5">
                    <div className="text-center">
                        <p className="text-blue-400 font-bold mb-2 text-sm">Committee ID</p>
                        <p className="text-4xl sm:text-5xl font-bold text-white mb-2">{committeeId}</p>
                        <p className="text-slate-400 text-xs">Reference number</p>
                    </div>
                </div>
            </div>
        </div>
    );
}