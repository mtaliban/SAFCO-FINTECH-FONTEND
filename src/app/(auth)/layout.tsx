import { Logo } from '@/components/ui/Logo';
import { GraduationCap, Award, Zap, Building2 } from 'lucide-react';

const features = [
  {
    icon: Award,
    title: 'Certified Learning',
    desc: 'QR-verifiable certificates recognized across East Africa',
  },
  {
    icon: Zap,
    title: 'SAFCO Live Quizzes',
    desc: 'Compete in real time — PIN-based, instant leaderboard',
  },
  {
    icon: Building2,
    title: 'Trusted by Banks',
    desc: 'BOT · CRDB · NMB · NBC · SACCOS',
  },
  {
    icon: GraduationCap,
    title: 'Excel, Power BI, IFRS',
    desc: 'Professional courses built for East African finance',
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left brand panel (desktop) ── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between p-10 xl:p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0f2a50 0%, #1a3f72 55%, #0d2040 100%)' }}>

        {/* Decorative blobs */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,166,35,0.18),transparent_55%)]" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute top-1/2 right-0 w-64 h-64 rounded-full bg-blue-500/8 blur-3xl" />

        {/* Logo */}
        <div className="relative">
          <Logo variant="white" width={150} height={44} className="mb-12" />

          <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-4">
            Anza safari yako ya{' '}
            <span className="text-orange-400">kujifunza</span>.
          </h1>
          <p className="text-base text-white/70 leading-relaxed max-w-sm">
            Jiunge na maelfu ya wataalam wanaojifunza Excel, Power BI, Accounting,
            IFRS na ERP kupitia jukwaa la kisasa la Afrika Mashariki.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative space-y-3">
          {features.map((f) => (
            <div key={f.title} className="flex items-center gap-4 group">
              <div className="w-11 h-11 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0 group-hover:bg-orange-500/30 transition">
                <f.icon className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <div className="font-bold text-white text-sm">{f.title}</div>
                <div className="text-xs text-white/55">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="relative text-[11px] text-white/30 mt-8">
          © {new Date().getFullYear()} SAFCO FINTECH LTD · Tanzania
        </div>
      </div>

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden bg-navy-500 px-6 py-5 flex items-center justify-center"
        style={{ background: 'linear-gradient(90deg, #0f2a50, #1a3f72)' }}>
        <Logo variant="white" width={130} height={38} />
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-start lg:items-center justify-center px-5 py-8 sm:px-8 sm:py-10 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-[440px]">
          {children}
        </div>
      </div>

    </div>
  );
}
