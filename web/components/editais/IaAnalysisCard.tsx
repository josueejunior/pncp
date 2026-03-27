"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useTypewriter } from "./useTypewriter";
import type { ExtracaoIA } from "@/lib/api";

interface IaField {
  label: string;
  value: string;
  highlight?: "green" | "yellow" | "red" | "ai";
}

interface IaAnalysis {
  software_nome: string;
  fabricante: string;
  tipo_licenca: string;
  quantidade: string;
  prazo_meses: string;
  valor_estimado: string;
  marca_exigida: boolean;
  permite_equivalente: boolean;
  criterio_julgamento: string;
  resumo: string;
  oportunidade: "alta" | "media" | "baixa";
  riscos: string[];
  vantagens: string[];
}

const MOCK_ANALYSIS: IaAnalysis = {
  software_nome: "Autodesk AutoCAD 2025",
  fabricante: "Autodesk Inc.",
  tipo_licenca: "Subscription anual",
  quantidade: "15 licenças",
  prazo_meses: "12 meses",
  valor_estimado: "R$ 48.000 (R$ 3.200/licença)",
  marca_exigida: true,
  permite_equivalente: false,
  criterio_julgamento: "Menor preço",
  resumo:
    "Edital de alto interesse. Órgão de grande porte com histórico de renovação anual. Marca exigida = sem concorrência de equivalentes. Ticket médio dentro do padrão de mercado.",
  oportunidade: "alta",
  riscos: ["Prazo de entrega de 15 dias úteis", "Exige nota fiscal em nome do órgão"],
  vantagens: ["Marca fechada — Autodesk exclusivo", "Histórico: mesmo órgão renovou nos últimos 3 anos"],
};

function TypewriterField({ label, value, highlight, active, delay }: IaField & { active: boolean; delay: number }) {
  const { display, done } = useTypewriter(value, active, delay);

  const color =
    highlight === "green" ? "var(--clr-green)" :
    highlight === "yellow" ? "var(--clr-yellow)" :
    highlight === "red" ? "var(--clr-red)" :
    highlight === "ai" ? "var(--clr-ai)" :
    "var(--foreground)";

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </span>
      <span
        className="text-sm font-mono font-medium"
        style={{
          color,
          opacity: done ? 1 : 0.85,
          letterSpacing: done ? undefined : "0.05em",
        }}
      >
        {display || "—"}
      </span>
    </div>
  );
}

interface Props {
  extracao?: ExtracaoIA | null;
}

