import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { ArrowRight, Brain, Zap, Search, Mail, CheckSquare, Clock, Mic2, Shield, Calendar, Users, Briefcase } from 'lucide-react'

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#CADDF1] via-[#E4F0FA] to-white overflow-hidden text-zinc-900 selection:bg-[#CADDF1] selection:text-black">
      
      {/* ── Soft Cloud Background Elements ── */}
      <div className="absolute top-[5%] -left-[10%] w-[50vw] h-[500px] opacity-[0.85] pointer-events-none">
        <div className="absolute top-10 left-10 w-[400px] h-[300px] bg-white rounded-full blur-[60px]"></div>
        <div className="absolute top-32 left-32 w-[300px] h-[250px] bg-white rounded-full blur-[40px]"></div>
        <div className="absolute top-0 left-40 w-[450px] h-[350px] bg-white rounded-full blur-[80px]"></div>
      </div>
      <div className="absolute top-[2%] -right-[15%] w-[60vw] h-[600px] opacity-[0.85] pointer-events-none">
        <div className="absolute top-20 right-20 w-[500px] h-[350px] bg-white rounded-full blur-[70px]"></div>
        <div className="absolute top-40 right-40 w-[350px] h-[250px] bg-white rounded-full blur-[50px]"></div>
        <div className="absolute -top-10 right-60 w-[400px] h-[300px] bg-white rounded-full blur-[60px]"></div>
      </div>

      {/* ── Header (Floating Pill) ── */}
      <header className="fixed top-6 inset-x-0 z-50 flex justify-center px-4">
        <div className="flex items-center justify-between w-full max-w-4xl px-3 py-2 bg-white/70 backdrop-blur-xl rounded-full shadow-[0_4px_24px_-8px_rgba(0,0,0,0.1)] border border-white/80">
          <div className="flex items-center gap-2.5 pl-3">
            <div className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-[16px] tracking-tight">MeetMind</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[14px] font-semibold text-zinc-600">
            <Link href="#features" className="hover:text-black transition-colors">Features</Link>
            <Link href="#benefits" className="hover:text-black transition-colors">Benefits</Link>
            <Link href="#pricing" className="hover:text-black transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="hidden sm:block text-[14px] font-semibold text-zinc-600 hover:text-black transition-colors">
              Sign in
            </Link>
            <Link href="/sign-up">
              <button className="bg-zinc-900 text-white px-5 py-2.5 rounded-full text-[14px] font-semibold hover:bg-black transition-transform hover:scale-105 active:scale-95 shadow-sm">
                Try MeetMind free
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative pt-[180px] pb-20">
        {/* ── Hero Section ── */}
        <section className="max-w-4xl mx-auto px-5 text-center relative z-10">
          <h1 className="text-[52px] sm:text-[80px] font-bold tracking-[-0.035em] leading-[1.05] mb-6 text-zinc-900">
            Run your meetings <br className="hidden sm:block"/> like a pro
          </h1>
          <p className="text-[17px] sm:text-[20px] max-w-2xl mx-auto mb-10 leading-[1.6] text-zinc-600 font-medium tracking-tight">
            All-in-one platform for transcribing, deciding, and acting without the chaos. From the first spoken word to the final organized email, we've got your back.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up">
              <button className="bg-zinc-900 text-white h-[52px] px-8 rounded-full text-[16px] font-semibold flex items-center justify-center gap-2 hover:bg-black transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-black/10">
                Try MeetMind free
              </button>
            </Link>
            <Link href="#features">
              <button className="bg-white/40 backdrop-blur-md text-zinc-900 border border-white/50 h-[52px] px-8 rounded-full text-[16px] font-semibold hover:bg-white/60 transition-colors">
                See features
              </button>
            </Link>
          </div>
        </section>

        {/* ── Product Dashboard Mockup ── */}
        <section className="max-w-6xl mx-auto px-5 mt-20 sm:mt-28 relative z-10">
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-white rounded-[32px] sm:rounded-[40px] overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] border-[8px] sm:border-[12px] border-white/60 backdrop-blur-sm flex">
            {/* Mockup Sidebar */}
            <div className="hidden sm:flex flex-col w-[240px] border-r border-zinc-100 bg-[#FAFAFC] p-6 h-full">
              <div className="flex items-center gap-2.5 mb-10">
                <div className="h-6 w-6 rounded-md bg-zinc-900 flex items-center justify-center">
                  <Brain className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-bold text-[15px] tracking-tight">MeetMind</span>
              </div>
              <div className="space-y-1">
                {[
                  { icon: Brain, label: 'Dashboard', active: true },
                  { icon: Briefcase, label: 'Meetings' },
                  { icon: CheckSquare, label: 'Action Items' },
                  { icon: Search, label: 'Semantic Search' },
                ].map((item: any) => (
                  <div key={item.label} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${item.active ? 'bg-white shadow-sm text-zinc-900 border border-zinc-200/60' : 'text-zinc-500 hover:bg-zinc-100'}`}>
                    <item.icon className={`h-[18px] w-[18px] ${item.active ? 'text-zinc-900' : 'text-zinc-400'}`} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup Main Content */}
            <div className="flex-1 bg-white p-6 sm:p-10 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-[22px] font-bold tracking-tight text-zinc-900 mb-1">Hello, Leonardo</h3>
                  <p className="text-[14px] text-zinc-500 font-medium">What meeting are you reviewing today?</p>
                </div>
                <div className="hidden sm:flex items-center px-4 py-2 bg-zinc-100 rounded-full text-[13px] text-zinc-500 border border-zinc-200/50">
                  <Search className="w-4 h-4 mr-2 text-zinc-400" /> Search all transcripts...
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Meetings', val: '142', trend: '+12%', color: 'text-emerald-600' },
                  { label: 'Action Items', val: '28', trend: '-2', color: 'text-rose-500' },
                  { label: 'Key Decisions', val: '86', trend: '+15', color: 'text-emerald-600' },
                  { label: 'Hours Saved', val: '34h', trend: '+8%', color: 'text-emerald-600' }
                ].map((s: any) => (
                  <div key={s.label} className="p-4 sm:p-5 rounded-[20px] bg-[#FAFAFC] border border-zinc-100 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm border border-zinc-100">
                        <Briefcase className="w-[14px] h-[14px] text-zinc-500" />
                      </div>
                      <span className="text-[12px] font-semibold text-zinc-500">{s.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[28px] sm:text-[32px] font-bold tracking-tight text-zinc-900 leading-none">{s.val}</span>
                      <span className={`text-[12px] font-bold ${s.color}`}>{s.trend}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lower mock area */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white min-h-0">
                <div className="col-span-2 border border-zinc-100 bg-[#FAFAFC] rounded-[24px] p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-[15px] text-zinc-900">Meeting Activity</h4>
                    <div className="px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-[12px] font-semibold text-zinc-600 shadow-sm">This Month ⌄</div>
                  </div>
                  {/* Fake Chart Bars */}
                  <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 px-2">
                    {[40, 60, 30, 80, 50, 90, 45, 78, 30, 60, 85].map((h, i) => (
                      <div key={i} className="w-full bg-blue-100 rounded-t-sm" style={{ height: `${h}%` }}>
                        <div className="w-full bg-blue-500 rounded-t-md opacity-80" style={{ height: `${h * 0.7}%` }}></div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-3 h-full">
                  {[
                    { title: 'Upload Audio', icon: Mic2 },
                    { title: 'New Summary', icon: Brain },
                    { title: 'Find Item', icon: Search },
                    { title: 'Send Email', icon: Mail }
                  ].map((a: any) => (
                    <div key={a.title} className="bg-[#FAFAFC] border border-zinc-100 rounded-[20px] p-4 flex flex-col items-center justify-center text-center hover:bg-zinc-50 transition-colors">
                      <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                        <a.icon className="w-4 h-4 text-zinc-700" />
                      </div>
                      <span className="text-[13px] font-semibold text-zinc-700">{a.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Features & Benefits Section (Split Layout) ── */}
      <section id="features" className="bg-white rounded-t-[40px] sm:rounded-t-[60px] pt-24 pb-32 relative z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.02)]">
        <div className="max-w-6xl mx-auto px-5 grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Visual Card (Left) */}
          <div className="order-2 lg:order-1 bg-gradient-to-br from-[#A5C8EA] to-[#f4ebe1] p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-lg transform rotate-[-1deg] hover:rotate-0 transition-transform duration-500">
            <div className="bg-[#FAFAFC] rounded-[24px] shadow-sm border border-black/5 p-6 min-h-[420px] flex flex-col">
              <h3 className="font-bold text-[18px] text-zinc-900 mb-6 flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" /> Recent Meetings
              </h3>
              
              <div className="space-y-3 flex-1">
                {/* Fake Meeting Rows */}
                {[
                  { title: 'Q2 Product Launch Strategy', status: 'High', statColor: 'text-rose-600 bg-rose-100', users: 4 },
                  { title: 'Marketing Sync & Ads Review', status: 'Medium', statColor: 'text-orange-600 bg-orange-100', users: 3 },
                  { title: 'Engineering Standup', status: 'Low', statColor: 'text-emerald-600 bg-emerald-100', users: 6 },
                  { title: 'Client Onboarding (Acme)', status: 'High', statColor: 'text-rose-600 bg-rose-100', users: 2 },
                  { title: 'Design System Update', status: 'Medium', statColor: 'text-orange-600 bg-orange-100', users: 3 },
                ].map((m: any) => (
                  <div key={m.title} className="flex items-center justify-between p-3.5 bg-white rounded-[16px] shadow-sm border border-black/5">
                    <div className="flex-1 overflow-hidden pr-2">
                      <p className="text-[14px] font-bold text-zinc-800 truncate">{m.title}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${m.statColor}`}>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1"></span>{m.status}
                      </span>
                      <div className="hidden sm:flex -space-x-1.5">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center overflow-hidden">
                            <span className="text-[8px] font-bold text-zinc-500">U{i+1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Text & Content (Right) */}
          <div className="order-1 lg:order-2">
            <p className="text-[12px] font-bold uppercase tracking-[0.15em] mb-4 text-zinc-500">Meeting Intelligence</p>
            <h2 className="text-[40px] sm:text-[48px] font-bold tracking-tight leading-[1.1] mb-6 text-zinc-900">
              Keep every project moving forward
            </h2>
            <p className="text-[17px] leading-[1.6] text-zinc-500 mb-8 font-medium">
              <strong className="text-zinc-800">Plan, assign, and deliver your work</strong> — all in one place. With smart action item extraction, key decision logs, and an automatic email to attendees, you stay organized and clients stay confident.
            </p>
            <div className="mb-10">
              <Link href="/sign-up">
                <button className="bg-zinc-900 text-white h-12 px-8 rounded-full text-[15px] font-semibold hover:bg-black transition-transform hover:scale-105 active:scale-95 shadow-md">
                  Try MeetMind free
                </button>
              </Link>
            </div>
            
            {/* Feature Pills Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Action Items', icon: CheckSquare },
                { label: 'Semantic Search', icon: Search },
                { label: 'Transcripts', icon: Mic2 },
                { label: 'Automated Minutes', icon: Mail }
              ].map((f: any) => (
                <div key={f.label} className="flex items-center justify-center sm:justify-start gap-2.5 px-5 py-3.5 rounded-full border border-zinc-200 text-[14px] font-semibold text-zinc-700 bg-white hover:border-zinc-300 transition-colors">
                  <f.icon className="w-[18px] h-[18px] text-zinc-400" /> {f.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer / CTA Card ── */}
      <footer className="bg-white relative z-10 px-5 pb-10">
        <div className="max-w-6xl mx-auto">
          {/* Main big CTA Block matching Dreelio's bottom area */}
          <div className="bg-[#E4F0FA] rounded-[32px] sm:rounded-[40px] p-10 sm:p-20 flex flex-col items-center text-center relative overflow-hidden">
            {/* Decorative inner clouds for footer */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50">
               <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[400px] bg-white rounded-full blur-[80px]"></div>
               <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[400px] bg-white rounded-full blur-[80px]"></div>
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[13px] font-bold text-zinc-700 mb-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <Brain className="w-4 h-4 text-blue-500" /> MeetMind AI
              </div>
              <h2 className="text-[42px] sm:text-[56px] font-bold tracking-tight mb-5 text-zinc-900 leading-[1.1]">
                Ready to get started
              </h2>
              <p className="text-zinc-600 text-[17px] mb-8 font-medium">
                Transform your meetings into actionable insights. No credit card required.
              </p>
              <Link href="/sign-up">
                <button className="bg-zinc-900 text-white h-[52px] px-10 rounded-full text-[16px] font-semibold hover:bg-black transition-transform hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
                  Try MeetMind free
                </button>
              </Link>
            </div>

            {/* Footer Links Matrix inside the card */}
            <div className="w-full max-w-4xl mt-24 pt-12 border-t border-black/[0.06] flex flex-col md:flex-row items-center justify-between text-left gap-10 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-6 rounded-full bg-zinc-900 flex items-center justify-center">
                    <Brain className="h-3 w-3 text-white" />
                  </div>
                  <span className="font-bold text-[16px] tracking-tight">MeetMind</span>
                </div>
                <p className="text-[14px] text-zinc-500 font-medium max-w-[250px] mb-6 leading-relaxed">
                  Your favourite business intelligence software. Built for modern startup founders.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-16 md:gap-24">
                <div>
                  <h4 className="font-bold text-[13px] tracking-widest uppercase mb-5 text-zinc-900">Pages</h4>
                  <ul className="space-y-4 text-[14px] font-medium text-zinc-600">
                    <li><Link href="#" className="hover:text-black transition-colors">Home</Link></li>
                    <li><Link href="#features" className="hover:text-black transition-colors">Features</Link></li>
                    <li><Link href="#pricing" className="hover:text-black transition-colors">Pricing</Link></li>
                    <li><Link href="#" className="hover:text-black transition-colors">Blog</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-[13px] tracking-widest uppercase mb-5 text-zinc-900">Information</h4>
                  <ul className="space-y-4 text-[14px] font-medium text-zinc-600">
                    <li><Link href="#" className="hover:text-black transition-colors">Contact</Link></li>
                    <li><Link href="#" className="hover:text-black transition-colors">Privacy</Link></li>
                    <li><Link href="#" className="hover:text-black transition-colors">Terms of use</Link></li>
                    <li><Link href="#" className="hover:text-black transition-colors">404</Link></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Copyright Line */}
            <div className="w-full max-w-4xl mt-12 pt-6 border-t border-black/[0.06] flex flex-col sm:flex-row items-center justify-between text-[13px] text-zinc-500 font-medium relative z-10">
              <p>© 2026 MeetMind AI. Created by You</p>
              <p className="mt-2 sm:mt-0">Built in Next.js + Tailwind</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
