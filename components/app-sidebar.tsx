"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconDashboard,
  IconInnerShadowTop,
  IconSettings,
  IconUsers,
  IconActivity,
  IconShield,
  IconFileInvoice,
  IconReceipt,
  IconBuilding,
  IconUserCheck,
  IconChartBar,
  IconBell,
  IconHistory,
  IconHome,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconHome,
    },
    {
      title: "CamInv E-Invoicing",
      url: "/caminv",
      icon: IconFileInvoice,
      items: [
        {
          title: "Invoices",
          url: "/caminv/invoices",
        },
        {
          title: "Create Invoice",
          url: "/caminv/invoices/create",
        },
        {
          title: "Merchants",
          url: "/caminv/merchants",
        },
        {
          title: "Customers",
          url: "/caminv/customers",
        },
      ],
    },
    {
      title: "Analytics (Coming Soon)",
      url: "/",
      icon: IconChartBar,
      disabled: true
    },
    {
      title: "Team Management (Coming Soon)",
      url: "/",
      icon: IconUsers,
      disabled: true
    },
    {
      title: "Activity Log (Coming Soon)",
      url: "/",
      icon: IconActivity,
      disabled: true
    },
    {
      title: "Security (Coming Soon)",
      url: "/",
      icon: IconShield,
      disabled: true
    },
  ],
  navSecondary: [
    {
      title: "What's New",
      url: "/updates",
      icon: IconBell,
    },
    {
      title: "Settings",
      url: "/general",
      icon: IconSettings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200"
            >
              <Link href="/" className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100">
                  <IconInnerShadowTop className="h-5 w-5 text-white dark:text-slate-900" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                    PXC Cambodia
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    E-Invoice Portal
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
