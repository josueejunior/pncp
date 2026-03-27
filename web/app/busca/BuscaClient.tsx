"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search, Sparkles, Clock, TrendingUp,
  ChevronRight, X, Zap, Target
} from "lucide-react";
import { api, type EditalAPI } from "@/lib/api";
import { MOCK_EDITAIS } from "@/components/editais/mock-data";
import { StatusBadge, EsferaBadge, MatchScore } from "@/components/editais/StatusBadge";
import type { StatusId, EsferaId } from "@/components/editais/types";

// ── Keywords Radar — buscas salvas ────────────────────────────
const DEFAULT_RADARS = [
  { id: "1", termo: "AutoCAD Autodesk",    cor: "var(--primary)",   hits: 14 },
  { id: "2", termo: "Adobe Creative Cloud", cor: "var(--clr-ai)",    hits: 7  },
  { id: "3", termo: "Microsoft 365",        cor: "var(--clr-green)", hits: 11 },
  { id: "4", termo: "ArcGIS GIS",           cor: "var(--clr-yellow)",hits: 5  },
];

// ── Buscas recentes ────────────────────────────────────────────
const RECENT_SEARCHES = [
  "SolidWorks licença",
  "Tableau BI analytics",
  "SAP ERP",
  "antivirus endpoint",
];

function formatValue(v: number | null, sigiloso: boolean) {
  if (sigiloso) return "🔒";
  if (!v) return "—";
  return v >= 1_000_000
    ? `R$ ${(v / 1_000_000).toFixed(1)}M`
    : `R$ ${(v / 1000).toFixed(0)}k`;
}

function daysLabel(dateStr: string) {
  const d = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
  if (d < 0) return { label: "Encerrado", color: "var(--muted-foreground)" };
  if (d === 0) return { label: "Hoje",    color: "var(--clr-red)"         };
  if (d <= 5)  return { label: `${d}d`,   color: "var(--clr-yellow)"      };
  return            { label: `${d}d`,   color: "var(--muted-foreground)" };
}

