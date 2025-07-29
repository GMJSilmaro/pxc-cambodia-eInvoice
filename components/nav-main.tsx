"use client"

import { IconCirclePlusFilled, IconMail, IconChevronRight, IconBell, type Icon } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create Invoice"
              asChild
              className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-medium shadow-sm transition-colors duration-200"
            >
              <Link href="/caminv/invoices/create" className="flex items-center gap-3">
                <IconCirclePlusFilled className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">Quick Create</span>
              </Link>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0 border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 relative"
              variant="outline"
              asChild
            >
              <Link href="/updates">
                <IconBell className="h-4 w-4" />
                <span className="sr-only">What's New</span>
                {/* Notification dot for new updates */}
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-slate-900 rounded-full"></span>
              </Link>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url || (item.url !== '/' && pathname.startsWith(item.url))

            if (item.items && item.items.length > 0) {
              // CamInv E-Invoicing should be expanded by default
              const shouldBeOpen = isActive || item.title === "CamInv E-Invoicing"
              return (
                <Collapsible key={item.title} defaultOpen={shouldBeOpen} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                        className="group/button hover:bg-slate-50 dark:hover:bg-slate-800 data-[state=open]:bg-slate-50 dark:data-[state=open]:bg-slate-800 transition-colors duration-200 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                      >
                        {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
                        <span className="font-medium truncate">{item.title}</span>
                        <IconChevronRight className="ml-auto h-4 w-4 flex-shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => {
                          const isSubActive = pathname === subItem.url
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive}
                                className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                              >
                                <Link href={subItem.url} className="flex items-center">
                                  <span className="text-sm truncate">{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  asChild
                  isActive={isActive}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                >
                  <Link href={item.url} className="flex items-center gap-3">
                    {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
                    <span className="font-medium truncate">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
