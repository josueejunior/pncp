import { AppShell } from "@/components/layout/AppShell";

export default function ConfiguracoesPage() {
  return (
    <AppShell title="Configurações" subtitle="Preferências do sistema">
      <div
        className="rounded-xl p-12 flex flex-col items-center gap-3"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <span className="text-4xl">⚙️</span>
        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Configurações</p>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Em desenvolvimento — Semana 9</p>
      </div>
    </AppShell>
  );
}
