"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { OrgaoHistorico } from "./types";

interface Props {
  data: OrgaoHistorico[];
}

export function HistoricoChart({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

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

  const maxVal = Math.max(...data.map((d) => d.valor_total));

  return (
    <div ref={ref} className="flex flex-col gap-3">
      <div className="flex items-end gap-3 h-32">
        {data.map((d, i) => {
          const pct = (d.valor_total / maxVal) * 100;
          return (
            <div key={d.ano} className="flex-1 flex flex-col items-center gap-1.5 group">
              <span
                className="text-xs font-mono tabular-nums opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{ color: "var(--primary)" }}
              >
                R$ {(d.valor_total / 1000).toFixed(0)}k
              </span>
              <div className="w-full relative" style={{ height: "80px" }}>
                <div
                  className="absolute bottom-0 w-full rounded-t-md overflow-hidden"
                  style={{
                    height: "80px",
                    background: "rgba(79,142,247,0.10)",
                  }}
                >
                  <motion.div
                    className="absolute bottom-0 w-full rounded-t-md"
                    style={{ background: "var(--accent-grad)" }}
                    initial={{ height: 0 }}
                    animate={visible ? { height: `${pct}%` } : { height: 0 }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                  />
                </div>
              </div>
              <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
                {d.ano}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
