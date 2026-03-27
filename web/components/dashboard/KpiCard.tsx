"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useCountUp } from "./useCountUp";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type Trend = "up" | "down" | "neutral";
type Accent = "blue" | "green" | "yellow" | "red" | "ai";

const accentMap: Record<Accent, { color: string; glow: string; bg: string }> = {
  blue:    { color: "var(--primary)",    glow: "var(--glow-sm)",   bg: "rgba(79,142,247,0.08)"   },
  green:   { color: "var(--clr-green)",  glow: "var(--glow-green)",bg: "rgba(62,207,142,0.08)"   },
  yellow:  { color: "var(--clr-yellow)", glow: "none",             bg: "rgba(245,166,35,0.08)"   },
  red:     { color: "var(--clr-red)",    glow: "none",             bg: "rgba(242,95,92,0.08)"    },
  ai:      { color: "var(--clr-ai)",     glow: "var(--glow-ai)",   bg: "rgba(167,139,250,0.08)"  },
};

interface KpiCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  format?: "number" | "currency" | "percent";
  trend?: Trend;
  trendValue?: string;
  accent?: Accent;
  icon?: React.ReactNode;
  delay?: number;
}

export function KpiCard({
  label,
  value,
  prefix = "",
  suffix = "",
  format = "number",
  trend = "neutral",
  trendValue,
  accent = "blue",
  icon,
  delay = 0,
}: KpiCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const count = useCountUp(value, 1400, visible);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const formatted =
    format === "currency"
      ? `R$ ${count.toLocaleString("pt-BR")}`
      : format === "percent"
      ? `${count}%`
      : count.toLocaleString("pt-BR");

  const { color, glow, bg } = accentMap[accent];

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up" ? "var(--clr-green)" :
    trend === "down" ? "var(--clr-red)" :
    "var(--muted-foreground)";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative rounded-xl p-5 flex flex-col gap-3 overflow-hidden"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      whileHover={{
        borderColor: "rgba(79,142,247,0.30)",
        boxShadow: glow,
      }}
    >
      {/* Accent corner */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-12 translate-x-12 pointer-events-none"
        style={{ background: bg, filter: "blur(30px)" }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
          {label}
        </span>
        {icon && (
          <div
            className="p-1.5 rounded-md"
            style={{ background: bg, color }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end gap-1.5">
        {prefix && <span className="text-lg font-mono font-semibold mb-0.5" style={{ color }}>{prefix}</span>}
        <span
          className="text-3xl font-mono font-bold leading-none tabular-nums"
          style={{ color: "var(--foreground)" }}
        >
          {formatted}
        </span>
        {suffix && <span className="text-sm font-mono mb-0.5" style={{ color: "var(--muted-foreground)" }}>{suffix}</span>}
      </div>

      {/* Trend */}
      {trendValue && (
        <div className="flex items-center gap-1.5">
          <TrendIcon size={12} style={{ color: trendColor }} />
          <span className="text-xs font-medium font-mono" style={{ color: trendColor }}>
            {trendValue}
          </span>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>vs. mês anterior</span>
        </div>
      )}
    </motion.div>
  );
}
