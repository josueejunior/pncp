import { AppShell } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { api, type DashboardStats } from "@/lib/api";
import {
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  Sparkles,
  Building2,
} from "lucide-react";

async function getStats(): Promise<DashboardStats> {
  try {
    return await api.dashboardStats();
  } catch {
    // Fallback para mock enquanto o backend não está rodando
    return {
      editais_ativos:     247,
      oportunidades:      38,
      valor_total:        4_820_000,
      encerrando_hoje:    7,
      analisados_ia:      1840,
      orgaos_monitorados: 312,
    };
  }
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <AppShell
      title="Dashboard"
      subtitle="Visão geral · atualizado há 3 min"
    >
      {/* KPIs linha 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard
          label="Editais Ativos"
          value={stats.editais_ativos}
          accent="blue"
          trend="up"
          trendValue="+18%"
          icon={<FileText size={14} />}
          delay={0}
        />
        <KpiCard
          label="Oportunidades"
          value={stats.oportunidades}
          accent="green"
          trend="up"
          trendValue="+5"
          icon={<CheckCircle2 size={14} />}
          delay={0.07}
        />
        <KpiCard
          label="Valor Total"
          value={stats.valor_total}
          format="currency"
          accent="yellow"
          trend="up"
          trendValue="+12%"
          icon={<DollarSign size={14} />}
          delay={0.14}
        />
        <KpiCard
          label="Encerrando Hoje"
          value={stats.encerrando_hoje}
          accent="red"
          trend="down"
          trendValue="-2"
          icon={<Clock size={14} />}
          delay={0.21}
        />
      </div>

      {/* KPIs linha 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <KpiCard
          label="Analisados por IA"
          value={stats.analisados_ia}
          suffix="editais"
          accent="ai"
          trend="up"
          trendValue="+320"
          icon={<Sparkles size={14} />}
          delay={0.28}
        />
        <KpiCard
          label="Órgãos Monitorados"
          value={stats.orgaos_monitorados}
          accent="blue"
          trend="neutral"
          trendValue="estável"
          icon={<Building2 size={14} />}
          delay={0.35}
        />
        <KpiCard
          label="Taxa de Match IA"
          value={94}
          format="percent"
          accent="green"
          trend="up"
          trendValue="+2pp"
          delay={0.42}
        />
      </div>

      {/* Corpo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AlertFeed />
        </div>

        <div className="flex flex-col gap-4">
          {/* Status do sistema */}
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>
              Status do Sistema
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { label: "Coletor Go",    status: "online", detail: "125 req/min" },
                { label: "Worker Gemini", status: "online", detail: "12 fila"     },
                { label: "API PNCP",      status: "online", detail: "142ms"       },
                { label: "Discord Bot",   status: "online", detail: "conectado"   },
              ].map(({ label, status, detail }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: status === "online" ? "var(--clr-green)" : "var(--clr-red)" }}
                    />
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>{label}</span>
                  </div>
                  <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top órgãos */}
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>
              Top Órgãos
            </h3>
            <div className="flex flex-col gap-2.5">
              {[
                { name: "Prefeitura SP",  count: 34, pct: 85 },
                { name: "Min. Educação",  count: 28, pct: 70 },
                { name: "DNIT",           count: 21, pct: 52 },
                { name: "TCU",            count: 18, pct: 45 },
                { name: "Petrobras",      count: 14, pct: 35 },
              ].map(({ name, count, pct }) => (
                <div key={name} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--foreground)" }}>{name}</span>
                    <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{count}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(79,142,247,0.10)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: "var(--accent-grad)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
