import { Logo } from '@/components/ui/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy-500 via-navy-700 to-navy-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,166,35,0.15),transparent_50%)]" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative">
          <Logo variant="white" width={160} height={48} className="mb-16" />

          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Anza safari yako ya <span className="text-orange-400">kujifunza</span>.
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Jiunge na maelfu ya wanafunzi wanaojifunza Excel, Power BI, Accounting, IFRS na coding
            kupitia jukwaa la kisasa la Kahoot-style quizzes.
          </p>
        </div>

        <div className="relative space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-2xl">🏆</div>
            <div>
              <div className="font-semibold">Certifications</div>
              <div className="text-sm text-white/60">QR-verifiable, industry recognized</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-2xl">⚡</div>
            <div>
              <div className="font-semibold">Kahoot-Style Live Quizzes</div>
              <div className="text-sm text-white/60">Compete in real time, climb the leaderboard</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-2xl">🏦</div>
            <div>
              <div className="font-semibold">Trusted by Banks</div>
              <div className="text-sm text-white/60">BOT · CRDB · NMB · NBC · SACCOS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo (hidden on desktop) */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo width={140} height={42} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
