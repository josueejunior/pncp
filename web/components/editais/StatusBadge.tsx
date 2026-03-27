import type { StatusId, ModalidadeId, EsferaId } from "./types";

/* ── Status ──────────────────────────────────────────────────────────────── */
const statusCfg: Record<StatusId, { label: string; color: string; bg: string; dot: boolean }> = {
  ativo:       { label: "Ativo",       color: "var(--clr-green)",  bg: "rgba(62,207,142,0.12)",  dot: true  },
  encerrando:  { label: "Encerrando",  color: "var(--clr-yellow)", bg: "rgba(245,166,35,0.12)",  dot: true  },
  encerrado:   { label: "Encerrado",   color: "var(--muted-foreground)", bg: "rgba(240,240,248,0.06)", dot: false },
  resultado:   { label: "Resultado",   color: "var(--primary)",    bg: "rgba(79,142,247,0.12)",  dot: false },
};

export function StatusBadge({ status }: { status: StatusId }) {
  const { label, color, bg, dot } = statusCfg[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium font-mono"
      style={{ background: bg, color }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />}
      {label}
    </span>
  );
}

/* ── Modalidade ──────────────────────────────────────────────────────────── */
const modalidadeCfg: Record<ModalidadeId, { label: string }> = {
  pregao:         { label: "Pregão Eletrônico" },
  dispensa:       { label: "Dispensa"          },
  inexigibilidade:{ label: "Inexigibilidade"   },
  concorrencia:   { label: "Concorrência"      },
};

export function ModalidadeBadge({ modalidade }: { modalidade: ModalidadeId }) {
  const { label } = modalidadeCfg[modalidade];
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ background: "rgba(240,240,248,0.06)", color: "var(--muted-foreground)" }}
    >
      {label}
    </span>
  );
}

/* ── Esfera ──────────────────────────────────────────────────────────────── */
const esferaCfg: Record<EsferaId, { label: string; color: string }> = {
  F: { label: "Federal",    color: "var(--primary)"   },
  E: { label: "Estadual",   color: "var(--clr-yellow)"},
  M: { label: "Municipal",  color: "var(--clr-green)" },
};

export function EsferaBadge({ esfera }: { esfera: EsferaId }) {
  const { label, color } = esferaCfg[esfera];
  return (
    <span className="text-xs font-mono font-semibold" style={{ color }}>
      {label}
    </span>
  );
}

/* ── IA Badge ────────────────────────────────────────────────────────────── */
export function IaBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-medium"
      style={{ background: "rgba(167,139,250,0.12)", color: "var(--clr-ai)" }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: "var(--clr-ai)" }} />
      IA
    </span>
  );
}

/* ── Match Score ─────────────────────────────────────────────────────────── */
export function MatchScore({ score }: { score: number }) {
  const color =
    score >= 85 ? "var(--clr-green)" :
    score >= 70 ? "var(--clr-yellow)" :
    "var(--muted-foreground)";

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(240,240,248,0.08)" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, background: color, transition: "width 0.6s ease-out" }}
        />
      </div>
      <span className="text-xs font-mono tabular-nums" style={{ color }}>{score}%</span>
    </div>
  );
}
