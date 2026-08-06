import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-800 via-brand-900 to-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.1),transparent_50%)]" />

        <div className="relative">
          <Link href="/" className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center font-bold">SF</div>
            <span className="font-bold text-lg">SAFCO FINTECH LMS</span>
          </Link>

          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Anza safari yako ya <span className="text-brand-300">kujifunza</span>.
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Jiunge na maelfu ya wanafunzi wanaojifunza Excel, Power BI, Accounting, IFRS na coding
            kupitia jukwaa la kisasa la Kahoot-style quizzes.
          </p>
        </div>

        <div className="relative space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-500/30 flex items-center justify-center text-2xl">🏆</div>
            <div>
              <div className="font-semibold">Certifications</div>
              <div className="text-sm text-white/60">QR-verifiable, industry recognized</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-500/30 flex items-center justify-center text-2xl">⚡</div>
            <div>
              <div className="font-semibold">Kahoot-Style Live Quizzes</div>
              <div className="text-sm text-white/60">Compete in real time, climb the leaderboard</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-500/30 flex items-center justify-center text-2xl">🏦</div>
            <div>
              <div className="font-semibold">Trusted by Banks</div>
              <div className="text-sm text-white/60">BOT · CRDB · NMB · NBC · SACCOS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - forms */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-slate-50">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
