"use client";

import { motion } from "framer-motion";
import { Clock, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AlertType = "new" | "closing" | "result" | "ai";

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  org: string;
  value?: string;
  time: string;
}

const MOCK_ALERTS: Alert[] = [
  { id: "1", type: "new",     title: "Autodesk AutoCAD 2025 — 15 licenças",      org: "Prefeitura de SP",    value: "R$ 48.000",  time: "3 min" },
  { id: "2", type: "closing", title: "Adobe Creative Cloud — 30 acessos/ano",   org: "Min. da Educação",   value: "R$ 120.000", time: "2h" },
  { id: "3", type: "ai",      title: "Gemini analisou 12 novos editais de SW",   org: "Processamento IA",                        time: "5 min" },
  { id: "4", type: "result",  title: "Microsoft 365 — vencedor: TechBR Ltda",   org: "TCU",                value: "R$ 89.500",  time: "1h" },
  { id: "5", type: "new",     title: "Bentley MicroStation — 8 licenças",        org: "DNIT",               value: "R$ 32.000",  time: "18 min" },
];

const typeConfig: Record<AlertType, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  new:     { icon: <Zap size={12} />,           color: "var(--clr-green)",  bg: "rgba(62,207,142,0.12)",  label: "Novo" },
  closing: { icon: <AlertTriangle size={12} />, color: "var(--clr-yellow)", bg: "rgba(245,166,35,0.12)",  label: "Encerrando" },
  result:  { icon: <CheckCircle2 size={12} />,  color: "var(--primary)",    bg: "rgba(79,142,247,0.12)",  label: "Resultado" },
  ai:      { icon: <Zap size={12} />,           color: "var(--clr-ai)",     bg: "rgba(167,139,250,0.12)", label: "IA" },
};

export function AlertFeed() {
  return (
    <div
      className="rounded-xl flex flex-col overflow-hidden"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--clr-green)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Feed de Alertas</h2>
        </div>
        <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
          via Discord
        </span>
      </div>

      {/* Items */}
      <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
        {MOCK_ALERTS.map((alert, i) => {
          const cfg = typeConfig[alert.type];
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors duration-150 hover:bg-white/[0.02]"
            >
              {/* Icon */}
              <div
                className="mt-0.5 p-1.5 rounded-md shrink-0"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                  {alert.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                    {alert.org}
                  </span>
                  {alert.value && (
                    <span className="text-xs font-mono font-semibold" style={{ color: cfg.color }}>
                      {alert.value}
                    </span>
                  )}
                </div>
              </div>

              {/* Time + badge */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  <Clock size={11} />
                  {alert.time}
                </div>
                <Badge
                  className="text-xs px-1.5 py-0 font-mono"
                  style={{ background: cfg.bg, color: cfg.color, border: "none" }}
                >
                  {cfg.label}
                </Badge>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
