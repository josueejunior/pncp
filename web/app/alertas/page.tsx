import { AppShell } from "@/components/layout/AppShell";

export default function AlertasPage() {
  return (
    <AppShell title="Alertas" subtitle="Configuração de notificações Discord">
      <div
        className="rounded-xl p-12 flex flex-col items-center gap-3"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <span className="text-4xl">🔔</span>
        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Alertas Discord</p>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Em desenvolvimento — Semana 3</p>
      </div>
    </AppShell>
  );
}
