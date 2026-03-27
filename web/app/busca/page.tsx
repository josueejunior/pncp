import { AppShell } from "@/components/layout/AppShell";
import { BuscaClient } from "./BuscaClient";

export default function BuscaPage() {
  return (
    <AppShell title="Busca" subtitle="Pesquisa inteligente de editais">
      <BuscaClient />
    </AppShell>
  );
}
