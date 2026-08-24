'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, GraduationCap, Trophy, Users, Zap } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-navy-900">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo width={140} height={40} />
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-navy-700 hover:text-navy-500 px-3 py-2">
              Login
            </Link>
            <Link href="/register" className="btn-accent">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider mb-6">
            🇹🇿 Tanzania&apos;s Leading Training Platform
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-navy-500 mb-6">
            Learn. Compete.{' '}
            <span className="text-orange-500">Get Certified.</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-lg">
            Master Excel, Power BI, Accounting, IFRS, Coding &amp; more with SAFCO FinTech&apos;s
            SAFCO Live Quizzes and industry-recognized certifications.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className="btn-accent text-base px-6 py-3">
              Anza Sasa <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/play" className="btn-outline-accent text-base px-6 py-3">
              🎯 Cheza Quiz (with PIN)
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-200 flex items-center gap-6 text-sm text-slate-500">
            <div>
              <div className="text-2xl font-black text-navy-500">10K+</div>
              <div>Wanafunzi</div>
            </div>
            <div>
              <div className="text-2xl font-black text-navy-500">6+</div>
              <div>Benki &amp; Taasisi</div>
            </div>
            <div>
              <div className="text-2xl font-black text-navy-500">10+</div>
              <div>Kozi Categories</div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="aspect-square rounded-3xl bg-gradient-to-br from-navy-500 via-navy-600 to-navy-800 p-10 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,166,35,0.25),transparent_60%)]" />
            <Image
              src="/logo.png"
              alt=""
              width={400}
              height={120}
              className="brightness-0 invert opacity-90 relative"
            />
            <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 text-white">
              <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-xl">
                🎯
              </div>
              <div>
                <div className="font-bold">SAFCO Live Quizzes</div>
                <div className="text-xs text-white/70">Real-time competitions with PIN codes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-navy-500 mb-3">
              Kila kitu unachohitaji kujifunza
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Jukwaa moja lenye kila zana ya mafunzo, upimaji, na uthibitisho.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: GraduationCap, title: '10+ Course Categories', desc: 'Excel, Power BI, Finance, IFRS, ERP & more' },
              { icon: Zap, title: 'SAFCO Live Quizzes', desc: 'Live competitions with real-time leaderboards' },
              { icon: Trophy, title: 'Certificates', desc: 'QR-verifiable certificates on completion' },
              { icon: Users, title: 'Trusted by Banks', desc: 'BOT · CRDB · NMB · NBC · SACCOS' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 hover:shadow-md transition">
                <div className="w-12 h-12 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-navy-500 mb-2">{title}</h3>
                <p className="text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-navy-500 py-16 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,166,35,0.15),transparent_50%)]" />
        <div className="max-w-3xl mx-auto px-6 relative">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Uko tayari kuanza?</h2>
          <p className="text-white/70 mb-8 text-lg">
            Jisajili leo — bure kwa wanafunzi wote.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn-accent text-base px-6 py-3">
              Jisajili Bure <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn bg-white/10 text-white border border-white/30 hover:bg-white/20 text-base px-6 py-3">
              Ingia
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <Logo width={100} height={30} />
          </div>
          <div>© 2026 SAFCO FINTECH LTD. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
