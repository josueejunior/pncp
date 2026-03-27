"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import type { StatusId, ModalidadeId, EsferaId } from "./types";

export interface Filters {
  search: string;
  status: StatusId | "all";
  modalidade: ModalidadeId | "all";
  esfera: EsferaId | "all";
  apenasIa: boolean;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  total: number;
  filtered: number;
}

const statusOpts: { value: StatusId | "all"; label: string }[] = [
  { value: "all",      label: "Todos status"    },
  { value: "ativo",    label: "Ativos"          },
  { value: "encerrando", label: "Encerrando"    },
  { value: "resultado",  label: "Com resultado" },
  { value: "encerrado",  label: "Encerrados"    },
];

const modalidadeOpts: { value: ModalidadeId | "all"; label: string }[] = [
  { value: "all",           label: "Todas modalidades"  },
  { value: "pregao",        label: "Pregão Eletrônico"  },
  { value: "dispensa",      label: "Dispensa"           },
  { value: "inexigibilidade", label: "Inexigibilidade"  },
  { value: "concorrencia",  label: "Concorrência"       },
];

const esferaOpts: { value: EsferaId | "all"; label: string }[] = [
  { value: "all", label: "Todas esferas" },
  { value: "F",   label: "Federal"       },
  { value: "E",   label: "Estadual"      },
  { value: "M",   label: "Municipal"     },
];

const selectStyle = {
  background: "rgba(79,142,247,0.06)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  borderRadius: "8px",
  padding: "6px 12px",
  fontSize: "13px",
  outline: "none",
  cursor: "pointer",
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
};

export function EditaisFilters({ filters, onChange, total, filtered }: Props) {
  const hasActiveFilters =
    filters.search || filters.status !== "all" ||
    filters.modalidade !== "all" || filters.esfera !== "all" || filters.apenasIa;

  return (
    <div className="flex flex-col gap-3">
      {/* Linha 1: search + contagem */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg"
          style={{ background: "rgba(79,142,247,0.06)", border: "1px solid var(--border)" }}
        >
          <Search size={14} style={{ color: "var(--muted-foreground)" }} />
          <input
            type="text"
            placeholder="Buscar por software, órgão ou número de controle..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--foreground)" }}
          />
          {filters.search && (
            <button onClick={() => onChange({ ...filters, search: "" })}>
              <X size={13} style={{ color: "var(--muted-foreground)" }} />
            </button>
          )}
        </div>

        <div
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono"
          style={{ background: "rgba(79,142,247,0.06)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
        >
          <SlidersHorizontal size={13} />
          <span style={{ color: "var(--foreground)" }}>{filtered}</span>
          <span>/ {total}</span>
        </div>
      </div>

      {/* Linha 2: filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as StatusId | "all" })}
          style={selectStyle}
        >
          {statusOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          value={filters.modalidade}
          onChange={(e) => onChange({ ...filters, modalidade: e.target.value as ModalidadeId | "all" })}
          style={selectStyle}
        >
          {modalidadeOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          value={filters.esfera}
          onChange={(e) => onChange({ ...filters, esfera: e.target.value as EsferaId | "all" })}
          style={selectStyle}
        >
          {esferaOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Toggle IA */}
        <button
          onClick={() => onChange({ ...filters, apenasIa: !filters.apenasIa })}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-150"
          style={
            filters.apenasIa
              ? { background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.35)", color: "var(--clr-ai)" }
              : { background: "rgba(167,139,250,0.06)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }
          }
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: filters.apenasIa ? "var(--clr-ai)" : "var(--muted-foreground)" }}
          />
          Analisados por IA
        </button>

        {/* Limpar */}
        {hasActiveFilters && (
          <button
            onClick={() => onChange({ search: "", status: "all", modalidade: "all", esfera: "all", apenasIa: false })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 hover:bg-white/5"
            style={{ color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
          >
            <X size={11} />
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}
