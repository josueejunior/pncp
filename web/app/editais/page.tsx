import { AppShell } from "@/components/layout/AppShell";
import { EditaisClient } from "./EditaisClient";

export default function EditaisPage() {
  return (
    <AppShell
      title="Editais"
      subtitle="Monitoramento de licitações de software"
    >
      <EditaisClient />
    </AppShell>
  );
}
