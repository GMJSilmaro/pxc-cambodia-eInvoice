'use client'

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { EnhancedBreadcrumb } from "@/components/ui/enhanced-breadcrumb"
import { usePathname } from 'next/navigation'

const getPageTitle = (pathname: string): string => {
  if (pathname === '/') return 'Dashboard'
  if (pathname === '/team') return 'Team Settings'
  if (pathname === '/general') return 'General Settings'
  if (pathname === '/activity') return 'Activity Log'
  if (pathname === '/security') return 'Security Settings'
  if (pathname.startsWith('/caminv')) return 'CamInv E-Invoicing'
  if (pathname === '/pricing') return 'Pricing'
  return 'Dashboard'
}

export function SiteHeader() {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 sm:gap-3 lg:gap-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-1 sm:mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-sm sm:text-base font-medium truncate">{pageTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
          <EnhancedBreadcrumb showHome={true} className="hidden sm:flex" />
        </div>
      </div>
    </header>
  )
}
