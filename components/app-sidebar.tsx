"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    FileText,
    MessageSquare,
    Settings,
    LayoutDashboard,
    BookUser,
    LogOut,
    Zap,
    Activity,
    Box
} from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/reports", label: "Relatórios", icon: FileText, permissionRequired: 'REPORTS_VIEW' },
    { href: "/messages", label: "Comunicados", icon: MessageSquare, permissionRequired: 'MESSAGES_VIEW' },
    { href: "/contacts", label: "Contatos", icon: BookUser, permissionRequired: 'CONTACTS_VIEW' },
    { href: "/settings", label: "Configurações", icon: Settings, permissionRequired: 'SETTINGS_VIEW' },
    { href: "https://trontec-dash-rondas.vercel.app/", label: "Dashboard Rondas", icon: Activity, external: true, permissionRequired: 'DASH_RONDAS_VIEW' },
    { href: "https://trontec-extras.vercel.app/", label: "Trontec Extras", icon: Box, external: true, permissionRequired: 'TRONTEC_EXTRAS_VIEW' },
]

export function AppSidebar({ userPermissions = [] }: { userPermissions?: string[] }) {
    const pathname = usePathname()

    return (
        <aside className="w-full h-full bg-sidebar flex flex-col border-r border-sidebar-border shadow-sm">
            {/* Logo */}
            <div className="px-6 py-5 border-b border-sidebar-border">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary/10">
                        <Zap className="h-5 w-5 text-sidebar-primary" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[15px] font-semibold text-sidebar-accent-foreground tracking-tight">
                            Trontec AI
                        </span>
                        <span className="text-[11px] text-sidebar-foreground/60 leading-none">
                            Plataforma de Comunicações
                        </span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                <span className="px-3 mb-2 block text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                    Menu
                </span>
                {navLinks.map((link) => {
                    if (link.permissionRequired && !userPermissions.includes(link.permissionRequired)) return null

                    const Icon = link.icon
                    const isActive = link.href === "/"
                        ? pathname === "/"
                        : (!link.external && pathname.startsWith(link.href))

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            target={link.external ? "_blank" : undefined}
                            rel={link.external ? "noopener noreferrer" : undefined}
                            className={cn(
                                "nav-item",
                                isActive
                                    ? "active"
                                    : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
                            )}
                        >
                            <Icon className="h-[18px] w-[18px]" />
                            <span>{link.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
                <button
                    onClick={async () => {
                        await fetch('/api/auth/logout', { method: 'POST' })
                        window.location.reload()
                    }}
                    className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                >
                    <LogOut className="h-[18px] w-[18px]" />
                    <span>Sair do Sistema</span>
                </button>
                <div className="px-3 py-1 text-[10px] text-sidebar-foreground/30 flex items-center justify-between">
                    <span>v1.2.0</span>
                    <span>Trontec</span>
                </div>
            </div>
        </aside>
    )
}
