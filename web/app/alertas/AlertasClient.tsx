"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, Plus, Trash2, CheckCircle2, AlertTriangle,
  Webhook, Tag, Zap, TestTube, Eye, EyeOff, Copy, Check,
  Activity, BarChart3, Filter, ChevronRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Keyword {
  id: string;
  termo: string;
  ativo: boolean;
  hits_total: number;
  hits_semana: number;
  ultimo_hit?: string;
}

interface WebhookConfig {
  id: string;
  nome: string;
  url: string;
  ativo: boolean;
  eventos: EventType[];
  ultimo_envio?: string;
  total_enviados: number;
}

type EventType = "novo_edital" | "encerrando" | "resultado" | "analise_ia";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_KEYWORDS: Keyword[] = [
  { id: "1", termo: "licença software",      ativo: true,  hits_total: 142, hits_semana: 17, ultimo_hit: "2026-03-25" },
  { id: "2", termo: "AutoCAD Autodesk",       ativo: true,  hits_total: 89,  hits_semana: 9,  ultimo_hit: "2026-03-26" },
  { id: "3", termo: "Microsoft 365 Office",   ativo: true,  hits_total: 201, hits_semana: 24, ultimo_hit: "2026-03-26" },
  { id: "4", termo: "ERP sistema gestão",     ativo: true,  hits_total: 67,  hits_semana: 5,  ultimo_hit: "2026-03-24" },
  { id: "5", termo: "Adobe Creative Cloud",   ativo: false, hits_total: 28,  hits_semana: 0  },
  { id: "6", termo: "antivirus endpoint",     ativo: true,  hits_total: 55,  hits_semana: 8,  ultimo_hit: "2026-03-25" },
];

const MOCK_WEBHOOKS: WebhookConfig[] = [
  {
    id: "1",
    nome: "Canal #licitações",
    url: "https://discord.com/api/webhooks/111.../aaa...",
    ativo: true,
    eventos: ["novo_edital", "encerrando", "resultado", "analise_ia"],
    ultimo_envio: "2026-03-26T08:42:00Z",
    total_enviados: 347,
  },
  {
    id: "2",
    nome: "Canal #urgentes",
    url: "https://discord.com/api/webhooks/222.../bbb...",
    ativo: true,
    eventos: ["encerrando"],
    ultimo_envio: "2026-03-25T14:10:00Z",
    total_enviados: 61,
  },
];

const EVENT_LABELS: Record<EventType, { label: string; color: string; desc: string }> = {
  novo_edital:  { label: "Novo Edital",     color: "var(--clr-blue)",   desc: "Quando um edital novo é detectado" },
  encerrando:   { label: "Encerrando",      color: "var(--clr-yellow)", desc: "Editais com ≤5 dias para encerrar" },
  resultado:    { label: "Resultado",       color: "var(--clr-green)",  desc: "Quando o vencedor é divulgado" },
  analise_ia:   { label: "Análise IA",      color: "var(--clr-ai)",     desc: "Quando o Gemini termina extração" },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function KeywordRow({ kw, onToggle, onDelete }: {
  kw: Keyword;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const barMax = 30;
  const barW = Math.min((kw.hits_semana / barMax) * 100, 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12, height: 0 }}
      className="flex items-center gap-4 px-4 py-3 rounded-lg transition-colors"
      style={{
        background: kw.ativo ? "rgba(79,142,247,0.04)" : "transparent",
        border: `1px solid ${kw.ativo ? "rgba(79,142,247,0.12)" : "var(--border)"}`,
      }}
    >
      {/* Toggle */}
      <button
        onClick={() => onToggle(kw.id)}
        className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-all"
        style={{
          background: kw.ativo ? "rgba(79,142,247,0.15)" : "rgba(255,255,255,0.04)",
          color: kw.ativo ? "var(--clr-blue)" : "var(--muted-foreground)",
        }}
      >
        {kw.ativo ? <Bell size={14} /> : <BellOff size={14} />}
      </button>

      {/* Termo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium truncate"
            style={{ color: kw.ativo ? "var(--foreground)" : "var(--muted-foreground)" }}
          >
            {kw.termo}
          </span>
          {kw.ativo && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: "rgba(79,142,247,0.12)", color: "var(--clr-blue)" }}
            >
              ATIVO
            </span>
          )}
        </div>
        {kw.ultimo_hit && (
          <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            último match: {new Date(kw.ultimo_hit).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 shrink-0">
        {/* Mini sparkbar */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-mono" style={{ color: "var(--muted-foreground)" }}>
            {kw.hits_semana} esta semana
          </span>
          <div className="w-24 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${barW}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ background: kw.ativo ? "var(--clr-blue)" : "var(--muted-foreground)" }}
            />
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-mono font-bold" style={{ color: "var(--foreground)" }}>
            {kw.hits_total.toLocaleString("pt-BR")}
          </div>
          <div className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>total</div>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(kw.id)}
          className="w-7 h-7 rounded-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:opacity-100"
          style={{ background: "rgba(239,68,68,0.1)", color: "var(--clr-red)" }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

function EventBadge({ event, active, onClick }: {
  event: EventType;
  active: boolean;
  onClick: () => void;
}) {
  const cfg = EVENT_LABELS[event];
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all"
      style={{
        background: active ? `${cfg.color}18` : "rgba(255,255,255,0.04)",
        color: active ? cfg.color : "var(--muted-foreground)",
        border: `1px solid ${active ? `${cfg.color}30` : "transparent"}`,
      }}
      title={cfg.desc}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: active ? cfg.color : "var(--muted-foreground)" }}
      />
      {cfg.label}
    </button>
  );
}

