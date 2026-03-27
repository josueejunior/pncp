"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ExternalLink, Lock, ChevronRight } from "lucide-react";
import type { Edital } from "./types";
import { StatusBadge, ModalidadeBadge, EsferaBadge, IaBadge, MatchScore } from "./StatusBadge";

function formatValue(value: number | null, sigiloso: boolean): React.ReactNode {
  if (sigiloso) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
        <Lock size={11} />
        Sigiloso
      </span>
    );
  }
  if (!value) return <span style={{ color: "var(--muted-foreground)" }}>—</span>;
  return (
    <span className="text-sm font-mono font-semibold tabular-nums" style={{ color: "var(--foreground)" }}>
      {value >= 1_000_000
        ? `R$ ${(value / 1_000_000).toFixed(1)}M`
        : `R$ ${value.toLocaleString("pt-BR")}`}
    </span>
  );
}

function daysUntil(dateStr: string): { days: number; urgent: boolean } {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
  return { days: diff, urgent: diff >= 0 && diff <= 5 };
}

interface Props {
  editais: Edital[];
  loading?: boolean;
}

export function EditaisTable({ editais, loading }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl animate-pulse"
            style={{ background: "var(--card)", opacity: 0.5 - i * 0.08 }}
          />
        ))}
      </div>
    );
  }

  if (editais.length === 0) {
    return (
      <div
        className="rounded-xl py-16 flex flex-col items-center gap-3"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <span className="text-3xl">🔍</span>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Nenhum edital encontrado com esses filtros.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* Header da tabela */}
      <div
        className="hidden lg:grid grid-cols-[1fr_160px_120px_120px_100px_80px_44px] gap-4 px-5 py-3 text-xs font-medium uppercase tracking-widest"
        style={{
          background: "rgba(79,142,247,0.04)",
          borderBottom: "1px solid var(--border)",
          color: "var(--muted-foreground)",
        }}
      >
        <span>Edital</span>
        <span>Valor</span>
        <span>Status</span>
        <span>Modalidade</span>
        <span>Encerra</span>
        <span>Match</span>
        <span />
      </div>

      {/* Rows */}
      <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
        {editais.map((edital, i) => {
          const { days, urgent } = daysUntil(edital.data_encerramento);

          return (
            <motion.div
              key={edital.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              <Link
                href={`/editais/${edital.id}`}
                className="group lg:grid grid-cols-[1fr_160px_120px_120px_100px_80px_44px] gap-4 px-5 py-4 flex flex-col transition-colors duration-150 hover:bg-white/[0.025]"
                style={{ display: "grid" } as React.CSSProperties}
              >
                {/* Edital info */}
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <EsferaBadge esfera={edital.esfera} />
                    {edital.analisado_ia && <IaBadge />}
                    <span
                      className="text-xs font-mono truncate"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {edital.numero_controle_pncp}
                    </span>
                  </div>
                  <p
                    className="text-sm font-medium leading-snug truncate transition-colors duration-150 group-hover:text-white"
                    style={{ color: "var(--foreground)" }}
                  >
                    {edital.titulo}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                    {edital.orgao}
                  </p>
                </div>

                {/* Valor */}
                <div className="flex items-center">
                  {formatValue(edital.valor_estimado, edital.orcamento_sigiloso)}
                </div>

                {/* Status */}
                <div className="flex items-center">
                  <StatusBadge status={edital.status} />
                </div>

                {/* Modalidade */}
                <div className="flex items-center">
                  <ModalidadeBadge modalidade={edital.modalidade} />
                </div>

                {/* Encerramento */}
                <div className="flex flex-col justify-center">
                  {days >= 0 ? (
                    <span
                      className="text-xs font-mono font-semibold"
                      style={{ color: urgent ? "var(--clr-yellow)" : "var(--muted-foreground)" }}
                    >
                      {days === 0 ? "Hoje" : `${days}d`}
                    </span>
                  ) : (
                    <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
                      Encerrado
                    </span>
                  )}
                  <span className="text-xs" style={{ color: "var(--text-dim, rgba(240,240,248,0.30))" }}>
                    {new Date(edital.data_encerramento).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                {/* Match */}
                <div className="flex items-center">
                  <MatchScore score={edital.match_score} />
                </div>

                {/* Chevron */}
                <div className="flex items-center justify-center">
                  <ChevronRight
                    size={16}
                    className="transition-transform duration-150 group-hover:translate-x-0.5"
                    style={{ color: "var(--muted-foreground)" }}
                  />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
