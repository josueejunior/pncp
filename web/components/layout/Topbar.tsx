"use client";

import { Bell, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between px-6"
      style={{
        left: "var(--sidebar-w)",
        height: "var(--nav-h)",
        background: "rgba(10,10,15,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Título */}
      <div className="flex flex-col">
        <h1 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all duration-150 hover:bg-white/5"
          style={{
            color: "var(--muted-foreground)",
            border: "1px solid var(--border)",
            background: "rgba(79,142,247,0.04)",
          }}
        >
          <Search size={13} />
          <span>Buscar edital...</span>
          <kbd
            className="ml-2 text-xs rounded px-1 font-mono"
            style={{ background: "rgba(240,240,248,0.08)", color: "var(--text-dim)" }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Notificações */}
        <button
          className="relative p-2 rounded-md transition-all duration-150 hover:bg-white/5"
          style={{ color: "var(--muted-foreground)" }}
        >
          <Bell size={16} />
          <Badge
            className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center p-0 text-xs font-bold"
            style={{ background: "var(--clr-ai)", color: "#0a0a0f", border: "none" }}
          >
            3
          </Badge>
        </button>

        {/* Status IA */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono"
          style={{
            background: "rgba(167,139,250,0.08)",
            border: "1px solid rgba(167,139,250,0.20)",
            color: "var(--clr-ai)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "var(--clr-ai)" }}
          />
          IA ativa
        </div>
      </div>
    </header>
  );
}
