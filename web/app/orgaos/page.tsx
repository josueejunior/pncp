import { AppShell } from "@/components/layout/AppShell";
import Link from "next/link";
import { MOCK_ORGAO } from "@/components/orgaos/mock-orgao";
import { EsferaBadge } from "@/components/editais/StatusBadge";
import { Building2, TrendingUp, ChevronRight } from "lucide-react";

// Em produção: busca paginada via API Go
const MOCK_LISTA = Array.from({ length: 8 }, (_, i) => ({
  ...MOCK_ORGAO,
  cnpj: `${MOCK_ORGAO.cnpj}-${i}`,
  nome: [
    "Prefeitura Municipal de São Paulo",
    "Ministério da Educação",
    "Tribunal de Contas da União",
    "DNIT — Dept. Nacional de Infraestrutura",
    "Petróleo Brasileiro S.A.",
    "IBGE — Instituto Brasileiro de Geografia",
    "Governo do Estado do RS",
    "SENAI — Serviço Nacional Industrial",
  ][i],
  sigla: ["PMSP","MEC","TCU","DNIT","Petrobras","IBGE","RS-GOV","SENAI"][i],
  esfera: (["M","F","F","F","F","F","E","E"] as const)[i],
  editais_ativos: [3,2,0,1,2,1,0,1][i],
  total_editais_software: [34,28,18,21,14,12,8,9][i],
  valor_total_historico: [1_840_000,980_000,750_000,620_000,890_000,430_000,280_000,310_000][i],
}));

export default function OrgaosPage() {
  return (
    <AppShell
      title="Órgãos"
      subtitle="Histórico de contratações por órgão público"
    >
      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Órgãos Monitorados", value: "312",  color: "var(--primary)"   },
          { label: "Com Editais Ativos",  value: "47",   color: "var(--clr-green)" },
          { label: "Volume 12 meses",     value: "R$ 28M", color: "var(--clr-yellow)" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-4 flex flex-col gap-1"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <span className="text-xs uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
              {label}
            </span>
            <span className="text-2xl font-mono font-bold" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Tabela de órgãos */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="hidden lg:grid grid-cols-[1fr_90px_100px_120px_120px_44px] gap-4 px-5 py-3 text-xs font-medium uppercase tracking-widest"
          style={{
            background: "rgba(79,142,247,0.04)",
            borderBottom: "1px solid var(--border)",
            color: "var(--muted-foreground)",
          }}
        >
          <span>Órgão</span>
          <span>Esfera</span>
          <span>Ativos</span>
          <span>Editais SW</span>
          <span>Volume Total</span>
          <span />
        </div>

        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {MOCK_LISTA.map((org) => (
            <Link
              key={org.cnpj}
              href={`/orgaos/${encodeURIComponent(org.cnpj)}`}
              className="group lg:grid grid-cols-[1fr_90px_100px_120px_120px_44px] gap-4 px-5 py-4 flex flex-col transition-colors duration-150 hover:bg-white/[0.025]"
              style={{ display: "grid" } as React.CSSProperties}
            >
              {/* Nome */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0"
                  style={{ background: "rgba(79,142,247,0.10)", color: "var(--primary)" }}
                >
                  {org.sigla.slice(0, 2)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-sm font-medium truncate transition-colors duration-150 group-hover:text-white"
                    style={{ color: "var(--foreground)" }}
                  >
                    {org.nome}
                  </span>
                  <span className="text-xs font-mono truncate" style={{ color: "var(--muted-foreground)" }}>
                    {org.sigla} · {org.cnpj.replace(/-\d+$/, "")}
                  </span>
                </div>
              </div>

              {/* Esfera */}
              <div className="flex items-center">
                <EsferaBadge esfera={org.esfera} />
              </div>

              {/* Ativos */}
              <div className="flex items-center">
                {org.editais_ativos > 0 ? (
                  <span
                    className="inline-flex items-center gap-1.5 text-sm font-mono font-semibold"
                    style={{ color: "var(--clr-green)" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--clr-green)" }} />
                    {org.editais_ativos}
                  </span>
                ) : (
                  <span className="text-sm font-mono" style={{ color: "var(--muted-foreground)" }}>—</span>
                )}
              </div>

              {/* Total editais */}
              <div className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={13} style={{ color: "var(--primary)" }} />
                  <span className="text-sm font-mono tabular-nums" style={{ color: "var(--foreground)" }}>
                    {org.total_editais_software}
                  </span>
                </div>
              </div>

              {/* Volume */}
              <div className="flex items-center">
                <span className="text-sm font-mono font-semibold tabular-nums" style={{ color: "var(--clr-yellow)" }}>
                  R$ {(org.valor_total_historico / 1_000_000).toFixed(1)}M
                </span>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <ChevronRight
                  size={16}
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                  style={{ color: "var(--muted-foreground)" }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
