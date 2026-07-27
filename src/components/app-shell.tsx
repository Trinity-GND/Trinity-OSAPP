import Sidebar from "./sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-cream">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
