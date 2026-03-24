'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Brain, Search, Briefcase, CheckSquare } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'

export function Sidebar() {
  const pathname = usePathname()

  const nav = [
    { name: 'Dashboard', href: '/dashboard', icon: Brain, exact: true },
    { name: 'Meetings', href: '/dashboard/meetings', icon: Briefcase },
    { name: 'Action Items', href: '/dashboard/action-items', icon: CheckSquare },
    { name: 'Semantic Search', href: '/dashboard/search', icon: Search },
  ]

  return (
    <div className="hidden lg:flex flex-col w-[260px] border-r border-zinc-100 bg-[#FAFAFC] p-6 shrink-0 h-full overflow-y-auto z-20">
      <div className="flex items-center gap-2.5 mb-10 pl-2 mt-4">
        <div className="h-7 w-7 rounded-[10px] bg-zinc-900 flex items-center justify-center shadow-sm">
          <Brain className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-[17px] tracking-tight text-zinc-900">MeetMind</span>
      </div>

      <div className="space-y-1.5 flex-1">
        {nav.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] transition-colors ${
                isActive
                  ? 'font-semibold bg-white shadow-sm text-zinc-900 border border-zinc-200/60'
                  : 'font-medium text-zinc-500 hover:bg-zinc-100 border border-transparent'
              }`}
            >
              <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`} />
              {item.name}
            </Link>
          )
        })}
      </div>

      <div className="mt-auto pt-6 pb-2 pl-2 flex items-center gap-3">
         <UserButton appearance={{ elements: { avatarBox: 'h-9 w-9 shadow-sm' } }} />
         <div>
           <p className="text-[14px] font-semibold text-zinc-900 leading-none">Account</p>
           <p className="text-[12px] font-medium text-zinc-500 mt-1">Manage settings</p>
         </div>
      </div>
    </div>
  )
}
