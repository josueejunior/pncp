import { AppShell } from "@/components/layout/AppShell";

export default function BuscaPage() {
  return (
    <AppShell title="Busca" subtitle="Pesquisa avançada de editais">
      <div
        className="rounded-xl p-12 flex flex-col items-center gap-3"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <span className="text-4xl">🔍</span>
        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Busca Avançada</p>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Em desenvolvimento — Semana 5</p>
      </div>
    </AppShell>
  );
}
