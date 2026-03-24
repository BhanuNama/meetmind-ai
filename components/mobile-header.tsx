'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Menu, X, Plus, ArrowLeft, Briefcase, CheckSquare, Search } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import { UploadMeetingModal } from '@/components/upload-meeting-modal'

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Close the mobile menu automatically when the path changes
  useEffect(() => { setIsOpen(false) }, [pathname])

  const nav = [
    { name: 'Dashboard', href: '/dashboard', icon: Brain, exact: true },
    { name: 'Meetings', href: '/dashboard/meetings', icon: Briefcase },
    { name: 'Action Items', href: '/dashboard/action-items', icon: CheckSquare },
    { name: 'Semantic Search', href: '/dashboard/search', icon: Search },
  ]

  const isMeetingDetail = pathname.startsWith('/dashboard/meetings/') && pathname !== '/dashboard/meetings'

  return (
    <>
      {/* Glassmorphic Navbar */}
      <div className="lg:hidden sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-200/60 shadow-sm px-4 py-3 flex items-center justify-between">
        
        <div className="flex items-center gap-3">
          {/* Always show hamburger */}
          <button onClick={() => setIsOpen(true)} className="h-9 w-9 rounded-full bg-[#FAFAFC] border border-zinc-200 flex items-center justify-center text-zinc-600 active:scale-95 transition-transform">
            <Menu className="h-[18px] w-[18px]" />
          </button>
          
          {/* Show back button only deep in meetings */}
          {isMeetingDetail && (
            <button onClick={() => router.back()} className="h-9 w-9 rounded-full bg-[#FAFAFC] border border-zinc-200 flex items-center justify-center text-zinc-600 active:scale-95 transition-transform">
              <ArrowLeft className="h-[18px] w-[18px]" />
            </button>
          )}

          <div className="flex items-center gap-2 ml-1">
            <div className="h-7 w-7 rounded-[8px] bg-zinc-900 flex items-center justify-center shadow-sm">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-[16px] tracking-tight text-zinc-900 hidden sm:block">MeetMind</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-zinc-900 text-white text-[13px] font-bold active:scale-95 transition-transform"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
          <div className="w-[1px] h-5 bg-zinc-200" />
          <UserButton appearance={{ elements: { avatarBox: 'h-8 w-8 shadow-sm' } }} />
        </div>
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[60] lg:hidden"
            />

            {/* Slide-out Menu */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[70] shadow-2xl flex flex-col lg:hidden border-r border-zinc-100"
            >
              <div className="p-5 flex items-center justify-between border-b border-zinc-100 bg-[#FAFAFC]">
                <div className="flex items-center gap-2.5 pl-1">
                  <div className="h-7 w-7 rounded-[8px] bg-zinc-900 flex items-center justify-center shadow-sm">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-[17px] tracking-tight text-zinc-900">Menu</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 active:scale-95">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 space-y-1.5 flex-1 overflow-y-auto">
                {nav.map((item) => {
                  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-[15px] transition-colors ${
                        isActive
                          ? 'font-bold bg-[#FAFAFC] shadow-sm text-zinc-900 border border-zinc-200/80'
                          : 'font-semibold text-zinc-500 hover:bg-zinc-50 border border-transparent cursor-pointer'
                      }`}
                    >
                      <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`} />
                      {item.name}
                    </Link>
                  )
                })}
              </div>

              <div className="p-5 border-t border-zinc-100 bg-[#FAFAFC] flex items-center gap-3">
                 <UserButton appearance={{ elements: { avatarBox: 'h-10 w-10 shadow-sm' } }} />
                 <div>
                   <p className="text-[15px] font-bold text-zinc-900 leading-none">Account</p>
                   <p className="text-[13px] font-medium text-zinc-500 mt-1">Manage settings</p>
                 </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <UploadMeetingModal 
        open={uploadOpen} 
        onOpenChange={setUploadOpen} 
        onMeetingCreated={() => { window.location.reload() }} 
      />
    </>
  )
}
