import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { Sidebar } from '@/components/sidebar'
import { MobileHeader } from '@/components/mobile-header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="h-screen w-full bg-white flex overflow-hidden font-sans selection:bg-blue-100 selection:text-black">
      <Sidebar />

      {/* Main Content Area - Full Height */}
      <div className="flex-1 bg-white h-full overflow-y-auto w-full relative flex flex-col">
        <MobileHeader />
        
        <div className="flex-1 overflow-auto relative">
          {children}
        </div>
      </div>
    </div>
  )
}