function WebhookCard({ wh, onTest, onToggle, onDelete }: {
  wh: WebhookConfig;
  onTest: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showUrl, setShowUrl] = useState(false);
  const [copied, setCopied] = useState(false);

  const maskedUrl = wh.url.replace(/\/webhooks\/.*/, "/webhooks/***");

  function copyUrl() {
    navigator.clipboard.writeText(wh.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--card)",
        border: `1px solid ${wh.ativo ? "rgba(79,142,247,0.20)" : "var(--border)"}`,
      }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{
              background: wh.ativo ? "rgba(79,142,247,0.12)" : "rgba(255,255,255,0.04)",
              color: wh.ativo ? "var(--clr-blue)" : "var(--muted-foreground)",
            }}
          >
            <Webhook size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{wh.nome}</span>
              {wh.ativo ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(62,207,142,0.12)", color: "var(--clr-green)" }}>
                  ONLINE
                </span>
              ) : (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "var(--muted-foreground)" }}>
                  PAUSADO
                </span>
              )}
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {wh.total_enviados.toLocaleString("pt-BR")} alertas enviados
              {wh.ultimo_envio && ` · último: ${new Date(wh.ultimo_envio).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onTest(wh.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{ background: "rgba(167,139,250,0.10)", color: "var(--clr-ai)", border: "1px solid rgba(167,139,250,0.20)" }}
          >
            <TestTube size={12} />
            Testar
          </button>
          <button
            onClick={() => onToggle(wh.id)}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.04)", color: "var(--muted-foreground)" }}
          >
            {wh.ativo ? <BellOff size={14} /> : <Bell size={14} />}
          </button>
          <button
            onClick={() => onDelete(wh.id)}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-all"
            style={{ background: "rgba(239,68,68,0.08)", color: "var(--clr-red)" }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* URL + Eventos */}
      <div className="px-5 py-4 flex flex-col gap-4">
        {/* URL row */}
        <div className="flex items-center gap-2">
          <code
            className="flex-1 text-xs font-mono px-3 py-2 rounded-md truncate"
            style={{ background: "rgba(255,255,255,0.04)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
          >
            {showUrl ? wh.url : maskedUrl}
          </code>
          <button
            onClick={() => setShowUrl(!showUrl)}
            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", color: "var(--muted-foreground)" }}
          >
            {showUrl ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button
            onClick={copyUrl}
            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-all"
            style={{
              background: copied ? "rgba(62,207,142,0.12)" : "rgba(255,255,255,0.04)",
              color: copied ? "var(--clr-green)" : "var(--muted-foreground)",
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>

        {/* Eventos */}
        <div>
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)" }}>
            Eventos monitorados
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(EVENT_LABELS) as EventType[]).map((ev) => (
              <EventBadge key={ev} event={ev} active={wh.eventos.includes(ev)} onClick={() => {}} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function AlertasClient() {
  const [keywords, setKeywords] = useState<Keyword[]>(MOCK_KEYWORDS);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(MOCK_WEBHOOKS);
  const [newKeyword, setNewKeyword] = useState("");
  const [newWebhookNome, setNewWebhookNome] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [testStatus, setTestStatus] = useState<Record<string, "idle" | "sending" | "ok" | "err">>({});
  const [tab, setTab] = useState<"keywords" | "webhooks">("keywords");
  const inputRef = useRef<HTMLInputElement>(null);

  // Stats
  const activeKw = keywords.filter((k) => k.ativo).length;
  const totalHits = keywords.reduce((s, k) => s + k.hits_semana, 0);
  const activeWh = webhooks.filter((w) => w.ativo).length;
  const totalSent = webhooks.reduce((s, w) => s + w.total_enviados, 0);

  function addKeyword() {
    const t = newKeyword.trim();
    if (!t || keywords.some((k) => k.termo.toLowerCase() === t.toLowerCase())) return;
    const kw: Keyword = {
      id: Date.now().toString(),
      termo: t,
      ativo: true,
      hits_total: 0,
      hits_semana: 0,
    };
    setKeywords((prev) => [kw, ...prev]);
    setNewKeyword("");
    inputRef.current?.focus();
  }

  function toggleKeyword(id: string) {
    setKeywords((prev) => prev.map((k) => k.id === id ? { ...k, ativo: !k.ativo } : k));
  }

  function deleteKeyword(id: string) {
    setKeywords((prev) => prev.filter((k) => k.id !== id));
  }

  function addWebhook() {
    const nome = newWebhookNome.trim();
    const url = newWebhookUrl.trim();
    if (!nome || !url) return;
    const wh: WebhookConfig = {
      id: Date.now().toString(),
      nome,
      url,
      ativo: true,
      eventos: ["novo_edital", "encerrando"],
      total_enviados: 0,
    };
    setWebhooks((prev) => [wh, ...prev]);
    setNewWebhookNome("");
    setNewWebhookUrl("");
  }

  function toggleWebhook(id: string) {
    setWebhooks((prev) => prev.map((w) => w.id === id ? { ...w, ativo: !w.ativo } : w));
  }

  function deleteWebhook(id: string) {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  }

  async function testWebhook(id: string) {
    setTestStatus((prev) => ({ ...prev, [id]: "sending" }));
    await new Promise((r) => setTimeout(r, 1200));
    setTestStatus((prev) => ({ ...prev, [id]: "ok" }));
    setTimeout(() => setTestStatus((prev) => ({ ...prev, [id]: "idle" })), 3000);
  }

  const TABS = [
    { id: "keywords" as const, label: "Radar de Termos", icon: Tag, count: activeKw },
    { id: "webhooks" as const, label: "Webhooks Discord", icon: Webhook, count: activeWh },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── KPI Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Termos Ativos",     value: activeKw,                    icon: Tag,       color: "var(--clr-blue)"   },
          { label: "Hits Esta Semana",  value: totalHits,                   icon: Activity,  color: "var(--clr-green)"  },
          { label: "Webhooks Online",   value: activeWh,                    icon: Webhook,   color: "var(--clr-ai)"     },
          { label: "Alertas Enviados",  value: totalSent.toLocaleString("pt-BR"), icon: Zap, color: "var(--clr-yellow)" },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl px-5 py-4 flex items-center gap-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${kpi.color}15`, color: kpi.color }}
            >
              <kpi.icon size={17} />
            </div>
            <div>
              <div className="text-lg font-bold font-mono leading-tight" style={{ color: "var(--foreground)" }}>
                {kpi.value}
              </div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{kpi.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.id ? "var(--card)" : "transparent",
              color: tab === t.id ? "var(--foreground)" : "var(--muted-foreground)",
              boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
            }}
          >
            <t.icon size={14} />
            {t.label}
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: tab === t.id ? "rgba(79,142,247,0.15)" : "rgba(255,255,255,0.06)",
                color: tab === t.id ? "var(--clr-blue)" : "var(--muted-foreground)",
              }}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {tab === "keywords" && (
          <motion.div
            key="keywords"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-4"
          >
            {/* Add keyword */}
            <div
              className="rounded-xl px-5 py-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Tag size={14} style={{ color: "var(--clr-blue)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Adicionar Termo de Busca
                </span>
              </div>
              <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
                O coletor monitora estes termos a cada 6h no PNCP. Use termos específicos para menos ruído.
              </p>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                  placeholder="Ex: Corel Draw licença perpetua..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                />
                <button
                  onClick={addKeyword}
                  disabled={!newKeyword.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                  style={{ background: "var(--primary)", color: "white" }}
                >
                  <Plus size={14} />
                  Adicionar
                </button>
              </div>
            </div>

            {/* List */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <Filter size={13} style={{ color: "var(--muted-foreground)" }} />
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                    {keywords.length} Termos Monitorados
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {activeKw} ativos · {keywords.length - activeKw} pausados
                  </span>
                </div>
              </div>

              <div className="p-3 flex flex-col gap-2 group">
                <AnimatePresence initial={false}>
                  {keywords.map((kw) => (
                    <KeywordRow
                      key={kw.id}
                      kw={kw}
                      onToggle={toggleKeyword}
                      onDelete={deleteKeyword}
                    />
                  ))}
                </AnimatePresence>
                {keywords.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhum termo configurado</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tip */}
            <div
              className="rounded-xl px-5 py-4 flex items-start gap-3"
              style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)" }}
            >
              <div className="mt-0.5 shrink-0" style={{ color: "var(--clr-ai)" }}>
                <Zap size={14} />
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--clr-ai)" }}>Dica do Coletor</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  Use termos compostos para maior precisão:{" "}
                  <code className="px-1 py-0.5 rounded text-[10px]" style={{ background: "rgba(255,255,255,0.06)", color: "var(--foreground)" }}>
                    "licença software 84714900"
                  </code>{" "}
                  combina produto + NCM fiscal. Evite termos muito genéricos como{" "}
                  <code className="px-1 py-0.5 rounded text-[10px]" style={{ background: "rgba(255,255,255,0.06)", color: "var(--foreground)" }}>
                    "software"
                  </code>{" "}
                  que geram centenas de resultados irrelevantes.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {tab === "webhooks" && (
          <motion.div
            key="webhooks"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-4"
          >
            {/* Add webhook */}
            <div
              className="rounded-xl px-5 py-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Webhook size={14} style={{ color: "var(--clr-ai)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Conectar Webhook Discord
                </span>
              </div>
              <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
                Crie um webhook no Discord: Canal → Integrações → Novo Webhook → Copiar URL
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newWebhookNome}
                  onChange={(e) => setNewWebhookNome(e.target.value)}
                  placeholder="Nome (ex: #licitações-tech)"
                  className="w-full sm:w-48 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                />
                <input
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addWebhook()}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none font-mono"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                />
                <button
                  onClick={addWebhook}
                  disabled={!newWebhookNome.trim() || !newWebhookUrl.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 shrink-0"
                  style={{ background: "var(--primary)", color: "white" }}
                >
                  <Plus size={14} />
                  Conectar
                </button>
              </div>
            </div>

            {/* Webhooks list */}
            <AnimatePresence initial={false}>
              {webhooks.map((wh) => (
                <WebhookCard
                  key={wh.id}
                  wh={{
                    ...wh,
                    // Overlay test status
                    ativo: wh.ativo,
                  }}
                  onTest={testWebhook}
                  onToggle={toggleWebhook}
                  onDelete={deleteWebhook}
                />
              ))}
            </AnimatePresence>

            {/* Test status toasts */}
            <AnimatePresence>
              {Object.entries(testStatus).map(([id, status]) =>
                status !== "idle" ? (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-6 right-6 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-lg z-50"
                    style={{
                      background: status === "ok" ? "rgba(62,207,142,0.15)" : status === "err" ? "rgba(239,68,68,0.15)" : "rgba(167,139,250,0.15)",
                      border: `1px solid ${status === "ok" ? "rgba(62,207,142,0.30)" : status === "err" ? "rgba(239,68,68,0.30)" : "rgba(167,139,250,0.30)"}`,
                      color: status === "ok" ? "var(--clr-green)" : status === "err" ? "var(--clr-red)" : "var(--clr-ai)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    {status === "sending" && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--clr-ai)" }} />}
                    {status === "ok" && <CheckCircle2 size={15} />}
                    {status === "err" && <AlertTriangle size={15} />}
                    {status === "sending" ? "Enviando teste..." : status === "ok" ? "Webhook funcionando!" : "Erro no webhook"}
                  </motion.div>
                ) : null
              )}
            </AnimatePresence>

            {/* How-to guide */}
            <div
              className="rounded-xl px-5 py-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--muted-foreground)" }}>
                Como criar um Webhook no Discord
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { n: "1", text: "Abra o Discord e vá até o canal que deseja receber os alertas" },
                  { n: "2", text: "Clique em Configurações do Canal → Integrações → Criar Webhook" },
                  { n: "3", text: "Dê um nome ao bot (ex: PNCP Intel) e copie a URL do webhook" },
                  { n: "4", text: "Cole a URL acima e escolha quais eventos notificar" },
                ].map((step) => (
                  <div key={step.n} className="flex items-start gap-3">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                      style={{ background: "rgba(79,142,247,0.15)", color: "var(--clr-blue)" }}
                    >
                      {step.n}
                    </span>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
