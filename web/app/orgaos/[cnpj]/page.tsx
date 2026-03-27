import { AppShell } from "@/components/layout/AppShell";
import { HistoricoChart } from "@/components/orgaos/HistoricoChart";
import { MOCK_ORGAO } from "@/components/orgaos/mock-orgao";
import { EsferaBadge } from "@/components/editais/StatusBadge";
import Link from "next/link";
import { ArrowLeft, Globe, TrendingUp, Award, RefreshCw } from "lucide-react";

interface Props {
  params: Promise<{ cnpj: string }>;
}

export default async function OrgaoDossie({ params }: Props) {
  // Em produção: buscar dados pelo CNPJ via API Go
  const orgao = MOCK_ORGAO;

  const kpis = [
    { label: "Editais de SW",    value: orgao.total_editais_software, suffix: "total",      color: "var(--primary)",    icon: <TrendingUp size={14} /> },
    { label: "Volume Histórico", value: `R$ ${(orgao.valor_total_historico / 1_000_000).toFixed(1)}M`, raw: true, color: "var(--clr-green)", icon: <Award size={14} /> },
    { label: "Ticket Médio",     value: `R$ ${orgao.ticket_medio.toLocaleString("pt-BR")}`, raw: true, color: "var(--clr-yellow)", icon: <Award size={14} /> },
    { label: "Taxa de Renovação",value: orgao.taxa_renovacao, suffix: "%",                  color: "var(--clr-ai)",     icon: <RefreshCw size={14} /> },
  ];

  return (
    <AppShell
      title={`Dossiê — ${orgao.sigla}`}
      subtitle={orgao.nome}
    >
      {/* Voltar */}
      <Link
        href="/editais"
        className="inline-flex items-center gap-2 text-sm mb-6 transition-colors duration-150 hover:text-white"
        style={{ color: "var(--muted-foreground)" }}
      >
        <ArrowLeft size={15} />
        Voltar para Editais
      </Link>

      {/* Header do órgão */}
      <div
        className="rounded-xl p-6 mb-6"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <EsferaBadge esfera={orgao.esfera} />
              <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
                CNPJ {orgao.cnpj}
              </span>
            </div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
              {orgao.nome}
            </h1>
            <p className="text-sm font-mono" style={{ color: "var(--muted-foreground)" }}>
              {orgao.uf} · Última contratação: {new Date(orgao.ultima_contratacao).toLocaleDateString("pt-BR")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Editais ativos badge */}
            <div
              className="flex flex-col items-center px-5 py-3 rounded-xl"
              style={{
                background: orgao.editais_ativos > 0 ? "rgba(62,207,142,0.10)" : "rgba(240,240,248,0.05)",
                border: `1px solid ${orgao.editais_ativos > 0 ? "rgba(62,207,142,0.25)" : "var(--border)"}`,
              }}
            >
              <span className="text-2xl font-mono font-bold" style={{ color: "var(--clr-green)" }}>
                {orgao.editais_ativos}
              </span>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>ativos agora</span>
            </div>

            {orgao.site && (
              <a
                href={orgao.site}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-opacity duration-150 hover:opacity-80"
                style={{
                  background: "rgba(79,142,247,0.08)",
                  border: "1px solid var(--border)",
                  color: "var(--primary)",
                }}
              >
                <Globe size={14} />
                Site oficial
              </a>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(({ label, value, suffix, raw, color, icon }) => (
          <div
            key={label}
            className="rounded-xl p-5 flex flex-col gap-2"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                {label}
              </span>
              <div className="p-1.5 rounded-md" style={{ background: `${color}15`, color }}>
                {icon}
              </div>
            </div>
            <span className="text-2xl font-mono font-bold tabular-nums" style={{ color }}>
              {raw ? value : `${value}${suffix ?? ""}`}
            </span>
          </div>
        ))}
      </div>

      {/* Corpo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Histórico + softwares */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Gráfico histórico */}
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-sm font-semibold mb-5" style={{ color: "var(--foreground)" }}>
              Volume de Contratações por Ano
            </h3>
            <HistoricoChart data={orgao.historico_anual} />
          </div>

          {/* Top fornecedores */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            <div
              className="px-5 py-4"
              style={{ background: "rgba(79,142,247,0.04)", borderBottom: "1px solid var(--border)" }}
            >
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Top Fornecedores Vencedores
              </h3>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {orgao.top_fornecedores.map((f, i) => (
                <div key={f.cnpj} className="flex items-center gap-4 px-5 py-3.5">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0"
                    style={{
                      background: i === 0 ? "rgba(245,166,35,0.15)" : "rgba(240,240,248,0.06)",
                      color: i === 0 ? "var(--clr-yellow)" : "var(--muted-foreground)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                      {f.nome}
                    </p>
                    <p className="text-xs font-mono truncate" style={{ color: "var(--muted-foreground)" }}>
                      {f.softwares.join(" · ")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-sm font-mono font-semibold" style={{ color: "var(--clr-green)" }}>
                      R$ {(f.valor_total / 1000).toFixed(0)}k
                    </span>
                    <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
                      {f.vitorias} vitórias
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          {/* Softwares mais comprados */}
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>
              Softwares Mais Adquiridos
            </h3>
            <div className="flex flex-col gap-3">
              {orgao.softwares_frequentes.map(({ nome, count }) => {
                const max = orgao.softwares_frequentes[0].count;
                const pct = (count / max) * 100;
                return (
                  <div key={nome} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{nome}</span>
                      <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{count}×</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(79,142,247,0.10)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: "var(--accent-grad)", transition: "width 0.7s ease-out" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inteligência IA sobre o órgão */}
          <div
            className="rounded-xl p-5"
            style={{
              background: "rgba(167,139,250,0.06)",
              border: "1px solid rgba(167,139,250,0.18)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--clr-ai)" }} />
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--clr-ai)" }}>
                Intel IA
              </h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
              Este órgão tem histórico de{" "}
              <span style={{ color: "var(--clr-yellow)" }}>renovação de 78%</span> nos contratos de software.
              Compram majoritariamente{" "}
              <span style={{ color: "var(--primary)" }}>AutoCAD e Microsoft 365</span> em ciclos anuais.
              A janela ideal para prospecção é{" "}
              <span style={{ color: "var(--clr-green)" }}>Jan–Fev</span>{" "}
              (histórico de abertura de editais).
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