export function IaAnalysisCard({ extracao }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // Se já temos extração do backend, começa como "done"
  const [processing, setProcessing] = useState(!!extracao);
  const [done, setDone] = useState(!!extracao);
  const [expanded, setExpanded] = useState(false);

  // Usa dados reais se disponíveis, senão usa mock
  const analysis = extracao ? {
    ...MOCK_ANALYSIS,
    software_nome:       extracao.software_nome       ?? MOCK_ANALYSIS.software_nome,
    fabricante:          extracao.fabricante           ?? MOCK_ANALYSIS.fabricante,
    tipo_licenca:        extracao.tipo_licenca         ?? MOCK_ANALYSIS.tipo_licenca,
    quantidade:          extracao.quantidade != null   ? String(extracao.quantidade) + " licenças" : analysis.quantidade,
    prazo_meses:         extracao.prazo_meses != null  ? String(extracao.prazo_meses) + " meses" : MOCK_ANALYSIS.prazo_meses,
    valor_estimado:      extracao.valor_estimado != null ? `R$ ${extracao.valor_estimado.toLocaleString("pt-BR")}` : MOCK_ANALYSIS.valor_estimado,
    marca_exigida:       extracao.marca_exigida,
    permite_equivalente: extracao.permite_equivalente,
    criterio_julgamento: extracao.criterio_julgamento  ?? MOCK_ANALYSIS.criterio_julgamento,
    resumo:              extracao.resumo               ?? MOCK_ANALYSIS.resumo,
  } : MOCK_ANALYSIS;

  useEffect(() => {
    if (extracao) return; // já tem dados — não simula
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Simula latência do Gemini
          setTimeout(() => setProcessing(true), 400);
          setTimeout(() => setDone(true), 2000);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fields: (IaField & { delay: number })[] = [
    { label: "Software",        value: analysis.software_nome,       delay: 0,   highlight: "ai"    },
    { label: "Fabricante",      value: analysis.fabricante,          delay: 80               },
    { label: "Tipo de Licença", value: analysis.tipo_licenca,        delay: 160              },
    { label: "Quantidade",      value: analysis.quantidade,          delay: 240, highlight: "green" },
    { label: "Prazo",           value: MOCK_ANALYSIS.prazo_meses,         delay: 320              },
    { label: "Valor Estimado",  value: MOCK_ANALYSIS.valor_estimado,      delay: 400, highlight: "green" },
    { label: "Critério",        value: MOCK_ANALYSIS.criterio_julgamento, delay: 480              },
    { label: "Marca Exigida",   value: MOCK_ANALYSIS.marca_exigida ? "Sim — exclusivo" : "Não", delay: 560, highlight: MOCK_ANALYSIS.marca_exigida ? "yellow" : "green" },
  ];

  const oportunidadeColor =
    MOCK_ANALYSIS.oportunidade === "alta" ? "var(--clr-green)" :
    MOCK_ANALYSIS.oportunidade === "media" ? "var(--clr-yellow)" :
    "var(--clr-red)";

  return (
    <div
      ref={ref}
      className={processing && !done ? "ai-pulse-border" : ""}
      style={
        !processing
          ? { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }
          : done
          ? { background: "var(--card)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: "var(--radius)" }
          : undefined
      }
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="p-1.5 rounded-md"
            style={{ background: "rgba(167,139,250,0.12)", color: "var(--clr-ai)" }}
          >
            <Sparkles size={14} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Análise IA — Gemini
            </h3>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Extração estruturada do edital PDF
            </p>
          </div>
        </div>

        {/* Estado */}
        <AnimatePresence mode="wait">
          {!processing && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-md"
              style={{ background: "rgba(240,240,248,0.06)", color: "var(--muted-foreground)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--muted-foreground)" }} />
              Aguardando
            </motion.div>
          )}
          {processing && !done && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-md"
              style={{ background: "rgba(167,139,250,0.12)", color: "var(--clr-ai)", border: "1px solid rgba(167,139,250,0.25)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--clr-ai)" }} />
              Processando PDF...
            </motion.div>
          )}
          {done && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-md"
              style={{ background: "rgba(62,207,142,0.10)", color: "var(--clr-green)", border: "1px solid rgba(62,207,142,0.20)" }}
            >
              <CheckCircle2 size={12} />
              Concluído
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Campos extraídos */}
      <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-5">
        {fields.map((f) => (
          <TypewriterField key={f.label} {...f} active={processing} />
        ))}
      </div>

      {/* Resumo IA */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="px-5 pb-4 flex flex-col gap-4" style={{ borderTop: "1px solid var(--border)" }}>
              {/* Score oportunidade */}
              <div className="pt-4 flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                  Score de Oportunidade
                </span>
                <span
                  className="text-sm font-mono font-bold px-3 py-1 rounded-md"
                  style={{
                    background: `${oportunidadeColor}18`,
                    color: oportunidadeColor,
                    border: `1px solid ${oportunidadeColor}30`,
                  }}
                >
                  {MOCK_ANALYSIS.oportunidade.toUpperCase()}
                </span>
              </div>

              {/* Resumo */}
              <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                {MOCK_ANALYSIS.resumo}
              </p>

              {/* Expand vantagens/riscos */}
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-xs font-medium transition-colors duration-150"
                style={{ color: "var(--clr-ai)" }}
              >
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {expanded ? "Menos detalhes" : "Ver vantagens e riscos"}
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden"
                  >
                    {/* Vantagens */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--clr-green)" }}>
                        Vantagens
                      </span>
                      {MOCK_ANALYSIS.vantagens.map((v) => (
                        <div key={v} className="flex items-start gap-2">
                          <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: "var(--clr-green)" }} />
                          <span className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    {/* Riscos */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--clr-yellow)" }}>
                        Atenção
                      </span>
                      {MOCK_ANALYSIS.riscos.map((r) => (
                        <div key={r} className="flex items-start gap-2">
                          <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: "var(--clr-yellow)" }} />
                          <span className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{r}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
