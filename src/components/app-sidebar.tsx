"use client"

import { useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Upload, FolderTree, Settings } from "lucide-react"

type Mode = "upload" | "browse"

const navItems: { title: string; icon: typeof Upload; mode: Mode }[] = [
  {
    title: "Upload",
    icon: Upload,
    mode: "upload",
  },
  {
    title: "Browse",
    icon: FolderTree,
    mode: "browse",
  },
]

export function AppSidebar() {
  const [activeMode, setActiveMode] = useState<Mode>("upload")

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <span className="text-lg font-semibold">S3 CSV Ingest</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Mode</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={item.mode === activeMode}
                    onClick={() => setActiveMode(item.mode)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>File Tree</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 py-4 text-sm text-muted-foreground">
              S3 bucket contents will appear here
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
