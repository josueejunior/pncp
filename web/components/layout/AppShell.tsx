import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AppShell({ children, title, subtitle }: AppShellProps) {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Ambient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <Sidebar />
      <Topbar title={title} subtitle={subtitle} />

      {/* Main content */}
      <main
        className="relative z-10"
        style={{
          marginLeft: "var(--sidebar-w)",
          paddingTop: "var(--nav-h)",
          minHeight: "100vh",
        }}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
