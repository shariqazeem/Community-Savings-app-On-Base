'use client';

import Link from 'next/link';
import { Sparkles, CheckCircle2, TrendingUp, Award, Users, Shield, Zap, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      {/* Navigation */}
      <nav className="border-b border-white/5 backdrop-blur-xl bg-black/30 fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <div>
                <span className="text-white text-2xl font-bold tracking-tight">RizqFi</span>
                <p className="text-emerald-400 text-xs font-medium">Smart Committees</p>
              </div>
            </div>
            <Link 
              href="/app"
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:scale-105"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 pt-32 pb-20 text-center">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-5 py-2 mb-8 animate-pulse">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-sm font-medium">Built on Base Network</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Traditional Committees,<br />
          <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            Blockchain Trust
          </span>
        </h1>

        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Join transparent savings circles on Base. No banks, no middlemen – just your community and smart contracts working together.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
          <Link 
            href="/app"
            className="group bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:scale-105 flex items-center space-x-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a 
            href="#how-it-works"
            className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all border border-white/10"
          >
            Learn More
          </a>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-emerald-500/30 transition-all group">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">Transparent</h3>
            <p className="text-slate-400">All transactions on-chain and verifiable. See exactly where your money goes.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-emerald-500/30 transition-all group">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">Automated</h3>
            <p className="text-slate-400">Smart contracts handle everything automatically. No manual tracking needed.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-emerald-500/30 transition-all group">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">Secure</h3>
            <p className="text-slate-400">Your funds are protected by battle-tested smart contracts on Base.</p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-slate-400 text-lg">Simple, transparent, and automated savings</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="relative">
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-2xl p-8 border border-emerald-500/20">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Create or Join</h3>
              <p className="text-slate-400">Start a new committee with friends or join an existing one using a simple code.</p>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-2xl p-8 border border-purple-500/20">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Contribute</h3>
              <p className="text-slate-400">Each member contributes the agreed amount every round. All tracked on-chain.</p>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-2xl p-8 border border-blue-500/20">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Receive Payout</h3>
              <p className="text-slate-400">One member receives the full pool each round. Everyone gets their turn guaranteed.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 rounded-3xl p-12 border border-emerald-500/20">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-white mb-2">100%</div>
              <div className="text-emerald-400 font-semibold">Transparent</div>
              <div className="text-slate-400 text-sm mt-1">All on-chain</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-white mb-2">0%</div>
              <div className="text-emerald-400 font-semibold">Platform Fees</div>
              <div className="text-slate-400 text-sm mt-1">Keep your money</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-white mb-2">∞</div>
              <div className="text-emerald-400 font-semibold">Communities</div>
              <div className="text-slate-400 text-sm mt-1">Create unlimited</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to Start Saving?
        </h2>
        <p className="text-slate-400 text-lg mb-8">
          Join thousands building wealth together
        </p>
        <Link 
          href="/app"
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-10 py-5 rounded-xl font-bold text-lg transition-all shadow-lg hover:scale-105"
        >
          <span>Launch App</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            © 2024 RizqFi. Built with ❤️ on Base.
          </p>
        </div>
      </footer>
    </main>
  );
}