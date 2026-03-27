"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Search,
  Bell,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
  { href: "/editais",    icon: FileText,        label: "Editais" },
  { href: "/orgaos",     icon: Building2,       label: "Órgãos" },
  { href: "/busca",      icon: Search,          label: "Busca" },
  { href: "/alertas",    icon: Bell,            label: "Alertas" },
];

const bottomItems = [
  { href: "/configuracoes", icon: Settings, label: "Configurações" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-40"
      style={{ width: "var(--sidebar-w)", background: "var(--sidebar)", borderRight: "1px solid var(--border)" }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-5 font-mono font-bold text-sm tracking-wider"
        style={{ height: "var(--nav-h)", borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="flex items-center justify-center w-7 h-7 rounded-md text-xs font-black"
          style={{ background: "var(--accent-grad)", color: "#0a0a0f" }}
        >
          <Zap size={14} strokeWidth={3} />
        </div>
        <span style={{ color: "var(--foreground)" }}>PNCP</span>
        <span style={{ color: "var(--primary)" }}>Intel</span>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150",
                active
                  ? "text-white"
                  : "hover:bg-white/5"
              )}
              style={
                active
                  ? {
                      background: "rgba(79,142,247,0.15)",
                      color: "var(--primary)",
                      boxShadow: "inset 2px 0 0 var(--primary)",
                    }
                  : { color: "var(--muted-foreground)" }
              }
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 flex flex-col gap-1" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="pt-3">
          {bottomItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 hover:bg-white/5"
              style={{ color: "var(--muted-foreground)" }}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </Link>
          ))}
        </div>

        {/* User chip */}
        <div
          className="mt-2 mx-1 px-3 py-2.5 rounded-md flex items-center gap-3"
          style={{ background: "rgba(79,142,247,0.08)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "var(--accent-grad)", color: "#0a0a0f" }}
          >
            A
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium truncate" style={{ color: "var(--foreground)" }}>Analista</span>
            <span className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>interno</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
