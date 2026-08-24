'use client';

import { Users } from 'lucide-react';

export default function TrainerStudentsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-7 h-7 text-orange-500" /> My Students
        </h1>
        <p className="text-slate-600 mt-1">Wanafunzi walioshiriki quizzes zako (aggregated).</p>
      </div>
      <div className="card p-12 text-center">
        <div className="text-6xl mb-4">👥</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Coming — bado inaunganishwa</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Kwa sasa angalia <a href="/trainer/sessions" className="text-brand-600 underline">Session History</a> — kila session
          inaonyesha washiriki wake + alama zao.
        </p>
      </div>
    </div>
  );
}
