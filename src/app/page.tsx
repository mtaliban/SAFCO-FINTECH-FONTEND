'use client';

import Link from 'next/link';
import { ArrowRight, GraduationCap, Trophy, Users, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-slate-900 text-white">
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center font-bold">
              SF
            </div>
            <span className="font-bold text-lg">SAFCO FINTECH LMS</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-white/80 hover:text-white">
              Login
            </Link>
            <Link href="/register" className="btn bg-white text-brand-700 hover:bg-brand-50">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-sm font-medium mb-6 border border-white/20">
          🇹🇿 Tanzania&apos;s Leading Training Platform
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
          Learn. Compete. <span className="text-brand-300">Get Certified.</span>
        </h1>
        <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
          Master Excel, Power BI, Accounting, IFRS, Coding & more with SAFCO FINTECH&apos;s
          Kahoot-style interactive quizzes and professional certifications.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/register" className="btn bg-brand-500 text-white hover:bg-brand-400 text-base px-6 py-3">
            Anza Sasa <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="btn bg-white/10 text-white border border-white/20 hover:bg-white/20 text-base px-6 py-3">
            I Have an Account
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-6">
        {[
          { icon: GraduationCap, title: '10+ Course Categories', desc: 'Excel, Power BI, Finance, IFRS, ERP & more' },
          { icon: Zap, title: 'Kahoot-Style Quizzes', desc: 'Live competitions with real-time leaderboards' },
          { icon: Trophy, title: 'Certificates', desc: 'QR-verifiable certificates on completion' },
          { icon: Users, title: '10,000+ Users', desc: 'Trusted by BOT, CRDB, NMB & more' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition">
            <Icon className="w-8 h-8 text-brand-300 mb-4" />
            <h3 className="font-bold mb-2">{title}</h3>
            <p className="text-sm text-white/70">{desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/60">
        © 2026 SAFCO FINTECH LTD · Backend API: <code className="text-brand-300">localhost:8000/api/v1</code>
      </footer>
    </main>
  );
}