export function BuscaClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EditalAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [radars, setRadars] = useState(DEFAULT_RADARS);
  const [newRadar, setNewRadar] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.editais({ q });
      setResults(res.data);
    } catch {
      // Fallback mock
      const q2 = q.toLowerCase();
      setResults(
        MOCK_EDITAIS.filter(
          (e) =>
            e.titulo.toLowerCase().includes(q2) ||
            e.orgao.toLowerCase().includes(q2) ||
            e.softwares.some((s) => s.toLowerCase().includes(q2))
        ).map((e) => ({
          id: e.id,
          orgao_cnpj: e.orgao_cnpj,
          orgao_nome: e.orgao,
          esfera_id: e.esfera,
          modalidade_nome: e.modalidade,
          situacao_nome: e.status,
          objeto_compra: e.titulo,
          data_publicacao: e.data_abertura,
          data_fim_vigencia: e.data_encerramento,
          tem_resultado: e.status === "resultado",
          valor_global: e.valor_estimado,
          orcamento_sigiloso: e.orcamento_sigiloso,
          match_score: e.match_score,
          analisado_ia: e.analisado_ia,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce
  useEffect(() => {
    if (!query) { setResults([]); setSearched(false); return; }
    const t = setTimeout(() => doSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const addRadar = () => {
    if (!newRadar.trim()) return;
    setRadars((r) => [...r, {
      id: Date.now().toString(),
      termo: newRadar.trim(),
      cor: "var(--primary)",
      hits: 0,
    }]);
    setNewRadar("");
  };

  const removeRadar = (id: string) =>
    setRadars((r) => r.filter((x) => x.id !== id));

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">

      {/* ── Search bar principal ─────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: query ? "var(--glow-sm)" : "none",
          }}
        >
          {loading
            ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
            : <Search size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch(query)}
            placeholder="Buscar editais — software, órgão, número de controle, CNPJ..."
            className="flex-1 bg-transparent text-base outline-none"
            style={{ color: "var(--foreground)" }}
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); setSearched(false); inputRef.current?.focus(); }}>
              <X size={14} style={{ color: "var(--muted-foreground)" }} />
            </button>
          )}
          <kbd
            className="text-xs rounded px-1.5 py-0.5 font-mono hidden sm:block"
            style={{ background: "rgba(240,240,248,0.08)", color: "var(--muted-foreground)" }}
          >
            Enter
          </kbd>
        </div>

        {/* Buscas recentes */}
        {!query && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
              <Clock size={11} /> Recentes:
            </span>
            {RECENT_SEARCHES.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="text-xs px-2.5 py-1 rounded-md transition-colors duration-150 hover:bg-white/10"
                style={{
                  background: "rgba(79,142,247,0.08)",
                  border: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Resultados ──────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {searched && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3"
          >
            {/* Contagem */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-semibold" style={{ color: "var(--foreground)" }}>
                {results.length}
              </span>
              <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                {results.length === 1 ? "resultado" : "resultados"} para
              </span>
              <span
                className="text-sm font-medium px-2 py-0.5 rounded-md"
                style={{ background: "rgba(79,142,247,0.10)", color: "var(--primary)" }}
              >
                "{query}"
              </span>
            </div>

            {results.length === 0 ? (
              <div
                className="rounded-xl py-12 flex flex-col items-center gap-3"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <span className="text-3xl">🔍</span>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Nenhum edital encontrado.
                </p>
                <p className="text-xs" style={{ color: "var(--text-dim, rgba(240,240,248,0.30))" }}>
                  Tente termos diferentes ou aguarde a próxima coleta (6h).
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {results.map((edital, i) => {
                  const { label: dLabel, color: dColor } = daysLabel(edital.data_fim_vigencia);
                  const status = (edital.tem_resultado ? "resultado"
                    : dLabel === "Encerrado" ? "encerrado"
                    : dLabel === "Hoje" || parseInt(dLabel) <= 5 ? "encerrando"
                    : "ativo") as StatusId;

                  return (
                    <motion.div
                      key={edital.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                    >
                      <Link
                        href={`/editais/${edital.id}`}
                        className="group flex items-start gap-4 p-4 rounded-xl transition-colors duration-150 hover:bg-white/[0.025]"
                        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                      >
                        {/* Score circle */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0"
                          style={{
                            background: edital.match_score >= 80
                              ? "rgba(62,207,142,0.15)" : "rgba(79,142,247,0.12)",
                            color: edital.match_score >= 80
                              ? "var(--clr-green)" : "var(--primary)",
                          }}
                        >
                          {edital.match_score}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <EsferaBadge esfera={edital.esfera_id as EsferaId} />
                            <StatusBadge status={status} />
                            {edital.analisado_ia && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono"
                                style={{ background: "rgba(167,139,250,0.12)", color: "var(--clr-ai)" }}
                              >
                                <Sparkles size={10} /> IA
                              </span>
                            )}
                          </div>
                          <p
                            className="text-sm font-medium leading-snug truncate transition-colors group-hover:text-white"
                            style={{ color: "var(--foreground)" }}
                          >
                            {edital.objeto_compra}
                          </p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted-foreground)" }}>
                            {edital.orgao_nome}
                          </p>
                        </div>

                        {/* Meta */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-sm font-mono font-semibold" style={{ color: "var(--clr-green)" }}>
                            {formatValue(edital.valor_global, edital.orcamento_sigiloso)}
                          </span>
                          <span className="text-xs font-mono font-semibold" style={{ color: dColor }}>
                            {dLabel}
                          </span>
                        </div>

                        <ChevronRight
                          size={15}
                          className="shrink-0 mt-1 transition-transform group-hover:translate-x-0.5"
                          style={{ color: "var(--muted-foreground)" }}
                        />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Estado inicial — Radares */}
        {!searched && (
          <motion.div
            key="radars"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Keyword Radar */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ background: "rgba(79,142,247,0.04)", borderBottom: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2">
                  <Target size={14} style={{ color: "var(--primary)" }} />
                  <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    Keyword Radar
                  </h2>
                </div>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Termos monitorados permanentemente
                </span>
              </div>

              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {radars.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 px-5 py-3 group"
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: r.cor, boxShadow: `0 0 6px ${r.cor}` }}
                    />
                    <button
                      onClick={() => setQuery(r.termo)}
                      className="flex-1 text-left text-sm font-medium transition-colors hover:text-white"
                      style={{ color: "var(--foreground)" }}
                    >
                      {r.termo}
                    </button>
                    <div className="flex items-center gap-3">
                      <span
                        className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-md"
                        style={{ background: "rgba(62,207,142,0.10)", color: "var(--clr-green)" }}
                      >
                        <TrendingUp size={10} />
                        {r.hits} editais
                      </span>
                      <button
                        onClick={() => removeRadar(r.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={13} style={{ color: "var(--muted-foreground)" }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Adicionar novo radar */}
              <div
                className="flex items-center gap-2 px-5 py-3"
                style={{ borderTop: "1px solid var(--border)", background: "rgba(79,142,247,0.02)" }}
              >
                <Zap size={13} style={{ color: "var(--primary)", flexShrink: 0 }} />
                <input
                  type="text"
                  value={newRadar}
                  onChange={(e) => setNewRadar(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRadar()}
                  placeholder="Adicionar keyword ao radar..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--foreground)" }}
                />
                {newRadar && (
                  <button
                    onClick={addRadar}
                    className="text-xs px-3 py-1 rounded-md font-medium"
                    style={{ background: "var(--accent-grad)", color: "#0a0a0f" }}
                  >
                    Adicionar
                  </button>
                )}
              </div>
            </div>

            {/* Dica de busca */}
            <div
              className="rounded-xl p-5 flex flex-col gap-3"
              style={{
                background: "rgba(167,139,250,0.05)",
                border: "1px solid rgba(167,139,250,0.15)",
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={13} style={{ color: "var(--clr-ai)" }} />
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--clr-ai)" }}>
                  Dicas de Busca
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  ["NCM 84714900",          "todos editais classificados como software"],
                  ["licença subscription",  "contratos de licença recorrente"],
                  ["inexigibilidade",       "contratação direta — menos concorrência"],
                  ["municipal SP",          "prefeituras de SP — maior volume"],
                ].map(([cmd, desc]) => (
                  <button
                    key={cmd}
                    onClick={() => setQuery(cmd)}
                    className="flex flex-col gap-0.5 text-left p-3 rounded-lg transition-colors hover:bg-white/5"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    <span className="text-xs font-mono font-medium" style={{ color: "var(--primary)" }}>{cmd}</span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
